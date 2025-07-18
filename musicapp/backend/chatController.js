const { Configuration, OpenAIApi } = require("openai");

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

async function detectEmotion(text) {
  const res = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "Classify the user's emotion as Angry, Confused, Happy, or Neutral." },
      { role: "user", content: text }
    ]
  });
  return res.data.choices[0].message.content.trim();
}

async function getChatResponse(userMessage, emotion) {
  const toneInstruction = {
    Angry: "Respond calmly and helpfully. Apologize and offer assistance.",
    Confused: "Respond clearly and patiently. Offer explanations.",
    Happy: "Be upbeat and enthusiastic.",
    Neutral: "Respond normally and helpfully."
  };

  const prompt = `
Tone: ${toneInstruction[emotion] || "Respond professionally."}
User: ${userMessage}
`;

  const res = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a helpful customer support agent." },
      { role: "user", content: prompt }
    ]
  });

  return res.data.choices[0].message.content.trim();
}

module.exports = { detectEmotion, getChatResponse };
