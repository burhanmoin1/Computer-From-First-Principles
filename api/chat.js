const Groq = require('groq-sdk');
const db = require('./db');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function saveMessage(userId, role, message) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO chat_history (user_id, role, message) VALUES (?, ?, ?)',
      [userId, role, message],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, context, userId } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text or message' });
  }

  const activeUserId = userId || 'anonymous';

  // Save user message to database
  try {
    await saveMessage(activeUserId, 'user', text);
  } catch (dbErr) {
    console.error('Database write error:', dbErr);
  }

  try {
    let userPromptContent = '';
    
    if (context && context.trim() !== '') {
      // It's a highlighted term with context
      userPromptContent = `Please explain the following selected text: "${text}"

Here is the surrounding context where it appeared:
"${context}"`;
    } else {
      // It's a general question
      userPromptContent = text;
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert AI tutor built into the interactive book "Computer From First Principles".
Your goal is to answer terms explanations or general questions about computer engineering, hardware, systems, and programming.

Define the term or answer the question directly in 2 to 3 sentences maximum. Keep your explanation extremely concise, focused, and free of introductory fluff (do NOT start with "In the context of..."). Detail how it fits into the computer engineering stack, and provide a single brief example if helpful.`
        },
        {
          role: 'user',
          content: userPromptContent
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_completion_tokens: 150,
    });

    const explanation = chatCompletion.choices[0]?.message?.content || 'No explanation generated.';

    // Save AI response to database
    try {
      await saveMessage(activeUserId, 'ai', explanation);
    } catch (dbErr) {
      console.error('Database write error (AI):', dbErr);
    }

    return res.status(200).json({ explanation });
  } catch (error) {
    console.error('Groq API error:', error);
    return res.status(500).json({ error: 'Failed to generate response.' });
  }
};
