import 'dotenv/config';
import fetch from 'node-fetch'; // Optional for Node.js v18+, required for earlier

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY is not set in your .env file.');
  process.exit(1);
}

async function listModels() {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  try {
    const response = await fetch(endpoint);
    const data = await response.json();
    if (!response.ok) {
      console.error('Error listing models:', data);
      return false;
    }
    console.log('Available models for your API key:');
    if (data.models && Array.isArray(data.models)) {
      data.models.forEach(model => console.log('-', model.name));
    } else {
      console.log(data);
    }
    return true;
  } catch (err) {
    console.error('Error fetching models:', err);
    return false;
  }
}

async function testGemini() {
  const prompt = 'Classify the following object as recyclable, reusable, or sellable. Only respond with one of these three words. Object: bottle';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    return;
  }
  const data = await response.json();
  console.log('Gemini API response:', JSON.stringify(data, null, 2));
}

(async () => {
  const modelsOk = await listModels();
  if (modelsOk) {
    await testGemini();
  } else {
    console.error('Model listing failed. Check your API key and permissions.');
  }
})();
