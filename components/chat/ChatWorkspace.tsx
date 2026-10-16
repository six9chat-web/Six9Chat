"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { CallModal } from "@/components/chat/CallModal";
import { StoriesViewer } from "@/components/chat/StoriesViewer";
import { NewChatModal } from "@/components/chat/NewChatModal";
import { NewGroupModal } from "@/components/chat/NewGroupModal";
import { CommunityModal } from "@/components/chat/CommunityModal";
import { ProfileModal } from "@/components/chat/ProfileModal";
import { ProfileOnboardingModal } from "@/components/auth/ProfileOnboardingModal";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { Six9BrandLogo } from "@/components/ui/Six9BrandLogo";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { useAuth } from "@/lib/auth";

export function ChatWorkspace() {
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    profile,
    needsOnboarding,
    setNeedsOnboarding,
    signOut,
    saveUserProfile,
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
    chatRequests,
    acceptChatRequest,
    rejectChatRequest,
    sendChatRequest,
  } = useRealtimeChat();

  // Mobile viewport navigation state: 'sidebar' | 'chat'
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTarget, setProfileModalTarget] = useState<"self" | "contact">("self");

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Prevent any document scrolling and reset scroll offsets
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const handleSelectContactMobile = (id: string) => {
    selectContact(id);
    setMobileView("chat");
  };

  const handleBackToSidebarMobile = () => {
    setMobileView("sidebar");
  };

  const handleAddNewContact = (
    name: string,
    phone: string,
    avatar?: string,
    targetUserId?: string
  ) => {
    const newId = addNewContact(name, phone, avatar, targetUserId);
    selectContact(newId);
    setIsNewChatOpen(false);
    setMobileView("chat");
  };

  const handleCreateNewGroup = (
    name: string,
    memberIds: string[],
    avatarUrl?: string
  ) => {
    const newId = createGroup(name, memberIds, avatarUrl);
    selectContact(newId);
    setIsNewGroupOpen(false);
    setMobileView("chat");
  };

  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-full h-full bg-[#053b53] flex flex-col items-center justify-center text-slate-100 z-50">
        <div className="flex flex-col items-center gap-4">
          <AuthLogo size={56} />
          <div className="w-10 h-10 rounded-full border-3 border-[#97D7FF] border-t-transparent animate-spin mt-2" />
          <p className="text-xs text-[#97D7FF]/80 font-medium tracking-wide">
            Connecting to Six9Chat Realtime Engine...
          </p>
        </div>
      </div>
    );
  }

  const activeUser = profile || currentUser;

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-full h-full bg-[#053b53] text-slate-100 overflow-hidden font-sans selection:bg-[#97D7FF] selection:text-[#086288] m-0 p-0 z-0">
      {/* Dynamic Ambient Background Glow Elements */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#086288]/40 blur-[140px] animate-pulse-glow" />
      <div className="pointer-events-none absolute top-1/3 -right-32 w-[550px] h-[550px] rounded-full bg-[#4D8DBA]/25 blur-[150px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 w-[480px] h-[480px] rounded-full bg-[#97D7FF]/15 blur-[140px]" />

      {/* Main Responsive WhatsApp Web Layout (100% width x 100% height) */}
      <div className="flex flex-row w-full h-full min-h-0 overflow-hidden relative z-10">
        {/* Main Chats Sidebar Pane: Full screen on mobile when mobileView === 'sidebar', 380-450px on desktop */}
        <div
          className={`h-full min-h-0 shrink-0 border-r border-[#4D8DBA]/35 transition-all duration-200 ${
            mobileView === "chat"
              ? "hidden md:flex md:w-[380px] lg:w-[420px] xl:w-[450px]"
              : "w-full md:w-[380px] lg:w-[420px] xl:w-[450px] flex flex-col"
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
            onAddNewContact={handleAddNewContact}
            onOpenNewGroup={() => setIsNewGroupOpen(true)}
            onOpenCommunity={() => setIsCommunityOpen(true)}
            supabaseStatus={supabaseStatus}
            channelConnected={channelConnected}
            onSignOut={signOut}
            onOpenProfile={() => {
              setProfileModalTarget("self");
              setIsProfileModalOpen(true);
            }}
            onOpenSettings={() => {
              setProfileModalTarget("self");
              setIsProfileModalOpen(true);
            }}
            chatRequests={chatRequests}
            onAcceptChatRequest={acceptChatRequest}
            onRejectChatRequest={rejectChatRequest}
          />
        </div>

        {/* Right Pane: WhatsApp Conversation Window: Full screen on mobile when mobileView === 'chat', flex-1 on desktop */}
        <div
          className={`flex-1 min-w-0 min-h-0 h-full bg-[#053b53] transition-all duration-200 ${
            mobileView === "sidebar"
              ? "hidden md:flex md:flex-col"
              : "w-full flex flex-col"
          }`}
        >
          {activeContact ? (
            <ChatWindow
              contact={activeContact}
              messages={activeMessages}
              isTyping={isTyping}
              onSendMessage={sendMessage}
              onReactToMessage={addReaction}
              onBackToSidebar={handleBackToSidebarMobile}
              onVoiceCall={() => startCall("audio")}
              onVideoCall={() => startCall("video")}
              onOpenContactInfo={() => {
                setProfileModalTarget("contact");
                setIsProfileModalOpen(true);
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none bg-gradient-to-b from-[#053b53] to-[#032433]">
              <div className="relative mb-6 flex flex-col items-center">
                <Six9BrandLogo size={96} glow />
              </div>

              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
                Six9Chat Real-Time Network
              </h2>

              <p className="max-w-md text-xs sm:text-sm text-slate-300 leading-relaxed">
                Connect and exchange encrypted real-time messages. Search for friends by username to start messaging.
              </p>
            </div>
          )}
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
        currentUserId={activeUser?.id}
        onClose={() => setIsNewChatOpen(false)}
        onSelectContact={(id) => {
          selectContact(id);
          setMobileView("chat");
        }}
        onCreateGroup={handleCreateNewGroup}
        onSendRequest={sendChatRequest}
      />

      {/* New Group Modal */}
      <NewGroupModal
        isOpen={isNewGroupOpen}
        contacts={allContacts}
        onClose={() => setIsNewGroupOpen(false)}
        onCreateGroup={handleCreateNewGroup}
      />

      {/* Community & Broadcast Channels Modal */}
      <CommunityModal
        isOpen={isCommunityOpen}
        onClose={() => setIsCommunityOpen(false)}
        onCreateCommunity={() => setIsCommunityOpen(false)}
      />

      {/* User Profile & Contact Information Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        currentUser={profileModalTarget === "self" || !activeContact ? activeUser : activeContact}
        isOwnProfile={profileModalTarget === "self"}
        onClose={() => setIsProfileModalOpen(false)}
        onSignOut={signOut}
        onUpdateProfile={async ({ name, avatar, statusText }) => {
          await saveUserProfile({
            name,
            avatar,
            statusText,
            phone: activeUser.phone,
          });
        }}
        onVoiceCall={() => startCall("audio")}
        onVideoCall={() => startCall("video")}
      />

      {/* Profile Onboarding Modal for First Time Signups */}
      {needsOnboarding && (
        <ProfileOnboardingModal
          isOpen={needsOnboarding}
          onComplete={() => setNeedsOnboarding(false)}
        />
      )}
    </div>
  );
}
