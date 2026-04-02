const axios = require('axios');

const RAPIDAPI_URL = 'https://gemini-pro-ai.p.rapidapi.com/';

// Shared helper to call the Gemini RapidAPI
async function callGemini(key, userPrompt) {
  const response = await axios.request({
    method: 'POST',
    url: RAPIDAPI_URL,
    headers: {
      'x-rapidapi-key': key,
      'x-rapidapi-host': 'gemini-pro-ai.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    data: { contents: [{ role: 'user', parts: [{ text: userPrompt }] }] }
  });
  if (typeof response.data === 'string') return response.data;
  if (response.data?.text) return response.data.text;
  if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text)
    return response.data.candidates[0].content.parts[0].text;
  return JSON.stringify(response.data);
}

exports.chat = async (req, res) => {
  try {
    const { prompt, history } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

    if (!process.env.GEMINI_RAPIDAPI_KEY) {
      // Simulate typing delay for realism
      await new Promise(resolve => setTimeout(resolve, 800));
      return res.json({
        text: "Hi there! I am your AI Study Assistant. To enable my brain, your administrator needs to add a valid `GEMINI_RAPIDAPI_KEY` to the backend's `.env` file! Once added, I can help you summarize notes, explain complex topics, and create study plans!"
      });
    }

    let contents = [];
    if (history && Array.isArray(history)) {
      contents = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
    }

    // Gemini API requires history to start with a 'user' message. If it starts with 'model', drop it.
    if (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }

    const personaPrefix = history && history.length > 0 ? "" : "System Setup: You are an intelligent 'StudyFriend' AI assistant embedded inside StudyFriend. Help students learn, summarize, and format code. Be polite and concise. User: ";
    
    contents.push({
      role: 'user',
      parts: [{ text: personaPrefix + prompt }]
    });

    const options = {
      method: 'POST',
      url: 'https://gemini-pro-ai.p.rapidapi.com/',
      headers: {
        'x-rapidapi-key': process.env.GEMINI_RAPIDAPI_KEY,
        'x-rapidapi-host': 'gemini-pro-ai.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      data: {
        contents: contents
      }
    };

    const response = await axios.request(options);

    let responseText = "Failed to parse RapidAPI response";
    if (typeof response.data === 'string') {
        responseText = response.data;
    } else if (response.data?.text) {
        responseText = response.data.text;
    } else if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = response.data.candidates[0].content.parts[0].text;
    } else {
        responseText = JSON.stringify(response.data);
    }

    res.json({ text: responseText });
  } catch (err) {
    console.error('AI Chat Error Details:', err.message, err.response?.data);
    res.status(500).json({ message: 'Failed to process AI request. Please try again later.', error: err.message });
  }
};

exports.squadTutor = async (req, res) => {
  try {
    const { prompt, squadName, subject } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

    if (!process.env.GEMINI_RAPIDAPI_KEY) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return res.json({
        text: `Hey squad! I am your AI Study Tutor for **${squadName || 'this group'}**. Add a GEMINI_RAPIDAPI_KEY to see me in action answering questions about ${subject || 'your subjects'}!`
      });
    }

    const context = `You are a helpful, encouraging AI Study Tutor embedded in a study squad called "${squadName}". The subject is "${subject}". Keep your answers concise, formatted in markdown, and directed at a group of students. Explain concepts clearly. User asks: `;
    
    const options = {
      method: 'POST',
      url: 'https://gemini-pro-ai.p.rapidapi.com/',
      headers: {
        'x-rapidapi-key': process.env.GEMINI_RAPIDAPI_KEY,
        'x-rapidapi-host': 'gemini-pro-ai.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      data: {
        contents: [
          {
            role: 'user',
            parts: [{ text: context + prompt }]
          }
        ]
      }
    };

    const response = await axios.request(options);
    
    let responseText = "Failed to parse RapidAPI response";
    if (typeof response.data === 'string') {
        responseText = response.data;
    } else if (response.data?.text) {
        responseText = response.data.text;
    } else if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = response.data.candidates[0].content.parts[0].text;
    } else {
        responseText = JSON.stringify(response.data);
    }

    res.json({ text: responseText });
  } catch (err) {
    console.error('Squad Tutor AI Error:', err.message, err.response?.data);
    res.status(500).json({ message: 'AI failed to process. Try again later.', error: err.message });
  }
};

// ─── Flashcard Generator ────────────────────────────────────────────────────
exports.generateFlashcards = async (req, res) => {
  try {
    const { topic, count = 10, difficulty = 'mixed' } = req.body;
    if (!topic) return res.status(400).json({ message: 'Topic is required' });

    if (!process.env.GEMINI_RAPIDAPI_KEY) {
      return res.json({ flashcards: [
        { question: 'What is a flashcard?', answer: 'A learning tool with a question on one side and the answer on the other.', difficulty: 'easy' },
        { question: 'Why use spaced repetition?', answer: 'It leverages the spacing effect to improve long-term memory retention.', difficulty: 'medium' },
        { question: 'Add GEMINI_RAPIDAPI_KEY to .env to generate real flashcards for: ' + topic, answer: 'Once the key is added, AI will generate cards tailored to your topic!', difficulty: 'easy' }
      ]});
    }

    const prompt = `Generate exactly ${count} high-quality flashcards for studying the topic: "${topic}".
Difficulty preference: ${difficulty}.
Return ONLY a valid JSON array (no markdown, no explanation) in this exact format:
[{"question":"...","answer":"...","difficulty":"easy|medium|hard"}]
Make the questions specific, academically rigorous, and diverse in question type.`;

    const rawText = await callGemini(process.env.GEMINI_RAPIDAPI_KEY, prompt);
    
    // Extract JSON from response (in case the model wraps it in markdown)
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return res.status(500).json({ message: 'AI returned invalid format. Try again.' });
    
    const flashcards = JSON.parse(jsonMatch[0]);
    res.json({ flashcards, topic });
  } catch (err) {
    console.error('Flashcard Gen Error:', err.message);
    res.status(500).json({ message: 'Failed to generate flashcards.', error: err.message });
  }
};

// ─── Quiz Generator ──────────────────────────────────────────────────────────
exports.generateQuiz = async (req, res) => {
  try {
    const { topic, count = 8 } = req.body;
    if (!topic) return res.status(400).json({ message: 'Topic is required' });

    if (!process.env.GEMINI_RAPIDAPI_KEY) {
      return res.json({ quiz: [
        { question: 'What happens when you add a GEMINI_RAPIDAPI_KEY?', options: ['Nothing', 'AI generates real quizzes', 'Server crashes', 'It costs money'], correct: 1, explanation: 'With the key set, the AI will generate topic-specific quiz questions!' }
      ]});
    }

    const prompt = `Generate exactly ${count} multiple-choice quiz questions for the topic: "${topic}".
Return ONLY a valid JSON array (no markdown, no explanation) in this exact format:
[{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}]
Where "correct" is the 0-based index of the correct option.
Make questions progressively harder, covering different aspects of the topic.`;

    const rawText = await callGemini(process.env.GEMINI_RAPIDAPI_KEY, prompt);
    
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return res.status(500).json({ message: 'AI returned invalid format. Try again.' });
    
    const quiz = JSON.parse(jsonMatch[0]);
    res.json({ quiz, topic });
  } catch (err) {
    console.error('Quiz Gen Error:', err.message);
    res.status(500).json({ message: 'Failed to generate quiz.', error: err.message });
  }
};

