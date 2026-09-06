import { VoiceOption } from "../types";

export const VOICE_LIST: VoiceOption[] = [
  { name: "Enceladus", description: "Breathy · Intimate & conversational", gender: "Male", category: "Warm / Conversational" },
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
  { name: "Sulafat", description: "Neutral · Direct · Unadorned", gender: "Female", category: "Neutral / Minimal" },
];

export const ACCENT_OPTIONS = [
  "American (Gen)",
  "American (Valley)",
  "American (Southern)",
  "British",
  "Australian",
  "Indian",
  "Other / Custom",
];

export const STYLE_OPTIONS = [
  "Deadpan",
  "Newscaster",
  "Conversational",
  "Storytelling",
  "Dramatic",
  "Energetic",
  "Calm",
  "Serious",
  "Casual",
  "Warm",
  "Custom",
];

export const PACE_OPTIONS = ["Slow", "Natural", "Fast", "Rapid Fire", "Custom"];

export function getVoiceDetails(voiceName: string): VoiceOption | undefined {
  return VOICE_LIST.find((v) => v.name.toLowerCase() === voiceName.toLowerCase());
}
