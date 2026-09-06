import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  History,
  X,
  Play,
  Pause,
  Download,
  Trash2,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Search,
  Copy,
  Check,
} from "lucide-react";
import { GenerationHistoryItem } from "../types";
import {
  formatDuration,
  triggerAudioDownload,
  base64ToUint8Array,
  convertPcmToWav,
  getRuntimeAudio,
  cacheRuntimeAudio,
} from "../services/audio";

interface GenerationHistoryProps {
  isOpen: boolean;
  history: GenerationHistoryItem[];
  onClose: () => void;
  onClearHistory: () => void;
  onLoadScript: (item: GenerationHistoryItem) => void;
  onDeleteItem?: (id: string) => void;
}

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({
  isOpen,
  history,
  onClose,
  onClearHistory,
  onLoadScript,
  onDeleteItem,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    const q = searchQuery.toLowerCase();
    return history.filter(
      (item) =>
        item.fullText.toLowerCase().includes(q) ||
        item.profileName.toLowerCase().includes(q) ||
        item.voice.toLowerCase().includes(q) ||
        item.channelName.toLowerCase().includes(q)
    );
  }, [history, searchQuery]);

  const getAudioUrl = (item: GenerationHistoryItem): string | null => {
    const cached = getRuntimeAudio(item.id);
    if (cached?.url) return cached.url;

    if (item.audioBase64) {
      try {
        const bytes = base64ToUint8Array(item.audioBase64);
        const blob = convertPcmToWav(bytes, item.sampleRate || 24000);
        const url = URL.createObjectURL(blob);
        cacheRuntimeAudio(item.id, blob, url, item.audioBase64);
        return url;
      } catch (e) {
        console.error("Error decoding audio:", e);
      }
    }
    return null;
  };

  const handlePlay = (item: GenerationHistoryItem) => {
    if (playingId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    const url = getAudioUrl(item);
    if (url && audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().catch(console.error);
      setPlayingId(item.id);
      setCurrentTime(0);
    }
  };

  const handleDownload = (item: GenerationHistoryItem) => {
    const cached = getRuntimeAudio(item.id);
    if (cached?.blob) {
      triggerAudioDownload(cached.blob, item.filename);
      return;
    }

    if (item.audioBase64) {
      const bytes = base64ToUint8Array(item.audioBase64);
      const blob = convertPcmToWav(bytes, item.sampleRate || 24000);
      triggerAudioDownload(blob, item.filename);
    }
  };

  const handleCopyText = (item: GenerationHistoryItem) => {
    navigator.clipboard.writeText(item.fullText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative z-10 w-full sm:w-105 bg-[#0C0C0E] border-l border-white/10 shadow-2xl flex flex-col h-full"
          >
            {/* Audio player element */}
            <audio
              ref={audioRef}
              onEnded={() => {
                setPlayingId(null);
                setCurrentTime(0);
              }}
              onPause={() => setPlayingId(null)}
              onTimeUpdate={() => {
                if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
              }}
            />

            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Recent Generations
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/5 text-slate-400 border border-white/10">
                  {history.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    onClick={onClearHistory}
                    className="text-[11px] text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition-colors"
                    title="Clear all recent history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Filter if has history */}
            {history.length > 0 && (
              <div className="p-3 border-b border-white/5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search past generations..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-16 px-4 text-slate-500 text-xs space-y-2">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500 mb-2">
                    <History className="w-5 h-5" />
                  </div>
                  <p className="font-medium text-slate-300">No audio files generated yet.</p>
                  <p className="text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Your generated narrations will appear here for instant replay, download, and script recovery.
                  </p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  No generations match "{searchQuery}".
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredHistory.map((item) => {
                    const isPlaying = playingId === item.id;
                    const isExpanded = expandedId === item.id;
                    const hasAudio = Boolean(getRuntimeAudio(item.id)?.url || item.audioBase64);
                    const date = new Date(item.timestamp);
                    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
                    const wordCount = item.fullText.trim().split(/\s+/).filter(Boolean).length;

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={`bg-black/40 border rounded-xl p-3 space-y-2.5 transition-all text-xs ${
                          isPlaying
                            ? "border-indigo-500/50 shadow-[0_0_15px_rgba(79,70,229,0.2)]"
                            : "border-white/5 hover:border-white/15"
                        }`}
                      >
                        {/* Meta header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-slate-200 font-medium truncate">
                              <span className="truncate">{item.profileName}</span>
                              <span className="text-slate-600">·</span>
                              <span className="text-indigo-300 font-mono text-[10px] px-1.5 py-0.2 rounded bg-indigo-600/15 border border-indigo-500/30">
                                {item.voice}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                              <span>{dateStr} at {timeStr}</span>
                              <span>·</span>
                              <span className="font-mono text-indigo-300 font-medium">
                                {formatDuration(item.durationSec, true)}
                              </span>
                              <span>·</span>
                              <span>{wordCount} words</span>
                            </div>
                          </div>

                          {/* Actions: Play & Download */}
                          <div className="flex items-center gap-1 shrink-0">
                            {hasAudio ? (
                              <>
                                <button
                                  onClick={() => handlePlay(item)}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                    isPlaying
                                      ? "bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                                      : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10"
                                  }`}
                                  title={isPlaying ? "Pause" : "Play"}
                                >
                                  {isPlaying ? (
                                    <Pause className="w-3.5 h-3.5 fill-current" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                  )}
                                </button>

                                <button
                                  onClick={() => handleDownload(item)}
                                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors"
                                  title="Download WAV"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-white/5">
                                Expired
                              </span>
                            )}

                            {onDeleteItem && (
                              <button
                                onClick={() => onDeleteItem(item.id)}
                                className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Script text snippet */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 text-slate-300 text-[11px] leading-relaxed">
                          <p className={isExpanded ? "" : "line-clamp-2"}>
                            "{item.fullText}"
                          </p>
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5">
                            {item.fullText.length > 90 ? (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 font-medium"
                              >
                                {isExpanded ? (
                                  <>
                                    <span>Collapse</span>
                                    <ChevronUp className="w-3 h-3" />
                                  </>
                                ) : (
                                  <>
                                    <span>Read full ({item.fullText.length} chars)</span>
                                    <ChevronDown className="w-3 h-3" />
                                  </>
                                )}
                              </button>
                            ) : <div />}

                            <button
                              onClick={() => handleCopyText(item)}
                              className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                            >
                              {copiedId === item.id ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Footer action: Load Script */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                          <span className="truncate max-w-[180px] font-mono text-[10px] text-slate-500">
                            {item.filename}
                          </span>
                          <button
                            onClick={() => onLoadScript(item)}
                            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors font-medium text-xs"
                          >
                            <span>Load Script</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
