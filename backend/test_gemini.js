const axios = require('axios');
require('dotenv').config();

async function testWorkingModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.7-flash',
    'gemini-3.8-flash',
    'gemini-flash-lite-latest',
    'gemini-flash-latest'
  ];

  for (const m of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const res = await axios.post(url, {
        contents: [{ parts: [{ text: 'Tamil and English test: Hello, eppadi irukeenga?' }] }]
      });
      console.log(`✅ Model ${m} SUCCEEDED:`, res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 80));
    } catch (e) {
      console.log(`❌ Model ${m} FAILED: ${e.response?.status} - ${e.response?.data?.error?.message?.slice(0, 80) || e.message}`);
    }
  }
}

testWorkingModels();
