const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.chat = async (req, res) => {
  try {
    const { prompt, history } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

    if (!process.env.GEMINI_API_KEY) {
      // Simulate typing delay for realism
      await new Promise(resolve => setTimeout(resolve, 800));
      return res.json({
        text: "Hi there! I am your AI Study Assistant. To enable my brain, your administrator needs to add a valid `GEMINI_API_KEY` to the backend's `.env` file! Once added, I can help you summarize notes, explain complex topics, and create study plans!"
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    let formattedHistory = history && Array.isArray(history) ? history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })) : [];

    // Gemini API requires history to start with a 'user' message. If it starts with 'model', drop it.
    if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    const chatSession = model.startChat({
      history: formattedHistory,
    });

    const personaPrefix = history && history.length > 0 ? "" : "System Setup: You are an intelligent 'Study Buddy' AI assistant embedded inside StudyBuddyFinder. Help students learn, summarize, and format code. Be polite and concise. User: ";
    const result = await chatSession.sendMessage(personaPrefix + prompt);
    const responseText = result.response.text();

    res.json({ text: responseText });
  } catch (err) {
    console.error('AI Chat Error Details:', err.message, err.stack);
    res.status(500).json({ message: 'Failed to process AI request. Please try again later.', error: err.message });
  }
};

exports.squadTutor = async (req, res) => {
  try {
    const { prompt, squadName, subject } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

    if (!process.env.GEMINI_API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return res.json({
        text: `Hey squad! I am your AI Study Tutor for **${squadName || 'this group'}**. Add a GEMINI_API_KEY to see me in action answering questions about ${subject || 'your subjects'}!`
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const context = `You are a helpful, encouraging AI Study Tutor embedded in a study squad called "${squadName}". The subject is "${subject}". Keep your answers concise, formatted in markdown, and directed at a group of students. Explain concepts clearly. User asks: `;
    const result = await model.generateContent(context + prompt);
    const responseText = result.response.text();

    res.json({ text: responseText });
  } catch (err) {
    console.error('Squad Tutor AI Error:', err.message);
    res.status(500).json({ message: 'AI failed to process. Try again later.', error: err.message });
  }
};
