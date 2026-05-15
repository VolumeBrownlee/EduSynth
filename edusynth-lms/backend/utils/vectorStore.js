/**
 * In-Memory Vector Store for Document Embeddings
 * Production should use dedicated vector database like Pinecone, Weaviate, or MongoDB Atlas Vector Search
 */

class VectorStore {
  constructor() {
    this.vectors = new Map(); // tenantId -> array of vectors
    this.dimensions = 768; // Default for Gemini embeddings
  }

  /**
   * Add vectors to store
   */
  addVectors(tenantId, vectors) {
    if (!this.vectors.has(tenantId)) {
      this.vectors.set(tenantId, []);
    }

    const tenantVectors = this.vectors.get(tenantId);
    
    for (const vector of vectors) {
      tenantVectors.push({
        id: vector.id,
        embedding: vector.embedding,
        content: vector.content,
        metadata: vector.metadata || {},
        createdAt: new Date()
      });
    }

    return vectors.length;
  }

  /**
   * Search for similar vectors using cosine similarity
   */
  search(tenantId, queryEmbedding, options = {}) {
    const {
      topK = 5,
      filter = null,
      minScore = 0.7,
      documentIds = null,
    } = options;

    const tenantVectors = this.vectors.get(tenantId) || [];

    if (tenantVectors.length === 0) {
      return [];
    }

    // Calculate similarities
    const similarities = tenantVectors
      .filter(v => {
        // Scope to specific documents when provided
        if (documentIds && documentIds.length > 0) {
          if (!documentIds.includes(v.metadata.documentId)) return false;
        }
        if (filter) {
          return Object.entries(filter).every(([key, value]) => v.metadata[key] === value);
        }
        return true;
      })
      .map(v => ({
        ...v,
        score: this.cosineSimilarity(queryEmbedding, v.embedding)
      }))
      .filter(v => v.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return similarities;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a, b) {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Delete vectors by document ID
   */
  deleteByDocumentId(tenantId, documentId) {
    const tenantVectors = this.vectors.get(tenantId) || [];
    const filtered = tenantVectors.filter(v => v.metadata.documentId !== documentId);
    this.vectors.set(tenantId, filtered);
    return tenantVectors.length - filtered.length;
  }

  /**
   * Get all vectors for a tenant
   */
  getAllVectors(tenantId) {
    return this.vectors.get(tenantId) || [];
  }

  /**
   * Get vector count for a tenant
   */
  getCount(tenantId) {
    return (this.vectors.get(tenantId) || []).length;
  }

  /**
   * Clear all vectors for a tenant
   */
  clear(tenantId) {
    if (tenantId) {
      this.vectors.delete(tenantId);
    } else {
      this.vectors.clear();
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats = {
      totalTenants: this.vectors.size,
      totalVectors: 0,
      tenantStats: {}
    };

    for (const [tenantId, vectors] of this.vectors.entries()) {
      stats.totalVectors += vectors.length;
      stats.tenantStats[tenantId] = {
        vectorCount: vectors.length,
        avgEmbeddingSize: vectors.length > 0 
          ? vectors[0].embedding.length 
          : 0
      };
    }

    return stats;
  }
}

// Singleton instance
const vectorStore = new VectorStore();

module.exports = vectorStore;
