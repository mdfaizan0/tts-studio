import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Mic,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Type,
  Sliders,
  Volume2,
  Tv,
  History,
  Info,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { VoiceProfile, GenerationDraft, GenerationResult, GenerationHistoryItem } from "../types";
import { AudioPlayerCard } from "./AudioPlayerCard";
import { RecentGenerationsSection } from "./RecentGenerationsSection";
import {
  estimateNarrationDuration,
  formatDuration,
  getSpeakingRateWpm,
  base64ToUint8Array,
  convertPcmToWav,
  calculatePcmDuration,
  sanitizeFilename,
  cacheRuntimeAudio,
} from "../services/audio";
import { saveDraft } from "../services/storage";

interface GeneratorPanelProps {
  currentProfile: VoiceProfile;
  initialDraft: GenerationDraft;
  onEditProfile: (profile: VoiceProfile) => void;
  onGenerationComplete: (result: GenerationResult) => void;
  history?: GenerationHistoryItem[];
  onClearHistory?: () => void;
  onDeleteItem?: (id: string) => void;
  onLoadScript?: (item: GenerationHistoryItem) => void;
}

export const GeneratorPanel: React.FC<GeneratorPanelProps> = ({
  currentProfile,
  initialDraft,
  onEditProfile,
  onGenerationComplete,
  history = [],
  onClearHistory = () => {},
  onDeleteItem = (_id: string) => {},
  onLoadScript = (_item: GenerationHistoryItem) => {},
}) => {
  // Top-level tab state
  const [activeTab, setActiveTab] = useState<"studio" | "history">("studio");

  // Inputs
  const [projectTitle, setProjectTitle] = useState(initialDraft.projectTitle || "");
  const [scene, setScene] = useState(initialDraft.scene || "");
  const [sampleContext, setSampleContext] = useState(initialDraft.sampleContext || "");
  const [text, setText] = useState(initialDraft.text || "");

  // Status
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<GenerationResult | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [showDurationInfo, setShowDurationInfo] = useState(false);

  // Timer reference for elapsed seconds
  const timerRef = useRef<any>(null);

  // Auto-save draft
  useEffect(() => {
    saveDraft({
      projectTitle,
      scene,
      sampleContext,
      text,
    });
  }, [projectTitle, scene, sampleContext, text]);

  // Handle external script loader if draft is updated
  useEffect(() => {
    if (initialDraft) {
      if (initialDraft.projectTitle !== undefined) setProjectTitle(initialDraft.projectTitle);
      if (initialDraft.scene !== undefined) setScene(initialDraft.scene);
      if (initialDraft.sampleContext !== undefined) setSampleContext(initialDraft.sampleContext);
      if (initialDraft.text !== undefined) setText(initialDraft.text);
    }
  }, [initialDraft]);

  // Compute live character count, word count, and estimated duration
  const charCount = text.length;
  const wordCount = useMemo(() => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }, [text]);

  const speakingWpm = useMemo(() => {
    return getSpeakingRateWpm(currentProfile.pace);
  }, [currentProfile.pace]);

  const estimatedDurationSec = useMemo(() => {
    return estimateNarrationDuration(text, currentProfile.pace);
  }, [text, currentProfile.pace]);

  // Generation handler
  const handleGenerate = async () => {
    if (!text.trim()) {
      setErrorMessage("Please enter the complete narration script before generating.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setElapsedSeconds(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    try {
      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voice: currentProfile.voice,
          profileName: currentProfile.name,
          channelName: currentProfile.channelName,
          gender: currentProfile.gender,
          accent: currentProfile.accent,
          style: currentProfile.style,
          pace: currentProfile.pace,
          voiceDirection: currentProfile.voiceDirection,
          scene: scene.trim(),
          sampleContext: sampleContext.trim(),
          text: text.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.audioBase64) {
        throw new Error(data.message || data.error || "Failed to generate audio.");
      }

      // Convert raw audio data / PCM to WAV Blob
      const rawBytes = base64ToUint8Array(data.audioBase64);
      const wavBlob = convertPcmToWav(rawBytes, data.sampleRate || 24000);
      const wavUrl = URL.createObjectURL(wavBlob);
      const durationSec = calculatePcmDuration(rawBytes.byteLength, data.sampleRate || 24000);

      // Create sensible filename
      const dateStr = new Date().toISOString().split("T")[0];
      const channelSlug = sanitizeFilename(currentProfile.channelName || "Channel");
      const titleSlug = projectTitle.trim() ? sanitizeFilename(projectTitle) : "Narration";
      const filename = `${channelSlug}_${titleSlug}_${dateStr}.wav`;

      const genId = `gen-${Date.now()}`;
      // Cache runtime audio immediately
      cacheRuntimeAudio(genId, wavBlob, wavUrl, data.audioBase64);

      const genResult: GenerationResult = {
        id: genId,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || "audio/wav",
        sampleRate: data.sampleRate || 24000,
        latencyMs: data.latencyMs || (Date.now() - startTime),
        voice: currentProfile.voice,
        model: data.model || "gemini-3.1-flash-tts-preview",
        usageMetadata: data.usageMetadata,
        durationSec,
        wavBlob,
        wavUrl,
        filename,
        profileName: currentProfile.name,
        channelName: currentProfile.channelName,
        text: text.trim(),
        generatedAt: new Date().toISOString(),
      };

      setCurrentResult(genResult);
      onGenerationComplete(genResult);
    } catch (err: any) {
      console.error("Narration generation error:", err);
      setErrorMessage(err?.message || "An unexpected error occurred during audio generation.");
    } finally {
      clearInterval(timerRef.current);
      setIsGenerating(false);
    }
  };

  const handleClearGenerator = () => {
    setScene("");
    setSampleContext("");
    setText("");
    setProjectTitle("");
    setCurrentResult(null);
    setErrorMessage(null);
  };

  const handleCopyText = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleLoadSampleScript = () => {
    setScene("Deep-sea research vessel off the coast of Iceland during a winter storm.");
    setSampleContext("Tense, hushed, scientific discovery turning into quiet alarm. Steady voice control.");
    setText(
      "Depth sensor reading: four thousand two hundred meters. The sonar pulse just returned a shape that shouldn't exist down here. It's metallic, perfectly symmetrical, and it just started emitting its own frequency."
    );
    setProjectTitle("Anomaly at 4000m");
  };

  const handleSelectFromHistory = (item: GenerationHistoryItem) => {
    onLoadScript(item);
    setActiveTab("studio");
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
      {/* View Switcher Tabs (Narration Studio vs Recent Generations) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#0C0C0E] border border-white/10 rounded-xl">
          <button
            onClick={() => setActiveTab("studio")}
            className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "studio"
                ? "text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {activeTab === "studio" && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-indigo-600 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.35)]"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              Narration Studio
            </span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "history"
                ? "text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {activeTab === "history" && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-indigo-600 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.35)]"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Recent Generations
              {history.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono transition-colors ${
                    activeTab === "history"
                      ? "bg-white/20 text-white"
                      : "bg-white/10 text-slate-300"
                  }`}
                >
                  {history.length}
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Quick Sample Button */}
        {activeTab === "studio" && !text && (
          <button
            onClick={handleLoadSampleScript}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 text-xs font-medium transition-colors"
            title="Load an example script for immediate audio testing"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Example Script</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "history" ? (
          <motion.div
            key="history-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <RecentGenerationsSection
              history={history}
              onClearHistory={onClearHistory}
              onDeleteItem={onDeleteItem}
              onLoadScript={handleSelectFromHistory}
            />
          </motion.div>
        ) : (
          <motion.div
            key="studio-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Top Banner: Current Profile Identity Summary */}
            <div className="bg-[#0C0C0E] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                    Active Voice Profile (WHO)
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Tv className="w-3 h-3 text-slate-500" />
                    {currentProfile.channelName}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-white">
                    {currentProfile.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-mono text-[11px] font-semibold flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-indigo-400" />
                      {currentProfile.voice}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">{currentProfile.gender}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">{currentProfile.accent}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">{currentProfile.style}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">{currentProfile.pace} pace</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onEditProfile(currentProfile)}
                className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-medium transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Voice Profile</span>
              </button>
            </div>

            {/* Main Generator Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Generate Narration
                    <span className="text-[11px] font-normal text-slate-400">
                      (WHAT is being spoken)
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Combines narrative context, scene cues, and authoritative script into a single complete audio file
                  </p>
                </div>

                <button
                  onClick={handleClearGenerator}
                  className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-white/5 transition-colors"
                  title="Clear all generator inputs (does not delete profile)"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Inputs</span>
                </button>
              </div>

              {/* Optional Project / Episode Title */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Project / Video Title <span className="text-slate-500">(Optional — used for WAV filename)</span>
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder=""
                  className="w-full bg-[#0C0C0E] border border-white/10 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              {/* Input 1: Scene */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Scene
                  </label>
                  <span className="text-[11px] text-slate-500">Video background context</span>
                </div>
                <p className="text-xs text-slate-400">
                  Describe the overall scene, situation, characters, environment, and storytelling context for this narration.
                </p>
                <textarea
                  rows={2}
                  value={scene}
                  onChange={(e) => setScene(e.target.value)}
                  placeholder=""
                  className="w-full bg-[#0C0C0E] border border-white/10 rounded-lg p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all leading-relaxed font-sans"
                />
              </div>

              {/* Input 2: Sample Context */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Sample Context
                  </label>
                  <span className="text-[11px] text-slate-500">Performance guidance</span>
                </div>
                <p className="text-xs text-slate-400">
                  Describe how this particular narration should be performed. Include emotional progression, tension, pacing, delivery, and important performance notes.
                </p>
                <textarea
                  rows={2}
                  value={sampleContext}
                  onChange={(e) => setSampleContext(e.target.value)}
                  placeholder=""
                  className="w-full bg-[#0C0C0E] border border-white/10 rounded-lg p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all leading-relaxed font-sans"
                />
              </div>

              {/* Input 3: Text / Narration (AUTHORITATIVE) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                      Text / Narration <span className="text-indigo-400">*</span>
                      <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                        Authoritative Spoken Script
                      </span>
                    </label>
                    <p className="text-xs text-slate-400">
                      Enter the complete narration for this video. Gemini TTS will speak this exact text verbatim.
                    </p>
                  </div>

                  {text && (
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/10 transition-colors"
                      title="Copy narration text"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Script</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <textarea
                  rows={7}
                  required
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder=""
                  className="w-full bg-[#0C0C0E] border border-white/10 rounded-lg p-3.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all leading-relaxed font-sans resize-y"
                />

                {/* Live Character Count, Word Count, and Estimated Narration Duration HUD */}
                <div className="bg-[#0C0C0E] border border-white/5 rounded-lg px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-400 font-mono flex-wrap gap-2.5 shadow-sm">
                  {/* Left: Live Character & Word Count */}
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Type className="w-3.5 h-3.5 text-slate-500" />
                      <strong className="text-white font-semibold">{charCount}</strong> characters
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300">
                      <strong className="text-white font-semibold">{wordCount}</strong> words
                    </span>
                  </div>

                  {/* Right: Estimated Narration Duration Display */}
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium cursor-help"
                      onClick={() => setShowDurationInfo((prev) => !prev)}
                      title="Informational estimate based on speaking pace. Click for details."
                    >
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>
                        ~{formatDuration(estimatedDurationSec, true)} estimated
                      </span>
                      <span className="text-slate-500 text-[10px] hidden sm:inline font-sans">
                        (approx. {speakingWpm} WPM • {currentProfile.pace})
                      </span>
                      <HelpCircle className="w-3 h-3 text-indigo-400 ml-0.5 opacity-70" />
                    </div>
                  </div>
                </div>

                {/* Informational Duration Details Box */}
                <AnimatePresence>
                  {showDurationInfo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-slate-300 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-indigo-300 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5" />
                          Estimated Duration Calculation (Informational Only)
                        </span>
                        <button
                          onClick={() => setShowDurationInfo(false)}
                          className="text-[11px] text-slate-500 hover:text-slate-300"
                        >
                          Dismiss
                        </button>
                      </div>
                      <p className="text-slate-400 leading-relaxed font-sans">
                        Calculated at ~{speakingWpm} words per minute based on your voice profile's <strong>{currentProfile.pace}</strong> pacing configuration. Actual Gemini TTS audio duration may vary slightly depending on punctuation, breath marks, and natural sentence cadence.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Primary Action Button: Generate Narration */}
              <div className="pt-2 relative">
                {/* Generating progress glow line */}
                {isGenerating && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500/20 overflow-hidden rounded-t-xl">
                    <motion.div
                      className="h-full bg-indigo-500 w-1/3"
                      animate={{ x: ["-100%", "400%"] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !text.trim()}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg ${
                    isGenerating || !text.trim()
                      ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_25px_rgba(79,70,229,0.35)] active:scale-[0.99]"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>
                        Generating Narration with Gemini TTS ({elapsedSeconds}s)...
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-white" />
                      <span>Generate Narration Audio</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Banner */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3 text-rose-300 text-xs"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-rose-200">Generation Unsuccessful</p>
                      <p className="leading-relaxed">{errorMessage}</p>
                      <div className="pt-2">
                        <button
                          onClick={handleGenerate}
                          className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-medium transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generated Result Audio Player Card */}
              {currentResult && (
                <div className="pt-2">
                  <AudioPlayerCard
                    result={currentResult}
                    onGenerateAgain={handleGenerate}
                  />
                </div>
              )}

              {/* Recent Takes / Generations Quick Preview Section */}
              {history.length > 0 && (
                <div className="pt-6 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Recent Takes ({history.length})
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab("history")}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
                    >
                      <span>View All Past Generations</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Render the latest 2 takes right here for convenience */}
                  <div className="space-y-2">
                    {history.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#0C0C0E] border border-white/5 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white truncate">
                              {item.profileName}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="font-mono text-[11px] text-indigo-300">
                              {item.voice}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-500">
                              {formatDuration(item.durationSec, true)}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] line-clamp-1 italic">
                            "{item.fullText}"
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                          <button
                            onClick={() => handleSelectFromHistory(item)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 text-xs font-medium hover:bg-indigo-600/25 transition-colors"
                          >
                            Load Script
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
