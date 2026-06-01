require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        console.log("Available models:");
        data.models.forEach(m => {
            if (m.name.includes('imagen')) {
                console.log(m.name);
            }
        });
    } catch (e) {
        console.error(e);
    }
}
listModels();
