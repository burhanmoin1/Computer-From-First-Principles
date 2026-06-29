const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text, context } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text to explain' });
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert AI tutor built into the interactive book "Computer From First Principles".
Your goal is to explain terms, phrases, or concepts the user selects.

Keep your explanations concise, accessible, and strictly focused on computer engineering, hardware, and the provided context. If the term is a general word used in a specialized way, explain the specialized meaning.
Provide a clear definition followed by a brief example or analogy if helpful. Keep your response under 3 paragraphs.`
        },
        {
          role: 'user',
          content: `Please explain the following selected text: "${text}"

Here is the surrounding context where it appeared:
"${context}"`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_completion_tokens: 500,
    });

    return res.status(200).json({
      explanation: chatCompletion.choices[0]?.message?.content || 'No explanation generated.'
    });
  } catch (error) {
    console.error('Groq API error:', error);
    return res.status(500).json({ error: 'Failed to generate explanation.' });
  }
}
