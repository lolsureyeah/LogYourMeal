// execution/backend/geminiKeyRotator.js
// Circular key rotation across 3 Gemini API keys to handle rate limits.
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), ".env") });

const KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean);

if (KEYS.length === 0) {
  throw new Error("No Gemini API keys found. Set GEMINI_API_KEY_1/2/3 in .env");
}

let currentIndex = 0;

export function getGeminiKey() {
  return KEYS[currentIndex];
}

export function rotateGeminiKey() {
  currentIndex = (currentIndex + 1) % KEYS.length;
  return KEYS[currentIndex];
}

export function geminiKeyedUrl(modelPath) {
  return `https://generativelanguage.googleapis.com/${modelPath}?key=${getGeminiKey()}`;
}
