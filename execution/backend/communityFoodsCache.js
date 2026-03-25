// execution/backend/communityFoodsCache.js
import { cosineSimilarity } from "./ninMatcher.js";
import { geminiKeyedUrl, rotateGeminiKey } from "./geminiKeyRotator.js";
import admin from "firebase-admin";

async function embedText(text) {
  const body = JSON.stringify({
    model: "models/gemini-embedding-001",
    content: { parts: [{ text }] },
  });

  const doRequest = () => fetch(
    geminiKeyedUrl("v1beta/models/gemini-embedding-001:embedContent"),
    { method: "POST", headers: { "Content-Type": "application/json" }, body }
  );

  let res = await doRequest();
  if (res.status === 429 || res.status === 401) {
    rotateGeminiKey();
    res = await doRequest();
  }
  const json = await res.json();
  return json.embedding.values;
}

export async function checkCommunityCache(foodName, requestedGrams, adminDb) {
  console.log('[community cache] checking cache for:', foodName);
  try {
    const queryVec = await embedText(foodName);
    const snapshot = await adminDb
      .collection("community_foods")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    let bestScore = -1;
    let bestData = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!Array.isArray(data.embedding)) return;
      const score = cosineSimilarity(queryVec, data.embedding);
      if (score > bestScore) {
        bestScore = score;
        bestData = data;
      }
    });

    if (bestScore >= 0.88 && bestData) {
      return {
        ...bestData,
        cal:     (bestData.cal     / 100) * requestedGrams,
        protein: (bestData.protein / 100) * requestedGrams,
        carbs:   (bestData.carbs   / 100) * requestedGrams,
        fat:     (bestData.fat     / 100) * requestedGrams,
      };
    }
    return null;
  } catch (err) {
    console.error("checkCommunityCache error:", err.message);
    return null;
  }
}

export async function saveToCommunityCache(parsedItem, uid, adminDb) {
  console.log('[community cache] attempting save for:', parsedItem.name);
  try {
    if (parsedItem.source !== "AI-estimated") return;

    const embedding = await embedText(parsedItem.name);

    const snapshot = await adminDb
      .collection("community_foods")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    let dupDocId = null;
    let bestScore = -1;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!Array.isArray(data.embedding)) return;
      const score = cosineSimilarity(embedding, data.embedding);
      if (score > bestScore) {
        bestScore = score;
        if (score >= 0.90) dupDocId = doc.id;
      }
    });

    if (dupDocId) {
      await adminDb
        .collection("community_foods")
        .doc(dupDocId)
        .update({ useCount: admin.firestore.FieldValue.increment(1) });
      return;
    }

    const g = parsedItem.grams;
    await adminDb.collection("community_foods").add({
      name: parsedItem.name,
      ref_grams: g,
      cal:     (parsedItem.cal     / g) * 100,
      protein: (parsedItem.protein / g) * 100,
      carbs:   (parsedItem.carbs   / g) * 100,
      fat:     (parsedItem.fat     / g) * 100,
      embedding,
      contributedBy: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      useCount: 0,
    });
  } catch (err) {
    console.error("saveToCommunityCache error:", err.message);
  }
}
