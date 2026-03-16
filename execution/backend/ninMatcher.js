// execution/backend/ninMatcher.js
// RAG-based NIN food matcher using text-embedding-004
import { indianFoods } from "./indianFoods.js";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = resolve(__dirname, "nin_vectors.json");

// In-memory vector store: [{ key, vector }]
let ninVectorStore = [];
let storeReady = false;

async function getEmbedding(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: { parts: [{ text }] }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Embed API ${res.status}`);
  return data.embedding.values;
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function buildFromAPI() {
  console.log("[NIN] Building vector store from API...", Object.keys(indianFoods).length, "foods");
  const entries = Object.keys(indianFoods);
  const BATCH_DELAY = 100; // ms between calls to avoid rate limiting
  const store = [];

  for (const key of entries) {
    try {
      const vector = await getEmbedding(key);
      store.push({ key, vector });
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    } catch (err) {
      console.warn(`[NIN] Failed to embed "${key}":`, err.message);
    }
  }

  try {
    writeFileSync(CACHE_PATH, JSON.stringify(store), "utf8");
  } catch (err) {
    console.warn("[NIN] Could not write cache file:", err.message);
  }

  return store;
}

// Call once at server startup — loads from disk cache or rebuilds via API
export async function buildNINVectorStore() {
  try {
    const raw = readFileSync(CACHE_PATH, "utf8");
    const cached = JSON.parse(raw);
    if (!Array.isArray(cached) || cached.length === 0) throw new Error("empty cache");
    ninVectorStore = cached;
    storeReady = true;
    console.log(`[NIN] Loaded vector store from cache. ${ninVectorStore.length} foods indexed.`);
    return;
  } catch {
    // Cache missing, corrupted, or empty — fall through to API build
  }

  ninVectorStore = await buildFromAPI();
  storeReady = true;
  console.log(`[NIN] Vector store ready. ${ninVectorStore.length} foods indexed.`);
}

// Match a single food name against the NIN vector store
export async function matchNIN(foodName, threshold = 0.75) {
  if (!storeReady || !foodName) return null;

  try {
    const queryVector = await getEmbedding(foodName.toLowerCase().trim());

    let bestKey = null;
    let bestScore = 0;

    for (const { key, vector } of ninVectorStore) {
      const score = cosineSimilarity(queryVector, vector);
      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }
    }

    if (bestScore >= threshold) {
      return { ninKey: bestKey, ninData: indianFoods[bestKey], score: bestScore };
    }
    return null;
  } catch (err) {
    console.warn("[NIN] matchNIN error:", err.message);
    return null;
  }
}

// Apply NIN verification to all items returned by Gemini food parser
export async function applyNINVerification(items) {
  return Promise.all(
    items.map(async item => {
      const match = await matchNIN(item.name);
      if (!match) return { ...item, source: "AI-estimated" };

      const { ninData, score } = match;
      const factor = (item.grams || 100) / 100;

      return {
        ...item,
        cal:           Math.round(ninData.cal * factor),
        protein:       Math.round(ninData.protein * factor * 10) / 10,
        carbs:         Math.round(ninData.carbs * factor * 10) / 10,
        fat:           Math.round(ninData.fat * factor * 10) / 10,
        source:        "NIN-verified",
        ninMatchScore: Math.round(score * 100),
      };
    })
  );
}
