const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

/**
 * Parse a JSON response from Gemini defensively.
 *
 * Gemini occasionally returns truncated output, code-fenced blocks, or text
 * around the JSON. This helper tries:
 *   1. The raw response.
 *   2. The response with markdown fences stripped.
 *   3. The substring between the first `{` and the last `}`.
 *
 * Returns the parsed object, or null if nothing parseable was found.
 */
function safeParseGeminiJson(responseText) {
  if (typeof responseText !== 'string' || !responseText.trim()) return null;
  const candidates = [];
  candidates.push(responseText);
  candidates.push(responseText.replace(/```json\n?|\n?```/g, '').trim());
  const firstBrace = responseText.indexOf('{');
  const lastBrace = responseText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(responseText.slice(firstBrace, lastBrace + 1));
  }
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // try next candidate
    }
  }
  return null;
}

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

      // Variation seed forces a different question set on each call so the
      // same student doesn't see identical quizzes twice in a row.
      const variationSeed = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

      const prompt = `Generate a quiz based on the following educational content.

CONTENT:
${content}

QUIZ SPECIFICATIONS:
- Number of questions: ${numQuestions}
- Difficulty level: ${difficulty}
- Question types: ${questionTypes.join(', ')}
${topic ? `- Focus topic: ${topic}` : ''}
- Variation seed: ${variationSeed} (use this to vary which concepts you focus on; never include the seed in your output)

Important guidance for variety:
- Cover a DIFFERENT spread of concepts each time you are asked.
- Vary the question phrasing — do not repeat questions students may have seen.
- Mix recall, application, and analysis questions where the content supports it.

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
          // Higher temperature => more variation between regenerations
          temperature: 0.8,
          responseMimeType: 'application/json'
        },
        safetySettings: this.safetySettings
      });

      const responseText = result.response.text();
      
      // Clean and parse JSON
      const parsed = safeParseGeminiJson(responseText);
      if (!parsed) throw new Error('Gemini returned unparseable JSON');
      return parsed;
    } catch (error) {
      logger.error('Error generating quiz:', error);
      throw new Error('Failed to generate quiz');
    }
  }

  /**
   * Analyze exam difficulty from restricted content.
   *
   * The caller (ragEngine.generateCalibratedQuiz) only uses the
   * `overallDifficulty` field, so we ask Gemini for the minimal possible
   * payload. Earlier versions of this prompt requested a 12-field schema with
   * nested objects, causing Gemini to fill long descriptive strings and hit
   * the 4096-token cap mid-JSON — producing the
   * "Gemini returned unparseable JSON" warning on every quiz generation.
   *
   * The current contract: respond with exactly `{"overallDifficulty":"<one of: beginner|intermediate|advanced>"}`.
   */
  async analyzeExamDifficulty(examContent) {
    try {
      // Cap input — calibration only needs the *style* of past papers,
      // not their full text. Anything beyond ~6k chars is wasted context.
      const trimmedContent = examContent.length > 6000
        ? examContent.slice(0, 6000) + '\n[...truncated for calibration...]'
        : examContent;

      const prompt = `Read the past exam paper(s) below and judge the OVERALL DIFFICULTY level the lecturer typically sets.

EXAM CONTENT:
${trimmedContent}

Respond with EXACTLY this JSON shape and nothing else. No commentary, no prose, no markdown fences:
{"overallDifficulty":"intermediate"}

The value MUST be one of: "beginner", "intermediate", or "advanced".`;

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          ...this.generationConfig,
          temperature: 0.1,           // Deterministic classification, not creative writing
          maxOutputTokens: 64,        // ~30 chars of JSON — more than enough
          responseMimeType: 'application/json'
        }
      });

      const responseText = result.response.text();
      const parsed = safeParseGeminiJson(responseText);
      if (!parsed || !parsed.overallDifficulty) {
        logger.warn('analyzeExamDifficulty: Gemini returned unparseable JSON, skipping calibration');
        return null;
      }
      // Normalise to the three accepted values.
      const normalised = String(parsed.overallDifficulty).toLowerCase().trim();
      const accepted = ['beginner', 'intermediate', 'advanced'];
      if (!accepted.includes(normalised)) {
        logger.warn(`analyzeExamDifficulty: Gemini returned unexpected value "${parsed.overallDifficulty}", skipping calibration`);
        return null;
      }
      return { overallDifficulty: normalised };
    } catch (error) {
      logger.error('Error analyzing exam difficulty:', error);
      // ragEngine treats null as "no calibration available" and falls back
      // to the user-requested difficulty.
      return null;
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
      const parsed = safeParseGeminiJson(responseText);
      if (!parsed) throw new Error('Gemini returned unparseable JSON');
      return parsed;
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
      const parsed = safeParseGeminiJson(responseText);
      if (!parsed) throw new Error('Gemini returned unparseable JSON');
      return parsed;
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
      const parsed = safeParseGeminiJson(responseText);
      if (!parsed) throw new Error('Gemini returned unparseable JSON');
      return parsed;
    } catch (error) {
      logger.error('Error generating flashcards:', error);
      throw new Error('Failed to generate flashcards');
    }
  }

  /**
   * Generate a SAMPLE EXAM PAPER for a subject.
   *
   * The goal is rehearsal — students see the exact structure, question
   * types, marks layout and instructions of their lecturer's past papers,
   * but with brand-new questions drawn from the public study material.
   *
   * It is intentionally NOT a multiple-choice quiz: questions are free
   * response ("Explain…", "Calculate…", "Discuss…") and each carries a
   * hidden model answer so the student can self-mark after attempting.
   */
  async generateSampleExam(studyContent, pastPaperContent, options = {}) {
    try {
      const { subject = 'this course' } = options;
      const variationSeed = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

      const prompt = `You are generating a SAMPLE EXAM PAPER for the course "${subject}".
Its purpose is to help a student rehearse the FORMAT of the real exam so
the real exam does not come as a shock — NOT to act as a multiple-choice
quiz. (Multiple-choice quizzes are a separate feature in this app.)

You are given two sources:

=== STUDY MATERIAL (public — the SOURCE of every question's content) ===
${studyContent}

=== LECTURER'S PAST EXAM PAPERS (restricted — STRUCTURE reference only) ===
${pastPaperContent}

YOUR TASK — DO ALL OF THIS:

Step 1. Read the past paper(s) and identify their STRUCTURE precisely:
   - Total duration in minutes and total marks.
   - General exam instructions ("Answer ALL questions in Section A", etc.).
   - The list of sections (e.g. "Section A", "Section B"), each with its
     own instructions and its own list of questions.
   - For each question: its number ("1", "1(a)"…), its type (short answer,
     long answer/essay, calculation, theory, practical, description,
     discussion, etc.), and its marks.

Step 2. Generate a BRAND-NEW exam paper that mirrors that structure
   EXACTLY:
   - Same number of sections with the same names.
   - Same number of questions per section.
   - Same question TYPES in the same positions.
   - Same marks per question and the same total.
   - Same general instructions, adjusted only as needed.

Step 3. Every question's CONTENT must come from the STUDY MATERIAL.
   Questions must be NEW — never copy or paraphrase a past-paper question.
   The past papers are a STRUCTURAL template, not a question bank.

Step 4. DO NOT include multiple-choice options. Questions are open-ended:
   "Explain ...", "Calculate ...", "Describe ...", "Discuss ...", etc.,
   matching the verbs the past paper actually uses.

Step 5. For every question, also provide a MODEL ANSWER — concise, in the
   style of a MARKING GUIDE, not a full essay. The student will use it to
   self-mark, so it just needs to capture the key points.

OUTPUT BREVITY (CRITICAL — the JSON must fit within the response budget):
- Cap the total number of questions at TWELVE across all sections, even
  if the past paper has more. Pick the most representative ones.
- Keep each modelAnswer to AT MOST 3 short sentences (≈40 words).
- Keep each section's "instructions" to ONE short sentence.
- Keep the overall "instructions" list to AT MOST 3 short items.
- Keep "questionText" to ≤30 words.
- Do not include any text outside the JSON object.

Variation seed: ${variationSeed} — use it to vary which study topics you
draw on; do NOT include the seed in your output.

Return ONLY valid JSON in this exact shape:
{
  "title": "${subject} — Sample Exam Paper",
  "subject": "${subject}",
  "durationMinutes": 120,
  "totalMarks": 100,
  "instructions": [
    "Answer ALL questions in Section A.",
    "Answer ANY TWO questions in Section B."
  ],
  "sections": [
    {
      "name": "Section A",
      "instructions": "Answer all questions. Each carries 5 marks.",
      "questions": [
        {
          "number": "1",
          "questionText": "Explain the role of ... in ...",
          "marks": 5,
          "type": "short_answer",
          "modelAnswer": "Concise model answer or marking guide so the student can self-mark."
        }
      ]
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no markdown formatting.
- Do not include any answer-choice arrays.
- durationMinutes, totalMarks and the list of sections/questions must
  reflect what the past paper actually shows.`;

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          ...this.generationConfig,
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json'
        },
        safetySettings: this.safetySettings
      });

      const responseText = result.response.text();
      const parsed = safeParseGeminiJson(responseText);
      if (!parsed) throw new Error('Gemini returned unparseable JSON for sample exam');
      return parsed;
    } catch (error) {
      logger.error('Error generating sample exam:', error);
      throw new Error('Failed to generate sample exam');
    }
  }
}

// Singleton instance
const geminiService = new GeminiService();

module.exports = geminiService;
