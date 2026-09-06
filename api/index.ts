import express from "express";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

// Lazy initialization of Gemini client
let genAiClient: GoogleGenAI | null = null;
function getGenAi(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it to your Vercel Environment Variables.");
  }
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAiClient;
}

// Complete catalog of Gemini TTS voices with official descriptors and vocal characteristics
const VOICES_CATALOG = [
  { name: "Enceladus", description: "Breathy · Natural & intimate", gender: "Male", category: "Warm / Conversational" },
  { name: "Charon", description: "Informative · Lower pitch · Resonant", gender: "Male", category: "Documentary / Authoritative" },
  { name: "Puck", description: "Upbeat · Engaging · Animated", gender: "Male", category: "Dynamic / Storytelling" },
  { name: "Zephyr", description: "Bright · Crisp · Modern", gender: "Female", category: "Commercial / Clean" },
  { name: "Kore", description: "Calm · Smooth · Grounded", gender: "Female", category: "Narrative / Meditative" },
  { name: "Fenrir", description: "Deep · Steady · Intense", gender: "Male", category: "Dramatic / Serious" },
  { name: "Leda", description: "Youthful · Expressive · Friendly", gender: "Female", category: "Conversational / Casual" },
  { name: "Orus", description: "Warm · Direct · Confident", gender: "Male", category: "Explainer / Podcaster" },
  { name: "Aoede", description: "Melodic · Gentle · Poetic", gender: "Female", category: "Artistic / Narrative" },
  { name: "Callirrhoe", description: "Nuanced · Articulate · Crisp", gender: "Female", category: "Educational / Narration" },
  { name: "Autonoe", description: "Bright · Professional · Quick", gender: "Female", category: "Fast-paced / News" },
  { name: "Iapetus", description: "Clear · Balanced · Storyteller", gender: "Male", category: "Narrative / Clear" },
  { name: "Umbriel", description: "Subdued · Atmospheric · Whispering edge", gender: "Male", category: "Mystery / Thriller" },
  { name: "Algieba", description: "Polished · Formal · Articulate", gender: "Male", category: "Technical / Formal" },
  { name: "Despina", description: "Lively · Charismatic · Approachable", gender: "Female", category: "Vlog / Casual" },
  { name: "Erinome", description: "Soft · Thoughtful · Deliberate", gender: "Female", category: "Introspective / Calm" },
  { name: "Algenib", description: "Punchy · Bold · Crisp", gender: "Male", category: "Action / Fast-paced" },
  { name: "Rasalgethi", description: "Rich · Resonant · Storyteller", gender: "Male", category: "Audiobook / Epic" },
  { name: "Laomedeia", description: "Clear-toned · Measured · Steady", gender: "Female", category: "Fact-based / Video Essay" },
  { name: "Achernar", description: "Dynamic · Assertive · Sharp", gender: "Male", category: "Commentary / Review" },
  { name: "Alnilam", description: "Cool · Collected · Analytical", gender: "Male", category: "Science / Deep-dive" },
  { name: "Schedar", description: "Even · Steady cadence · Trustworthy", gender: "Female", category: "Documentary / Even" },
  { name: "Gacrux", description: "Grounded · Conversational · Casual", gender: "Male", category: "Unfiltered / Relatable" },
  { name: "Pulcherrima", description: "Refined · Warm timbre · Gentle", gender: "Female", category: "Historical / Story" },
  { name: "Achird", description: "Youthful · Quick-witted · Casual", gender: "Male", category: "Comedy / Entertainment" },
  { name: "Zubenelgenubi", description: "Casual · Relaxed · Conversational", gender: "Male", category: "Casual / Offbeat" },
  { name: "Vindemiatrix", description: "Firm · Persuasive · Articulate", gender: "Female", category: "Debate / Analysis" },
  { name: "Sadachbia", description: "Gentle · Compassionate · Soft", gender: "Female", category: "Empathetic / Personal" },
  { name: "Sadaltager", description: "Stately · Measured · Deep", gender: "Male", category: "Ancient Lore / Historical" },
  { name: "Sulafat", description: "Neutral · Direct · Unadorned", gender: "Female", category: "Neutral / Minimal" }
];

// Health endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    defaultModel: "gemini-3.1-flash-tts-preview"
  });
});

// Voices endpoint
app.get("/api/tts/voices", (_req, res) => {
  res.json({
    voices: VOICES_CATALOG,
    defaultVoice: "Enceladus",
    totalVoices: VOICES_CATALOG.length
  });
});

// TTS Generation endpoint
app.post("/api/tts/generate", async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      voice = "Enceladus",
      profileName,
      channelName,
      gender,
      accent,
      style,
      pace,
      voiceDirection,
      scene,
      sampleContext,
      text,
      model = "gemini-3.1-flash-tts-preview"
    } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({
        error: "Missing text",
        message: "The narration text cannot be empty. Please enter the complete narration script."
      });
    }

    const trimmedText = text.trim();
    const ai = getGenAi();

    const promptParts: string[] = [];
    promptParts.push("Perform text-to-speech narration with the following vocal parameters and performance instructions:");
    
    const vocalTraits: string[] = [];
    if (gender) vocalTraits.push(`Gender: ${gender}`);
    if (accent && accent !== "None") vocalTraits.push(`Accent: ${accent}`);
    if (style) vocalTraits.push(`Style: ${style}`);
    if (pace) vocalTraits.push(`Pacing: ${pace}`);
    if (channelName) vocalTraits.push(`Channel / Context: ${channelName}`);
    if (profileName) vocalTraits.push(`Narrator Identity: ${profileName}`);

    if (vocalTraits.length > 0) {
      promptParts.push(`[Vocal Character & Specifications]\n${vocalTraits.join("\n")}`);
    }

    if (voiceDirection && voiceDirection.trim().length > 0) {
      promptParts.push(`[Persistent Voice Direction & Tone Guidelines]\n${voiceDirection.trim()}`);
    }

    if (scene && scene.trim().length > 0) {
      promptParts.push(`[Video Storytelling Scene & Environmental Setting]\n${scene.trim()}`);
    }

    if (sampleContext && sampleContext.trim().length > 0) {
      promptParts.push(`[Performance & Emotional Delivery Notes]\n${sampleContext.trim()}`);
    }

    promptParts.push(
      `[Spoken Script - Spoken Output Requirement]\nSpeak EXACTLY the following text verbatim as the complete audio output. Do NOT alter, summarize, add greetings, add preamble, or insert narrator tags:\n\n${trimmedText}`
    );

    const fullPrompt = promptParts.join("\n\n");

    const response = await ai.models.generateContent({
      model: model || "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: fullPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || "Enceladus" },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts;
    
    let audioBase64: string | undefined;
    let mimeType: string = "audio/pcm;rate=24000";

    if (parts && parts.length > 0) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          audioBase64 = part.inlineData.data;
          if (part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          break;
        }
      }
    }

    if (!audioBase64) {
      return res.status(502).json({
        error: "Generation Failed",
        message: "The model completed the request without producing audio data. This may be due to content moderation or temporary API unavailability."
      });
    }

    const latencyMs = Date.now() - startTime;
    let sampleRate = 24000;
    const rateMatch = mimeType.match(/rate=(\d+)/i);
    if (rateMatch && rateMatch[1]) {
      sampleRate = parseInt(rateMatch[1], 10);
    }

    res.json({
      success: true,
      audioBase64,
      mimeType,
      sampleRate,
      latencyMs,
      voice,
      model: model || "gemini-3.1-flash-tts-preview",
      usageMetadata: response.usageMetadata || null,
      generatedAt: new Date().toISOString()
    });

  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = err?.message || String(err);
    let statusCode = 500;
    let userFriendly = "An error occurred while generating speech with Gemini TTS.";

    if (errorMessage.includes("API_KEY") || errorMessage.includes("unauthorized") || errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("API key")) {
      statusCode = 401;
      userFriendly = "Gemini API key is invalid or not configured. Ensure GEMINI_API_KEY is active in your Vercel Environment Variables.";
    } else if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
      statusCode = 429;
      userFriendly = "Gemini API quota or rate limit exceeded. Please wait a moment and try again.";
    } else if (errorMessage.includes("INVALID_ARGUMENT") || errorMessage.includes("not found")) {
      statusCode = 400;
      userFriendly = `Invalid request or unsupported voice: ${errorMessage}`;
    }

    res.status(statusCode).json({
      error: "TTS Generation Error",
      message: userFriendly,
      details: errorMessage,
      latencyMs
    });
  }
});

export default app;
