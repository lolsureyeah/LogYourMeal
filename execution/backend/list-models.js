import { writeFileSync } from "fs";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
  const data = await res.json();
  const names = data.models?.map(m => m.name) || [];
  writeFileSync("models.json", JSON.stringify(names, null, 2), "utf8");
}

listModels();
