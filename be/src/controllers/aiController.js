const axios = require('axios');

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
