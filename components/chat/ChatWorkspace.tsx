"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { CallModal } from "@/components/chat/CallModal";
import { StoriesViewer } from "@/components/chat/StoriesViewer";
import { NewChatModal } from "@/components/chat/NewChatModal";
import { NewGroupModal } from "@/components/chat/NewGroupModal";
import { ProfileModal } from "@/components/chat/ProfileModal";
import { ProfileOnboardingModal } from "@/components/auth/ProfileOnboardingModal";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { useAuth } from "@/lib/auth";

export function ChatWorkspace() {
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
    addNewContact,
    createGroup,
    supabaseStatus,
    channelConnected,
  } = useRealtimeChat();

  // Mobile viewport navigation state: 'sidebar' | 'chat'
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleSelectContactMobile = (id: string) => {
    selectContact(id);
    setMobileView("chat");
  };

  const handleBackToSidebarMobile = () => {
    setMobileView("sidebar");
  };

  const handleAddNewContact = (name: string, phone: string) => {
    const newId = addNewContact(name, phone);
    selectContact(newId);
    setIsNewChatOpen(false);
    setMobileView("chat");
  };

  const handleCreateNewGroup = (
    name: string,
    memberIds: string[],
    avatarUrl?: string
  ) => {
    const newGroupId = createGroup(name, memberIds, avatarUrl);
    selectContact(newGroupId);
    setIsNewGroupOpen(false);
    setMobileView("chat");
  };

  // Loading Splash State
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

  const activeUser = profile || currentUser;

  return (
    <div className="relative w-screen h-[100dvh] bg-[#0A0F1D] text-slate-100 overflow-hidden flex flex-row font-sans selection:bg-[#1DB980] selection:text-black">
      {/* Dynamic Ambient Background Glow Elements */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#1DB980]/15 blur-[140px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-1/3 -right-32 w-[550px] h-[550px] rounded-full bg-[#0070F3]/20 blur-[150px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 w-[480px] h-[480px] rounded-full bg-[#8E24AA]/15 blur-[140px]" />

      {/* Main Full-Screen WhatsApp Dual-Pane Layout (100vw x 100vh) */}
      <div className="flex w-full h-full overflow-hidden relative z-20">
        {/* Left Pane: WhatsApp Sidebar */}
        <div
          className={`h-full shrink-0 border-r border-slate-800/80 transition-all duration-200 ${
            mobileView === "chat"
              ? "hidden md:flex md:w-[380px] lg:w-[420px] xl:w-[450px]"
              : "w-full md:w-[380px] lg:w-[420px] xl:w-[450px] flex"
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
            onOpenNewGroup={() => setIsNewGroupOpen(true)}
            supabaseStatus={supabaseStatus}
            channelConnected={channelConnected}
            onSignOut={signOut}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenSettings={() => setIsProfileModalOpen(true)}
          />
        </div>

        {/* Right Pane: WhatsApp Conversation Window */}
        <div
          className={`flex-1 h-full bg-[#0F172A] transition-all duration-200 ${
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
        onOpenNewGroup={() => {
          setIsNewChatOpen(false);
          setIsNewGroupOpen(true);
        }}
      />

      {/* New Group Modal */}
      <NewGroupModal
        isOpen={isNewGroupOpen}
        contacts={allContacts}
        onClose={() => setIsNewGroupOpen(false)}
        onCreateGroup={handleCreateNewGroup}
      />

      {/* Profile & Account Drawer Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={activeUser}
        onSignOut={signOut}
      />

      {/* Profile Onboarding Modal */}
      <ProfileOnboardingModal
        isOpen={needsOnboarding}
        onComplete={() => setNeedsOnboarding(false)}
      />
    </div>
  );
}
