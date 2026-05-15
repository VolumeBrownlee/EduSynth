/**
 * Text Processing Utilities for RAG Pipeline
 * Handles text chunking, cleaning, and preprocessing
 */

class TextProcessor {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 1000;
    this.chunkOverlap = options.chunkOverlap || 200;
    this.minChunkSize = options.minChunkSize || 100;
  }

  /**
   * Clean and normalize text
   */
  cleanText(text) {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that don't add meaning
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Split text into sentences
   */
  splitIntoSentences(text) {
    // Simple sentence splitting - can be enhanced with NLP libraries
    return text
      .replace(/([.!?])\s+/g, '$1|')
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Split text into paragraphs
   */
  splitIntoParagraphs(text) {
    return text
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  /**
   * Extract keywords from text (simple implementation)
   */
  extractKeywords(text, maxKeywords = 10) {
    // Remove common stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
      'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
      'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'under', 'and', 'but', 'or', 'yet', 'so', 'if',
      'because', 'although', 'though', 'while', 'where', 'when', 'that',
      'which', 'who', 'whom', 'whose', 'what', 'this', 'these', 'those',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
      'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their'
    ]);

    const words = text.toLowerCase()
      .replace(/[^a-zA-Z\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    // Count word frequency
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Sort by frequency and return top keywords
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * Create overlapping chunks from text
   */
  createChunks(text, metadata = {}) {
    const cleanedText = this.cleanText(text);
    const chunks = [];
    
    // If text is smaller than chunk size, return as single chunk
    if (cleanedText.length <= this.chunkSize) {
      return [{
        content: cleanedText,
        metadata: {
          ...metadata,
          chunkIndex: 0,
          totalChunks: 1,
          wordCount: cleanedText.split(/\s+/).length
        }
      }];
    }

    // Split into paragraphs first
    const paragraphs = this.splitIntoParagraphs(cleanedText);
    let currentChunk = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      // If adding this paragraph exceeds chunk size, save current chunk
      if (currentChunk.length + paragraph.length > this.chunkSize && currentChunk.length >= this.minChunkSize) {
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            ...metadata,
            chunkIndex,
            wordCount: currentChunk.split(/\s+/).length
          }
        });
        
        // Start new chunk with overlap
        const words = currentChunk.split(/\s+/);
        const overlapWords = words.slice(-Math.floor(this.chunkOverlap / 5)); // Approximate words
        currentChunk = overlapWords.join(' ') + ' ' + paragraph;
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    // Add final chunk if not empty
    if (currentChunk.trim().length >= this.minChunkSize) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          ...metadata,
          chunkIndex,
          wordCount: currentChunk.split(/\s+/).length
        }
      });
    }

    // Update total chunks
    return chunks.map(chunk => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        totalChunks: chunks.length
      }
    }));
  }

  /**
   * Extract sections from document (headers and content)
   */
  extractSections(text) {
    const sections = [];
    const lines = text.split('\n');
    let currentSection = { title: 'Introduction', content: '' };

    for (const line of lines) {
      // Detect headers (simple heuristic)
      const isHeader = /^#{1,6}\s+/.test(line) || // Markdown headers
                      /^[A-Z][A-Z\s]{2,}$/.test(line.trim()) || // ALL CAPS
                      (line.trim().length < 100 && line.trim().endsWith(':')); // Short lines ending with colon

      if (isHeader) {
        if (currentSection.content.trim()) {
          sections.push({ ...currentSection });
        }
        currentSection = {
          title: line.replace(/^#{1,6}\s+/, '').trim(),
          content: ''
        };
      } else {
        currentSection.content += line + '\n';
      }
    }

    // Add last section
    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Calculate text statistics
   */
  getStatistics(text) {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = this.splitIntoSentences(text);
    const paragraphs = this.splitIntoParagraphs(text);

    return {
      characterCount: text.length,
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordLength: words.reduce((sum, w) => sum + w.length, 0) / words.length || 0,
      averageSentenceLength: words.length / sentences.length || 0,
      estimatedReadingTime: Math.ceil(words.length / 200) // minutes at 200 WPM
    };
  }
}

module.exports = TextProcessor;
