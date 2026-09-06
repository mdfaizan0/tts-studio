import React from "react";
import { Mic, Radio, History, Info, Sparkles, Volume2, RotateCcw } from "lucide-react";
import { VoiceProfile } from "../types";

interface HeaderProps {
  currentProfile: VoiceProfile | null;
  onOpenInfo: () => void;
  onToggleHistory: () => void;
  historyCount: number;
  isHistoryOpen: boolean;
  onEditCurrentProfile: () => void;
  onResetToBlank?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProfile,
  onOpenInfo,
  onToggleHistory,
  historyCount,
  isHistoryOpen,
  onEditCurrentProfile,
  onResetToBlank,
}) => {
  return (
    <header className="h-16 bg-[#09090B]/90 border-b border-white/5 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.4)]">
          <Mic className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white uppercase">
              TTS Studio
            </h1>
            <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-indigo-400 border border-white/10">
              Production Utility
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Gemini TTS Short-Form Narration Engine
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5">
        {/* Active Profile Status Chip */}
        {currentProfile && (
          <button
            onClick={onEditCurrentProfile}
            title="Active Voice Profile — click to edit settings"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 transition-colors"
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <div className="flex items-center gap-1.5 text-left">
              <span className="text-slate-400 hidden md:inline">Profile:</span>
              <span className="font-medium text-white max-w-[140px] sm:max-w-[200px] truncate">
                {currentProfile.name}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-600/20 text-indigo-300 font-mono text-[10px] border border-indigo-500/20">
                {currentProfile.voice}
              </span>
            </div>
          </button>
        )}

        {/* Clear All / Blank Canvas button */}
        {onResetToBlank && (
          <button
            onClick={onResetToBlank}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 text-xs border border-white/10 transition-colors"
            title="Clear all profiles, text, and history to start from a blank canvas"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Canvas</span>
          </button>
        )}

        {/* History Toggle */}
        <button
          onClick={onToggleHistory}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            isHistoryOpen
              ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
              : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
          }`}
          title="Toggle Recent Generations"
        >
          <History className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Recent</span>
          {historyCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300 font-mono text-[10px]">
              {historyCount}
            </span>
          )}
        </button>

        {/* Guide / Info */}
        <button
          onClick={onOpenInfo}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
          title="TTS Studio Guidelines & Voice Reference"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
