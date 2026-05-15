const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // We specify the most stable 2026 models to avoid the 404 Not Found error
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash' // Faster and more reliable for live demos
    });
    
    this.embeddingModel = this.genAI.getGenerativeModel({ 
      model: 'gemini-embedding-001' // Standard high-quality embedding model
    });
    
    // Safety settings to ensure school policy compliance
    this.safetySettings = [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ];

    // Generation config optimized for student interaction
    this.generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    };
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbedding(text) {
    try {
      const result = await this.embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      logger.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Generate embeddings for multiple texts with Rate Limit protection
   */
  async generateEmbeddingsBatch(texts) {
    try {
      const embeddings = [];
      
      // Helper to create a small delay
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      for (const text of texts) {
        const embedding = await this.generateEmbedding(text);
        embeddings.push(embedding);
        
        // Pause for 500ms between each chunk to avoid 429 errors
        // This is the secret to making batch uploads work on the free tier
        await sleep(500); 
      }
      return embeddings;
    } catch (error) {
      logger.error('Error generating embeddings batch:', error);
      throw new Error('Failed to generate embeddings batch due to rate limits');
    }
  }

  /**
   * Generate chat response with context
   */
  async generateChatResponse(messages, context = [], options = {}) {
    try {
      const { temperature = 0.7, maxTokens = 8192 } = options;

      // Build context from retrieved documents
      const contextText = context.length > 0
        ? context.map(c => `[Source: ${c.metadata?.title || 'Document'}]\n${c.content}`).join('\n\n---\n\n')
        : 'No specific context provided.';

      // Build conversation history
      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      // Start chat
      const chat = this.model.startChat({
        history,
        generationConfig: {
          ...this.generationConfig,
          temperature,
          maxOutputTokens: maxTokens
        },
        safetySettings: this.safetySettings
      });

      // Get last message
      const lastMessage = messages[messages.length - 1];

      // Build prompt with context
      const prompt = `You are an AI tutor for an educational platform. Use the following context to answer the student's question accurately and helpfully.

CONTEXT:
${contextText}

INSTRUCTIONS:
- Answer based primarily on the provided context
- If the context doesn't contain the answer, say so clearly
- Be encouraging and supportive in your tone
- Use examples when helpful
- Keep responses clear and well-structured

STUDENT QUESTION:
${lastMessage.content}

Your response:`;

      const result = await chat.sendMessage(prompt);
      const response = result.response.text();

      return {
        content: response,
        usage: {
          promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
          completionTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: result.response.usageMetadata?.totalTokenCount || 0
        }
      };
    } catch (error) {
      logger.error('Error generating chat response:', error);
      throw new Error('Failed to generate chat response');
    }
  }

  /**
   * Generate quiz questions based on content
   */
  async generateQuiz(content, options = {}) {
    try {
      const {
        numQuestions = 5,
        difficulty = 'intermediate',
        questionTypes = ['multiple_choice', 'true_false'],
        topic = null
      } = options;

      const prompt = `Generate a quiz based on the following educational content.

CONTENT:
${content}

QUIZ SPECIFICATIONS:
- Number of questions: ${numQuestions}
- Difficulty level: ${difficulty}
- Question types: ${questionTypes.join(', ')}
${topic ? `- Focus topic: ${topic}` : ''}

Generate the quiz in the following JSON format:
{
  "title": "Quiz Title",
  "description": "Brief description",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Question text?",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "correctAnswer": "A",
      "explanation": "Why this is correct",
      "points": 10
    }
  ],
  "totalPoints": 50,
  "estimatedTimeMinutes": 15
}

IMPORTANT: Return ONLY valid JSON, no markdown formatting.`;

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          ...this.generationConfig,
          temperature: 0.3,
          responseMimeType: 'application/json'
        },
        safetySettings: this.safetySettings
      });

      const responseText = result.response.text();
      
      // Clean and parse JSON
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      logger.error('Error generating quiz:', error);
      throw new Error('Failed to generate quiz');
    }
  }

  /**
   * Analyze exam difficulty from restricted content
   */
  async analyzeExamDifficulty(examContent) {
    try {
      const prompt = `Analyze the following exam/exam paper and provide detailed difficulty analysis.

EXAM CONTENT:
${examContent}

Provide analysis in this JSON format:
{
  "overallDifficulty": "intermediate",
  "difficultyScore": 65,
  "topicDistribution": {
    "topic1": { "percentage": 30, "difficulty": "easy" },
    "topic2": { "percentage": 40, "difficulty": "medium" },
    "topic3": { "percentage": 30, "difficulty": "hard" }
  },
  "questionTypes": {
    "multiple_choice": 40,
    "short_answer": 35,
    "essay": 25
  },
  "cognitiveLevels": {
    "remember": 20,
    "understand": 30,
    "apply": 30,
    "analyze": 15,
    "evaluate": 5
  },
  "timePressure": "moderate",
  "commonMistakes": ["mistake1", "mistake2"],
  "keyConcepts": ["concept1", "concept2", "concept3"],
  "weightingFactors": {
    "fundamentals": 0.3,
    "application": 0.4,
    "analysis": 0.3
  }
}

Return ONLY valid JSON.`;

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          ...this.generationConfig,
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      });

      const responseText = result.response.text();
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      logger.error('Error analyzing exam difficulty:', error);
      throw new Error('Failed to analyze exam difficulty');
    }
  }

  /**
   * Summarize document content
   */
  async summarizeDocument(content, options = {}) {
    try {
      const { maxLength = 500, style = 'detailed' } = options;

      const prompt = `Summarize the following educational content in a ${style} style.

CONTENT:
${content}

Requirements:
- Maximum length: ${maxLength} words
- Include key concepts and main points
- Use clear, student-friendly language
- Highlight important definitions
- Organize with bullet points where appropriate

Summary:`;

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          ...this.generationConfig,
          temperature: 0.3,
          maxOutputTokens: maxLength * 2
        }
      });

      return result.response.text();
    } catch (error) {
      logger.error('Error summarizing document:', error);
      throw new Error('Failed to summarize document');
    }
  }

  /**
   * Classify document tier (public vs restricted)
   */
  async classifyDocumentTier(content, filename) {
    try {
      const prompt = `Classify the following document as either "public" or "restricted" based on its content.

FILENAME: ${filename}

CONTENT SAMPLE:
${content.substring(0, 3000)}

Classification rules:
- "restricted": Contains exam papers, answer keys, marking schemes, test solutions, or confidential assessment materials
- "public": Contains study materials, lecture notes, textbooks, reference materials, or general educational content

Provide response in this JSON format:
{
  "tier": "public" | "restricted",
  "confidence": 0.95,
  "reasoning": "Brief explanation of classification",
  "detectedIndicators": ["indicator1", "indicator2"]
}

Return ONLY valid JSON.`;

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          ...this.generationConfig,
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      });

      const responseText = result.response.text();
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      logger.error('Error classifying document:', error);
      // Default to public if classification fails
      return { tier: 'public', confidence: 0.5, reasoning: 'Classification failed', detectedIndicators: [] };
    }
  }

  /**
   * Generate study module/synthesis
   */
  async generateStudyModule(content, options = {}) {
    try {
      const { title, subject, targetAudience = 'student' } = options;

      const prompt = `Create a comprehensive study module based on the following content.

TITLE: ${title}
SUBJECT: ${subject}
TARGET AUDIENCE: ${targetAudience}

CONTENT:
${content}

Generate a study module in this JSON format:
{
  "title": "Module Title",
  "subject": "Subject Name",
  "learningObjectives": ["objective1", "objective2", "objective3"],
  "keyConcepts": [
    {
      "term": "Concept Name",
      "definition": "Clear definition",
      "example": "Practical example"
    }
  ],
  "contentSections": [
    {
      "heading": "Section Title",
      "content": "Detailed explanation",
      "keyPoints": ["point1", "point2"]
    }
  ],
  "summary": "Brief module summary",
  "practiceQuestions": [
    {
      "question": "Question text?",
      "answer": "Answer text",
      "hint": "Helpful hint"
    }
  ],
  "estimatedStudyTime": 45,
  "difficulty": "intermediate"
}

Return ONLY valid JSON.`;

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          ...this.generationConfig,
          temperature: 0.4,
          responseMimeType: 'application/json'
        }
      });

      const responseText = result.response.text();
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      logger.error('Error generating study module:', error);
      throw new Error('Failed to generate study module');
    }
  }

  /**
   * Generate active-recall flashcards from content
   */
  async generateFlashcards(content, options = {}) {
    try {
      const { count = 10, topic = null, difficulty = 'intermediate' } = options;

      const prompt = `Create active-recall flashcards from the following educational content.

CONTENT:
${content}

SPECIFICATIONS:
- Number of flashcards: ${count}
- Difficulty level: ${difficulty}
${topic ? `- Focus topic: ${topic}` : ''}

Guidelines:
- Each card must be self-contained and answerable without seeing other cards.
- "front" is a short prompt (a question, a term to define, or a fill-in cue).
- "back" is the concise answer — one to three sentences, fact-dense.
- Mix definitions, comparisons, mechanisms, and applied "why" questions.
- Use only material grounded in the content above. Do not invent facts.

Return ONLY valid JSON in this exact shape:
{
  "topic": "${topic || 'General'}",
  "flashcards": [
    {
      "front": "Prompt or question",
      "back": "Concise answer",
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}`;

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          ...this.generationConfig,
          temperature: 0.3,
          responseMimeType: 'application/json'
        },
        safetySettings: this.safetySettings
      });

      const responseText = result.response.text();
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      logger.error('Error generating flashcards:', error);
      throw new Error('Failed to generate flashcards');
    }
  }
}

// Singleton instance
const geminiService = new GeminiService();

module.exports = geminiService;
