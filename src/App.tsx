import React, { useState, useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { GeneratorPanel } from "./components/GeneratorPanel";
import { ProfileModal } from "./components/ProfileModal";
import { ConfirmModal } from "./components/ConfirmModal";
import { GenerationHistory } from "./components/GenerationHistory";
import { InfoModal } from "./components/InfoModal";
import { VoiceProfile, GenerationDraft, GenerationResult, GenerationHistoryItem } from "./types";
import {
  loadProfiles,
  saveProfiles,
  getDefaultProfileId,
  setDefaultProfileId,
  getLastProfileId,
  setLastProfileId,
  loadDraft,
  loadHistory,
  saveHistoryItem,
  clearHistory,
  clearAllStorage,
  deleteHistoryItem,
} from "./services/storage";
import { Menu, X, Plus, Mic } from "lucide-react";

export default function App() {
  // State: Profiles
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>("");

  // State: Draft and History
  const [draft, setDraft] = useState<GenerationDraft>(loadDraft);
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);

  // State: Modals
  const [modalProfile, setModalProfile] = useState<VoiceProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // State: Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Initial load
  useEffect(() => {
    const loadedProfiles = loadProfiles();
    setProfiles(loadedProfiles);

    // Determine initial active profile:
    // 1. Default profile marked in storage
    // 2. Last used profile in storage
    // 3. First profile in list
    const defaultId = getDefaultProfileId();
    const lastId = getLastProfileId();

    let initialId = loadedProfiles[0]?.id;
    if (defaultId && loadedProfiles.some((p) => p.id === defaultId)) {
      initialId = defaultId;
    } else if (lastId && loadedProfiles.some((p) => p.id === lastId)) {
      initialId = lastId;
    }

    if (initialId) {
      setActiveProfileId(initialId);
    }

    setHistory(loadHistory());
  }, []);

  // Current active profile
  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeProfileId) || profiles[0] || null;
  }, [profiles, activeProfileId]);

  // Profile selection
  const handleSelectProfile = (id: string) => {
    setActiveProfileId(id);
    setLastProfileId(id);
    setIsMobileSidebarOpen(false);
  };

  // Create new profile
  const handleNewProfile = () => {
    setModalProfile(null);
    setIsProfileModalOpen(true);
  };

  // Edit profile
  const handleEditProfile = (profile: VoiceProfile) => {
    setModalProfile(profile);
    setIsProfileModalOpen(true);
  };

  // Save profile from modal
  const handleSaveProfile = (savedProfile: VoiceProfile) => {
    let updated: VoiceProfile[];
    const exists = profiles.some((p) => p.id === savedProfile.id);

    if (exists) {
      updated = profiles.map((p) => {
        if (p.id === savedProfile.id) {
          return savedProfile;
        }
        // If this one became default, unset other defaults
        if (savedProfile.isDefault && p.isDefault) {
          return { ...p, isDefault: false };
        }
        return p;
      });
    } else {
      updated = savedProfile.isDefault
        ? [...profiles.map((p) => ({ ...p, isDefault: false })), savedProfile]
        : [...profiles, savedProfile];
    }

    if (savedProfile.isDefault) {
      setDefaultProfileId(savedProfile.id);
    }

    setProfiles(updated);
    saveProfiles(updated);
    setActiveProfileId(savedProfile.id);
    setLastProfileId(savedProfile.id);
    setIsProfileModalOpen(false);
  };

  // Duplicate profile
  const handleDuplicateProfile = (profileToDuplicate: VoiceProfile) => {
    const timestamp = Date.now();
    const newName = profileToDuplicate.name.includes("— Main")
      ? profileToDuplicate.name.replace("— Main", "— Experimental")
      : `${profileToDuplicate.name} (Copy)`;

    const duplicated: VoiceProfile = {
      ...profileToDuplicate,
      id: `profile-${timestamp}-${Math.random().toString(36).slice(2, 6)}`,
      name: newName,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...profiles, duplicated];
    setProfiles(updated);
    saveProfiles(updated);
    setActiveProfileId(duplicated.id);
    setLastProfileId(duplicated.id);
  };

  // Delete profile
  const handleDeleteProfile = (profileToDelete: VoiceProfile) => {
    if (profiles.length <= 1) {
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Delete Voice Profile?",
      message: `Are you sure you want to delete "${profileToDelete.name}"? This will remove the saved speaker settings and voice direction.`,
      confirmLabel: "Delete Profile",
      isDestructive: true,
      onConfirm: () => {
        const updated = profiles.filter((p) => p.id !== profileToDelete.id);
        setProfiles(updated);
        saveProfiles(updated);

        // If active profile was deleted, switch to default or first available
        if (activeProfileId === profileToDelete.id) {
          const next = updated.find((p) => p.isDefault) || updated[0];
          if (next) {
            setActiveProfileId(next.id);
            setLastProfileId(next.id);
          }
        }

        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Set default profile
  const handleSetDefaultProfile = (profileId: string) => {
    const updated = profiles.map((p) => ({
      ...p,
      isDefault: p.id === profileId,
    }));
    setProfiles(updated);
    saveProfiles(updated);
    setDefaultProfileId(profileId);
  };

  // Generation complete
  const handleGenerationComplete = (result: GenerationResult) => {
    const historyItem: GenerationHistoryItem = {
      id: result.id,
      timestamp: result.generatedAt,
      profileId: activeProfile?.id,
      profileName: result.profileName,
      channelName: result.channelName,
      voice: result.voice,
      textSnippet: result.text.slice(0, 100),
      fullText: result.text,
      durationSec: result.durationSec,
      latencyMs: result.latencyMs,
      filename: result.filename,
      sampleRate: result.sampleRate,
      audioBase64: result.audioBase64,
    };

    const updatedHistory = saveHistoryItem(historyItem);
    setHistory(updatedHistory);
  };

  // Clear all history
  const handleClearHistory = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Clear Generation History?",
      message: "This will remove all recent audio generation records from local storage. This action cannot be undone.",
      confirmLabel: "Clear History",
      isDestructive: true,
      onConfirm: () => {
        clearHistory();
        setHistory([]);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Delete individual history item
  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistory(updated);
  };

  // Load script from history into generator
  const handleLoadScript = (item: GenerationHistoryItem) => {
    setDraft((prev) => ({
      ...prev,
      text: item.fullText,
      projectTitle: item.projectTitle || prev.projectTitle,
    }));
    // If profile still exists, optionally switch to it
    if (item.profileId && profiles.some((p) => p.id === item.profileId)) {
      handleSelectProfile(item.profileId);
    }
    setIsHistoryOpen(false);
  };

  // Reset to blank canvas: clears all saved profiles, draft text, and history
  const handleResetToBlankCanvas = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Reset to Blank Canvas?",
      message:
        "This will clear out all saved voice profiles, drafts, and recent generations so you can start completely fresh.",
      confirmLabel: "Reset to Blank Canvas",
      isDestructive: true,
      onConfirm: () => {
        clearAllStorage();
        setProfiles([]);
        setActiveProfileId("");
        setDraft({ projectTitle: "", scene: "", sampleContext: "", text: "" });
        setHistory([]);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#09090B] text-slate-200 font-sans antialiased selection:bg-indigo-600 selection:text-white overflow-hidden">
      {/* Top Application Header */}
      <Header
        currentProfile={activeProfile}
        onOpenInfo={() => setIsInfoOpen(true)}
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
        historyCount={history.length}
        isHistoryOpen={isHistoryOpen}
        onEditCurrentProfile={() => activeProfile && handleEditProfile(activeProfile)}
        onResetToBlank={handleResetToBlankCanvas}
      />

      {/* Mobile Drawer Toggle Banner */}
      <div className="md:hidden bg-[#0C0C0E] border-b border-white/5 px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <Menu className="w-4 h-4 text-indigo-400" />
          <span>Switch Voice Profile ({activeProfile?.name || "None"})</span>
        </button>
      </div>

      {/* Main Container: Sidebar + Generator Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Left Sidebar */}
        <div className="hidden md:flex shrink-0">
          <Sidebar
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelectProfile={handleSelectProfile}
            onNewProfile={handleNewProfile}
            onEditProfile={handleEditProfile}
            onDuplicateProfile={handleDuplicateProfile}
            onDeleteProfile={handleDeleteProfile}
            onSetDefaultProfile={handleSetDefaultProfile}
          />
        </div>

        {/* Mobile Slide-over Sidebar */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative w-80 max-w-[85vw] bg-[#0C0C0E] border-r border-white/10 h-full shadow-2xl flex flex-col z-10">
              <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Select Profile
                </span>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Sidebar
                profiles={profiles}
                activeProfileId={activeProfileId}
                onSelectProfile={handleSelectProfile}
                onNewProfile={handleNewProfile}
                onEditProfile={handleEditProfile}
                onDuplicateProfile={handleDuplicateProfile}
                onDeleteProfile={handleDeleteProfile}
                onSetDefaultProfile={handleSetDefaultProfile}
              />
            </div>
          </div>
        )}

        {/* Center Main Panel: TTS Generator */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#09090B]">
          {activeProfile ? (
            <GeneratorPanel
              key={activeProfile.id}
              currentProfile={activeProfile}
              initialDraft={draft}
              onEditProfile={handleEditProfile}
              onGenerationComplete={handleGenerationComplete}
              history={history}
              onClearHistory={handleClearHistory}
              onDeleteItem={handleDeleteHistoryItem}
              onLoadScript={handleLoadScript}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_25px_rgba(79,70,229,0.15)]">
                <Mic className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-white">Start from a Blank Canvas</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Create your first voice profile to set up your channel narrator identity (voice, accent, pace, and vocal directions).
                </p>
              </div>
              <button
                onClick={handleNewProfile}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Voice Profile</span>
              </button>
            </div>
          )}
        </main>

        {/* Right Drawer: Recent Generations History */}
        <GenerationHistory
          isOpen={isHistoryOpen}
          history={history}
          onClose={() => setIsHistoryOpen(false)}
          onClearHistory={handleClearHistory}
          onDeleteItem={handleDeleteHistoryItem}
          onLoadScript={handleLoadScript}
        />
      </div>

      {/* Profile Create / Edit Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        profile={modalProfile}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Reference & Guide Modal */}
      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </div>
  );
}
