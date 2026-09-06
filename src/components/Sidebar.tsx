import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search,
  MoreVertical,
  Copy,
  Edit2,
  Trash2,
  Star,
  Volume2,
  Tv,
  Layers,
} from "lucide-react";
import { VoiceProfile } from "../types";

interface SidebarProps {
  profiles: VoiceProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onNewProfile: () => void;
  onEditProfile: (profile: VoiceProfile) => void;
  onDuplicateProfile: (profile: VoiceProfile) => void;
  onDeleteProfile: (profile: VoiceProfile) => void;
  onSetDefaultProfile: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
  onNewProfile,
  onEditProfile,
  onDuplicateProfile,
  onDeleteProfile,
  onSetDefaultProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredProfiles = profiles.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.channelName.toLowerCase().includes(q) ||
      p.voice.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  return (
    <aside className="w-full md:w-80 lg:w-84 bg-[#0C0C0E] border-r border-white/5 flex flex-col shrink-0 h-full">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Voice Profiles
            </h2>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/5 text-slate-400 border border-white/10">
              {profiles.length}
            </span>
          </div>

          <button
            onClick={onNewProfile}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/40 text-indigo-300 hover:text-indigo-200 text-xs font-semibold transition-all shadow-xs"
            title="Create a new narrator identity profile"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Profile</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels or voices..."
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
          />
        </div>
      </div>

      {/* Profiles List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
              <Layers className="w-5 h-5" />
            </div>
            <p className="text-slate-400 text-xs font-medium">
              {searchQuery ? "No voice profiles match your search." : "No voice profiles created yet."}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewProfile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Voice Profile</span>
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredProfiles.map((p) => {
              const isActive = p.id === activeProfileId;
              const isMenuOpen = openMenuId === p.id;

              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className={`group relative rounded-lg p-3 border transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600/10 border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.1)]"
                      : "bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-white/10"
                  }`}
                  onClick={() => onSelectProfile(p.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3
                          className={`text-xs font-bold truncate leading-tight ${
                            isActive ? "text-indigo-400" : "text-slate-200 group-hover:text-white"
                          }`}
                        >
                          {p.name}
                        </h3>
                        {p.isDefault && (
                          <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-indigo-300" /> Default
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                        <Tv className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{p.channelName}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-300 mt-2 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 font-mono text-[10px] text-indigo-300 flex items-center gap-1">
                          <Volume2 className="w-2.5 h-2.5 text-indigo-400" /> {p.voice}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400">{p.gender}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400">{p.style}</span>
                      </div>

                      {p.description && (
                        <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-1 italic">
                          "{p.description}"
                        </p>
                      )}
                    </div>

                    {/* Context Menu Button */}
                    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenMenuId(isMenuOpen ? null : p.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Profile actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Popover Menu with AnimatePresence */}
                      <AnimatePresence>
                        {isMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -4 }}
                              transition={{ duration: 0.12 }}
                              className="absolute right-0 top-6 z-50 w-44 bg-[#0C0C0E] border border-white/10 rounded-lg shadow-2xl p-1 text-xs space-y-0.5"
                            >
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onEditProfile(p);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-slate-200 hover:bg-white/5 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                Edit Profile
                              </button>

                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onDuplicateProfile(p);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-slate-200 hover:bg-white/5 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                Duplicate Profile
                              </button>

                              {!p.isDefault && (
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onSetDefaultProfile(p.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-slate-200 hover:bg-white/5 transition-colors"
                                >
                                  <Star className="w-3.5 h-3.5 text-indigo-400" />
                                  Set as Default
                                </button>
                              )}

                              <div className="border-t border-white/5 my-1" />

                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onDeleteProfile(p);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Profile
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Sidebar Footer info */}
      <div className="p-3 border-t border-white/5 bg-black/20 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Persistent identity (WHO)</span>
        <span className="font-mono text-slate-400">localStorage</span>
      </div>
    </aside>
  );
};
