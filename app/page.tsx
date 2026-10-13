"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { CallModal } from "@/components/chat/CallModal";
import { StoriesViewer } from "@/components/chat/StoriesViewer";
import { NewChatModal } from "@/components/chat/NewChatModal";
import { ProfileOnboardingModal } from "@/components/auth/ProfileOnboardingModal";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { useAuth } from "@/lib/auth";
import {
  Database,
  ExternalLink,
  Shield,
  Zap,
  Sparkles,
  HelpCircle,
  X,
  CheckCircle2,
  Lock,
  Radio,
  Globe,
  LogOut,
  Smartphone,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function Six9ChatPage() {
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    profile,
    needsOnboarding,
    setNeedsOnboarding,
    signOut,
  } = useAuth();

  const {
    currentUser,
    contacts,
    allContacts,
    activeContact,
    activeContactId,
    activeMessages,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    isTyping,
    stories,
    activeStory,
    openStory,
    closeStory,
    callState,
    startCall,
    endCall,
    selectContact,
    sendMessage,
    addReaction,
    supabaseStatus,
    channelConnected,
  } = useRealtimeChat();

  // Mobile navigation state: 'sidebar' | 'chat'
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);

  const handleSelectContactMobile = (id: string) => {
    selectContact(id);
    setMobileView("chat");
  };

  const handleBackToSidebarMobile = () => {
    setMobileView("sidebar");
  };

  const handleAddNewContact = (name: string, phone: string) => {
    const newId = `contact-${Date.now()}`;
    selectContact(newId);
    setIsNewChatOpen(false);
    setMobileView("chat");
  };

  // 1. Loading Splash State
  if (isAuthLoading) {
    return (
      <div className="relative w-screen h-[100dvh] bg-[#0A0F1D] flex flex-col items-center justify-center text-slate-100 select-none">
        <div className="pointer-events-none absolute w-[400px] h-[400px] rounded-full bg-[#1DB980]/15 blur-[120px] animate-pulse-glow" />
        <AuthLogo size={64} />
        <div className="mt-6 flex flex-col items-center gap-3 relative z-10">
          <div className="w-48 h-1 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#1DB980] via-[#0070F3] to-[#8E24AA]"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
            />
          </div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Connecting to Six9Chat Realtime Engine...
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State: Show Six9 Chat Auth Onboarding Screen
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-[100dvh] w-full bg-[#0A0F1D] text-slate-100 flex flex-col font-sans selection:bg-[#1DB980] selection:text-black overflow-x-hidden">
        {/* Dynamic Ambient Background Glow Elements */}
        <div className="pointer-events-none fixed -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#1DB980]/15 blur-[160px] animate-pulse-glow" />
        <div className="pointer-events-none fixed top-1/2 -right-40 w-[600px] h-[600px] rounded-full bg-[#0070F3]/20 blur-[170px]" />
        <div className="pointer-events-none fixed -bottom-40 left-1/3 w-[550px] h-[550px] rounded-full bg-[#8E24AA]/15 blur-[160px]" />

        {/* Six9 Chat Outer Header Bar */}
        <header className="relative z-30 w-full h-16 px-6 sm:px-10 border-b border-slate-800/80 bg-[#0B132B]/80 backdrop-blur-xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Logo size={32} showText={true} />
            <div className="hidden sm:block h-4 w-px bg-slate-800" />
            <span className="hidden sm:inline text-xs text-slate-400 font-medium">
              Six9 Chat Authentication Flow
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#1DB980] shadow-[0_0_8px_#1DB980]" />
              <span>Supabase Auth Ready</span>
            </div>

            <button
              type="button"
              onClick={() => setShowArchitectureModal(true)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition font-medium"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#1DB980]" />
              <span className="hidden sm:inline">Specs</span>
            </button>
          </div>
        </header>

        {/* Main Onboarding Dual-Column Section */}
        <main className="relative z-20 flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12">
          <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Six9 Chat Pairing Steps */}
            <div className="lg:col-span-5 space-y-6 text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300">
                <Smartphone className="w-3.5 h-3.5 text-[#1DB980]" />
                <span>Six9 Chat Signature Flow</span>
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Welcome to <span className="text-gradient-brand">Six9Chat</span>
                </h2>
                <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                  Log in with Phone OTP for instant SMS verification or use
                  Email & GitHub OAuth to connect your real-time workspace.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[#1DB980] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Enter Phone Number
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Select your country code and enter your mobile number.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 text-[#0070F3] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Confirm 6-Digit OTP PIN
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Dispatched directly via Supabase Auth SMS engine.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 text-[#8E24AA] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Enter Real-Time Dual-Pane Chat
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Live WebSocket broadcast on <code className="text-emerald-300">public:messages</code>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#1DB980]" />
                  End-to-End Encryption
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#0070F3]" />
                  PostgreSQL RLS
                </span>
              </div>
            </div>

            {/* Right Column: The Glassmorphic AuthCard */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <AuthCard />
            </div>
          </div>
        </main>

        {/* Profile Onboarding Modal */}
        <ProfileOnboardingModal
          isOpen={needsOnboarding}
          onComplete={() => setNeedsOnboarding(false)}
        />
      </div>
    );
  }

  // 3. Authenticated State: Six9 Chat Dual-Pane Layout
  const activeUser = profile || currentUser;

  return (
    <div className="relative w-screen h-[100dvh] bg-[#0A0F1D] text-slate-100 overflow-hidden flex flex-col font-sans selection:bg-[#1DB980] selection:text-black">
      {/* Dynamic Ambient Background Glow Elements */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#1DB980]/15 blur-[140px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-1/3 -right-32 w-[550px] h-[550px] rounded-full bg-[#0070F3]/20 blur-[150px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 w-[480px] h-[480px] rounded-full bg-[#8E24AA]/15 blur-[140px]" />

      {/* Six9 Chat Outer Header Bar */}
      <header className="hidden lg:flex items-center justify-between px-6 h-12 bg-[#0B132B]/90 border-b border-slate-800/80 z-30 shrink-0 text-xs">
        <div className="flex items-center gap-4">
          <Logo size={24} showText={true} />
          <div className="h-4 w-px bg-slate-800" />
          <span className="text-slate-400 font-medium">
            Six9 Chat Real-Time Architecture
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Supabase status badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80">
            <span
              className={`w-2 h-2 rounded-full ${
                supabaseStatus === "connected"
                  ? "bg-[#1DB980] shadow-[0_0_8px_#1DB980]"
                  : "bg-[#0070F3] animate-pulse"
              }`}
            />
            <span className="text-slate-300 font-medium">
              {supabaseStatus === "connected"
                ? "Supabase Live Channel: public:messages"
                : "Supabase Simulation Engine: Active"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowArchitectureModal(true)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#1DB980]" />
            <span>Architecture Specs</span>
          </button>

          {/* User Sign Out */}
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition font-medium ml-2"
            title="Sign Out of Six9Chat"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Dual-Pane Six9 Chat Workspace */}
      <main className="flex-1 flex overflow-hidden relative z-20 w-full h-full lg:p-2 lg:max-w-[1700px] lg:mx-auto">
        <div className="flex-1 flex w-full h-full lg:rounded-2xl lg:overflow-hidden lg:border lg:border-slate-800/80 lg:shadow-2xl bg-[#0F172A]">
          {/* Left Pane: Sidebar */}
          <div
            className={`w-full md:w-[380px] lg:w-[420px] h-full ${
              mobileView === "chat" ? "hidden md:flex" : "flex"
            }`}
          >
            <Sidebar
              currentUser={activeUser}
              contacts={contacts}
              activeContactId={activeContactId}
              onSelectContact={handleSelectContactMobile}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              stories={stories}
              onOpenStories={() => openStory(stories[0])}
              onOpenNewChat={() => setIsNewChatOpen(true)}
              supabaseStatus={supabaseStatus}
              channelConnected={channelConnected}
              onSignOut={signOut}
              onOpenProfile={() => setNeedsOnboarding(true)}
            />
          </div>

          {/* Right Pane: Chat Window */}
          <div
            className={`flex-1 h-full ${
              mobileView === "sidebar" ? "hidden md:flex" : "flex"
            }`}
          >
            <ChatWindow
              contact={activeContact}
              messages={activeMessages}
              isTyping={isTyping}
              onSendMessage={sendMessage}
              onReactToMessage={addReaction}
              onBackToSidebar={handleBackToSidebarMobile}
              onVoiceCall={() => startCall("audio")}
              onVideoCall={() => startCall("video")}
            />
          </div>
        </div>
      </main>

      {/* Audio / Video Call Modal */}
      <CallModal
        isOpen={callState.isOpen}
        type={callState.type}
        contact={callState.contact}
        onEndCall={endCall}
      />

      {/* Status Stories Progress Viewer */}
      <StoriesViewer
        stories={stories}
        activeStory={activeStory}
        onClose={closeStory}
      />

      {/* New Conversation Modal */}
      <NewChatModal
        isOpen={isNewChatOpen}
        contacts={allContacts}
        onClose={() => setIsNewChatOpen(false)}
        onSelectContact={(id) => {
          selectContact(id);
          setMobileView("chat");
        }}
        onAddNewContact={handleAddNewContact}
      />

      {/* Profile Onboarding Modal (Appears after sign up or when user edits profile) */}
      <ProfileOnboardingModal
        isOpen={needsOnboarding}
        onComplete={() => setNeedsOnboarding(false)}
      />

      {/* Architecture & Supabase Readiness Modal */}
      <AnimatePresence>
        {showArchitectureModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[85vh] text-left"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1DB980] to-[#0070F3] flex items-center justify-center">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Six9Chat Engineering Specifications
                    </h3>
                    <p className="text-xs text-slate-400">
                      Six9 Chat Dual-Pane Layout & Supabase Auth Engine
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowArchitectureModal(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 space-y-6 text-xs sm:text-sm text-slate-300">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <Zap className="w-5 h-5 text-[#1DB980] mb-2" />
                    <h4 className="font-bold text-white">Phone OTP & OAuth</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Supabase Auth GoTrue service with SMS PIN and GitHub SSO.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <Shield className="w-5 h-5 text-[#0070F3] mb-2" />
                    <h4 className="font-bold text-white">Row-Level Security</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      PostgreSQL authenticated policies protect private peer data.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <Sparkles className="w-5 h-5 text-[#8E24AA] mb-2" />
                    <h4 className="font-bold text-white">Framer Motion Tabs</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Spring-based switching between Phone OTP and Email credentials.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1DB980]" />
                    <span>Supabase SQL Schema (Auth Profiles & Messages)</span>
                  </h4>
                  <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`-- User profiles table definition
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  about TEXT,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Messages table definition
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  text TEXT,
  media_type TEXT DEFAULT 'text',
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS and Realtime
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;`}
                  </pre>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowArchitectureModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1DB980] to-[#0070F3] text-white text-xs font-bold hover:opacity-95 transition"
                >
                  Close & Return
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
