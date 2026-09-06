import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mic, Info, Sparkles, Layers, BookOpen, Volume2, ShieldCheck, History } from "lucide-react";
import { VOICE_LIST } from "../services/voices";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative bg-[#0C0C0E] border border-white/10 rounded-xl max-w-2xl w-full my-6 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.2)]">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    TTS Studio Guide & Reference
                  </h2>
                  <p className="text-xs text-slate-400">
                    Production utility architecture & best practices
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto py-4 space-y-5 text-xs text-slate-300 leading-relaxed pr-1">
              {/* Core Principle */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                  <Layers className="w-4 h-4" />
                  Core Architecture Principle
                </div>
                <p className="text-slate-300">
                  <strong className="text-white font-semibold">Voice Profile = WHO is speaking.</strong> Persistent narrator identity, gender, accent, vocal style, pacing, and detailed tone direction for your channel.
                </p>
                <p className="text-slate-300">
                  <strong className="text-white font-semibold">Video Generation = WHAT is being spoken.</strong> Video-specific scene setting, emotional delivery notes, and the authoritative script transcript.
                </p>
              </div>

              {/* Prompt Structure */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Gemini TTS Prompting Structure
                </h3>
                <ul className="space-y-2 text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <div>
                      <strong className="text-slate-200">Scene:</strong> Describes the overall environment, situation, and storytelling world (e.g. desert highway at 2 AM, stormy ocean, sterile laboratory).
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <div>
                      <strong className="text-slate-200">Sample Context:</strong> Performance execution notes: emotional escalation, tension, breathing pace, and punchline timing.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <div>
                      <strong className="text-slate-200">Text / Narration:</strong> The authoritative spoken transcript. Gemini TTS speaks this exact script verbatim without alterations or narrator labels.
                    </div>
                  </li>
                </ul>
              </div>

              {/* Live Metrics & Recent Generations */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Live Metrics & History
                </h3>
                <p className="text-slate-400">
                  As you type, real-time character count and word count update automatically. An informational estimated duration is calculated dynamically based on your profile's pacing profile (~150 WPM for Natural, ~125 WPM for Slow, ~180 WPM for Fast).
                </p>
                <p className="text-slate-400">
                  All past audio generations are safely recorded in your browser's local storage with full transcripts, instant playback, and 24 kHz WAV downloads.
                </p>
              </div>

              {/* Voice Reference Catalog */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Gemini Voices Reference ({VOICE_LIST.length} Available)
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-black/40 rounded-lg border border-white/10 font-mono text-[11px]">
                  {VOICE_LIST.map((v) => (
                    <div key={v.name} className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                      <div className="text-indigo-300 font-bold flex items-center justify-between">
                        <span>{v.name}</span>
                        <span className="text-[9px] text-slate-400 font-sans px-1 rounded bg-white/5">{v.gender}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-1 font-sans">
                        {v.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy & Storage */}
              <div className="flex items-start gap-2.5 pt-2 border-t border-white/5 text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  All Voice Profiles, generator drafts, and recent generations are stored locally in your browser's <code className="text-slate-200 font-mono">localStorage</code>. No external database or login required. API calls are proxied securely server-side.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-white/5 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
              >
                Close Guide
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
