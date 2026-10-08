const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key length:', apiKey ? apiKey.length : 0);
  console.log('API Key prefix:', apiKey ? apiKey.slice(0, 10) : 'none');
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await axios.post(url, {
        contents: [{ parts: [{ text: 'Hello' }] }]
      });
      console.log('Model', model, 'SUCCESS:', res.data.candidates[0].content.parts[0].text.slice(0, 40));
      return;
    } catch (e) {
      console.log('Model', model, 'FAILED:', e.response?.status, e.response?.data?.error?.message || e.message);
    }
  }
}
test();
