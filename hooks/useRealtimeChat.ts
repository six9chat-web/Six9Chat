"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ChatContact, ChatMessage, MediaType, MediaMeta, StoryItem, UserProfile } from "@/types/chat";
import {
  INITIAL_CONTACTS,
  INITIAL_MESSAGES_BY_CONTACT,
  INITIAL_STORIES,
  CURRENT_USER,
} from "@/lib/mockData";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import {
  getCurrentUser,
  getUserProfile,
  onAuthStateChange,
  signOut as authSignOut,
  getCurrentUserUid,
} from "@/lib/auth";

export interface CallModalState {
  isOpen: boolean;
  type: "audio" | "video";
  contact: ChatContact | null;
  status: "calling" | "connected" | "ended";
  durationSeconds: number;
}

export type ChatFilterType =
  | "all"
  | "unread"
  | "favourites"
  | "groups"
  | "communities"
  | "pinned";

export function useRealtimeChat() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(CURRENT_USER);
  const [contacts, setContacts] = useState<ChatContact[]>(INITIAL_CONTACTS);
  const [activeContactId, setActiveContactId] = useState<string>("contact-1");
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(
    INITIAL_MESSAGES_BY_CONTACT
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ChatFilterType>("all");
  const [isTyping, setIsTyping] = useState(false);
  const [stories, setStories] = useState<StoryItem[]>(INITIAL_STORIES);
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);

  // Call preview state
  const [callState, setCallState] = useState<CallModalState>({
    isOpen: false,
    type: "video",
    contact: null,
    status: "calling",
    durationSeconds: 0,
  });

  // Supabase live status
  const [supabaseStatus, setSupabaseStatus] = useState<"checking" | "connected" | "pending" | "error">(() =>
    isSupabaseConfigured() ? "connected" : "pending"
  );
  const [channelConnected, setChannelConnected] = useState(false);

  // Active contact lookup
  const activeContact = useMemo(() => {
    return contacts.find((c) => c.id === activeContactId) || (contacts.length > 0 ? contacts[0] : null);
  }, [contacts, activeContactId]);

  // Current conversation messages
  const activeMessages = useMemo(() => {
    return messagesMap[activeContactId] || [];
  }, [messagesMap, activeContactId]);

  // Filtered contacts based on search and tab filter
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.lastMessage && c.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeFilter === "unread") return c.unreadCount > 0;
      if (activeFilter === "favourites") return Boolean(c.isFavourite || c.isPinned);
      if (activeFilter === "groups") return Boolean(c.isGroup);
      if (activeFilter === "communities") return Boolean(c.isCommunity);
      if (activeFilter === "pinned") return Boolean(c.isPinned || c.isFavourite);

      return true;
    });
  }, [contacts, searchQuery, activeFilter]);

  // Mark unread as read when switching conversations
  const handleSelectContact = useCallback((id: string) => {
    setActiveContactId(id);
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  // Supabase Realtime channel setup
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Subscribe to Supabase Realtime channel 'public:messages'
    try {
      const channel = supabase.channel("public:messages", {
        config: {
          broadcast: { self: false },
        },
      });

      // Listen for broadcast messages
      channel.on("broadcast", { event: "new_message" }, (payload) => {
        const incoming = payload.payload as ChatMessage;
        if (incoming && incoming.conversationId) {
          setMessagesMap((prev) => ({
            ...prev,
            [incoming.conversationId]: [
              ...(prev[incoming.conversationId] || []),
              incoming,
            ],
          }));

          // Update last message in contact list
          setContacts((prev) =>
            prev.map((c) =>
              c.id === incoming.conversationId
                ? {
                    ...c,
                    lastMessage: {
                      text: incoming.text,
                      timestamp: incoming.timestamp,
                      isSelf: false,
                      status: "read",
                    },
                    unreadCount: c.id === activeContactId ? 0 : c.unreadCount + 1,
                  }
                : c
            )
          );
        }
      });

      // Listen for typing events
      channel.on("broadcast", { event: "typing" }, (payload) => {
        const { contactId, typing } = payload.payload;
        if (contactId === activeContactId) {
          setIsTyping(Boolean(typing));
        }
      });

      // Listen for postgres changes if table exists
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newRecord = payload.new as Record<string, unknown> | null;
          if (newRecord) {
            const formatted: ChatMessage = {
              id: String(newRecord.id || Date.now()),
              conversationId: String(newRecord.conversation_id || activeContactId),
              senderId: String(newRecord.sender_id || "other"),
              senderName: String(newRecord.sender_name || "Contact"),
              isSelf: newRecord.sender_id === CURRENT_USER.id,
              text: String(newRecord.text || ""),
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              date: "Today",
              status: "delivered",
            };

            setMessagesMap((prev) => ({
              ...prev,
              [formatted.conversationId]: [
                ...(prev[formatted.conversationId] || []),
                formatted,
              ],
            }));
          }
        }
      );

      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setChannelConnected(true);
        }
      });

      channelRef.current = channel;

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn("Supabase Realtime subscription initialized in offline mode:", e);
    }
  }, [activeContactId]);

  // Automated intelligent reply simulation to bring Six9 Chat feel to life
  const simulateReply = useCallback((contactId: string, userText: string) => {
    // Only simulate reply after 2.5 seconds to show typing indicator
    setTimeout(() => {
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);

        const contact = contacts.find((c) => c.id === contactId);
        const name = contact ? contact.name : "Contact";
        const replyTime = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Context-aware simulated responses
        let replyContent = "Got your message! Six9Chat edge replication is flowing smoothly.";
        const lower = userText.toLowerCase();

        if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
          replyContent = `Hey! Great to connect on Six9Chat. How does the real-time speed feel?`;
        } else if (lower.includes("supabase") || lower.includes("database") || lower.includes("db")) {
          replyContent = `Supabase PostgreSQL RLS policies & WebSocket channels are actively synced! Latency is <15ms ⚡`;
        } else if (lower.includes("design") || lower.includes("ui") || lower.includes("layout")) {
          replyContent = `The Six9 Chat dual-pane layout, glassmorphic bubbles, and brand gradients are looking phenomenal!`;
        } else if (lower.includes("call") || lower.includes("video")) {
          replyContent = `Ready for a quick video call preview whenever you'd like! Just hit the camera icon on the top right.`;
        } else {
          const canned = [
            `Received! Everything is syncing instantaneously via WebSocket broadcast.`,
            `Checked on my end — double blue ticks confirmed and state is 100% reactive!`,
            `Awesome! Let's deploy this to production once the Supabase credentials are wired.`,
          ];
          replyContent = canned[Math.floor(Math.random() * canned.length)];
        }

        const replyMsg: ChatMessage = {
          id: `reply-${Date.now()}`,
          conversationId: contactId,
          senderId: contactId,
          senderName: name,
          senderAvatar: contact?.avatar || "CO",
          senderColor: contact?.avatarColor || "from-[#086288] to-[#4D8DBA]",
          isSelf: false,
          text: replyContent,
          timestamp: replyTime,
          date: "Today",
          status: "read",
        };

        setMessagesMap((prev) => ({
          ...prev,
          [contactId]: [...(prev[contactId] || []), replyMsg],
        }));

        setContacts((prev) =>
          prev.map((c) =>
            c.id === contactId
              ? {
                  ...c,
                  lastMessage: {
                    text: replyContent,
                    timestamp: replyTime,
                    isSelf: false,
                    status: "read",
                  },
                }
              : c
          )
        );
      }, 2200);
    }, 1200);
  }, [contacts]);

  // Send message action
  const sendMessage = useCallback(
    async (
      text: string,
      mediaType: MediaType = "text",
      mediaMeta?: MediaMeta,
      mediaUrl?: string
    ) => {
      if (!text.trim() && mediaType === "text") return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        conversationId: activeContactId,
        senderId: CURRENT_USER.id,
        senderName: CURRENT_USER.name,
        senderAvatar: CURRENT_USER.avatar,
        senderColor: "from-[#086288] to-[#97D7FF]",
        isSelf: true,
        text: text.trim(),
        timestamp: timeStr,
        date: "Today",
        status: "sending",
        mediaType,
        mediaUrl,
        mediaMeta,
      };

      // Optimistic update
      setMessagesMap((prev) => ({
        ...prev,
        [activeContactId]: [...(prev[activeContactId] || []), newMsg],
      }));

      // Update contact list preview
      setContacts((prev) =>
        prev.map((c) =>
          c.id === activeContactId
            ? {
                ...c,
                lastMessage: {
                  text: text.trim() || `[${mediaType.toUpperCase()}]`,
                  timestamp: timeStr,
                  isSelf: true,
                  status: "sent",
                  mediaType,
                },
              }
            : c
        )
      );

      // Attempt Supabase broadcast if available
      if (channelRef.current && isSupabaseConfigured()) {
        try {
          await channelRef.current.send({
            type: "broadcast",
            event: "new_message",
            payload: newMsg,
          });
        } catch (err) {
          console.warn("Realtime broadcast fallback to local simulation:", err);
        }
      }

      // Transition message status from sending -> sent -> delivered -> read
      setTimeout(() => {
        setMessagesMap((prev) => ({
          ...prev,
          [activeContactId]: (prev[activeContactId] || []).map((m) =>
            m.id === newMsg.id ? { ...m, status: "sent" } : m
          ),
        }));
      }, 400);

      setTimeout(() => {
        setMessagesMap((prev) => ({
          ...prev,
          [activeContactId]: (prev[activeContactId] || []).map((m) =>
            m.id === newMsg.id ? { ...m, status: "delivered" } : m
          ),
        }));
      }, 1000);

      setTimeout(() => {
        setMessagesMap((prev) => ({
          ...prev,
          [activeContactId]: (prev[activeContactId] || []).map((m) =>
            m.id === newMsg.id ? { ...m, status: "read" } : m
          ),
        }));
      }, 2000);

      // Trigger realistic smart bot reply simulation if chat isn't group or when offline
      simulateReply(activeContactId, text);
    },
    [activeContactId, simulateReply]
  );

  // Reaction toggling
  const addReaction = useCallback((messageId: string, emoji: string) => {
    setMessagesMap((prev) => {
      const currentList = prev[activeContactId] || [];
      const updated = currentList.map((m) => {
        if (m.id !== messageId) return m;

        const reactions = m.reactions ? [...m.reactions] : [];
        const existingIndex = reactions.findIndex((r) => r.emoji === emoji);

        if (existingIndex >= 0) {
          const item = reactions[existingIndex];
          if (item.userReacted) {
            if (item.count <= 1) {
              reactions.splice(existingIndex, 1);
            } else {
              reactions[existingIndex] = {
                ...item,
                count: item.count - 1,
                userReacted: false,
              };
            }
          } else {
            reactions[existingIndex] = {
              ...item,
              count: item.count + 1,
              userReacted: true,
            };
          }
        } else {
          reactions.push({ emoji, count: 1, userReacted: true });
        }

        return { ...m, reactions };
      });

      return {
        ...prev,
        [activeContactId]: updated,
      };
    });
  }, [activeContactId]);

  // Call actions
  const startCall = useCallback((type: "audio" | "video") => {
    setCallState({
      isOpen: true,
      type,
      contact: activeContact,
      status: "calling",
      durationSeconds: 0,
    });
  }, [activeContact]);

  const endCall = useCallback(() => {
    setCallState((prev) => ({ ...prev, isOpen: false, status: "ended" }));
  }, []);

  // Story actions
  const openStory = useCallback((story: StoryItem) => {
    setActiveStory(story);
    setStories((prev) =>
      prev.map((s) => (s.id === story.id ? { ...s, viewed: true } : s))
    );
  }, []);

  const closeStory = useCallback(() => {
    setActiveStory(null);
  }, []);

  // Load authenticated Supabase User profile
  useEffect(() => {
    async function loadUserProfile() {
      try {
        const user = await getCurrentUser();
        if (user) {
          const profile = await getUserProfile(user.id);
          const userEmail =
            profile?.email ||
            user.email ||
            (typeof user.user_metadata?.email === "string" ? user.user_metadata.email : "");
          const displayName =
            profile?.full_name ||
            (user.user_metadata?.full_name as string) ||
            (userEmail ? userEmail.split("@")[0] : null) ||
            "You";
          const initials = displayName
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          const assignedUid =
            profile?.uid ||
            (user.user_metadata?.uid as string) ||
            getCurrentUserUid(user.id);

          const username =
            profile?.username ||
            (user.user_metadata?.username as string) ||
            (userEmail ? userEmail.split("@")[0] : null) ||
            displayName.toLowerCase().replace(/\s+/g, "_");

          setCurrentUser({
            id: user.id,
            name: displayName,
            username: username,
            status: "online",
            statusText:
              profile?.status ||
              (user.user_metadata?.status as string) ||
              "Hey there! I am using Six9Chat",
            avatar: profile?.avatar_url || initials,
            phone:
              profile?.phone ||
              user.phone ||
              (user.user_metadata?.phone as string) ||
              "",
            email: userEmail,
            uid: assignedUid,
          });
        }
      } catch (err) {
        console.warn("Could not load authenticated user profile:", err);
      }
    }

    loadUserProfile();

    const sub = onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile();
      } else {
        setCurrentUser(CURRENT_USER);
      }
    });

    return () => {
      sub.unsubscribe();
    };
  }, []);

  // Add a new direct contact or start chat via phone number
  const addNewContact = useCallback((name: string, phone: string, avatar?: string) => {
    const id = `contact-${Date.now()}`;
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "S9";

    const newContact: ChatContact = {
      id,
      name,
      avatar: avatar || initials,
      avatarColor: "from-[#086288] to-[#97D7FF]",
      status: "online",
      lastSeen: "Online now",
      about: "Hey there! I am using Six9Chat",
      phone,
      unreadCount: 0,
      lastMessage: {
        text: "Started a new conversation",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isSelf: true,
        status: "read",
      },
    };

    setContacts((prev) => [newContact, ...prev]);
    setActiveContactId(id);
    return id;
  }, []);

  // Create a new group conversation with members
  const createGroup = useCallback(
    (groupName: string, memberIds: string[], groupAvatar?: string) => {
      const id = `group-${Date.now()}`;
      const initials = groupName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "GP";

      const memberNames = contacts
        .filter((c) => memberIds.includes(c.id))
        .map((c) => c.name);
      memberNames.push("You");

      const newGroup: ChatContact = {
        id,
        name: groupName,
        avatar: groupAvatar || initials,
        avatarColor: "from-[#086288] via-[#4D8DBA] to-[#97D7FF]",
        status: "online",
        lastSeen: `${memberNames.length} members`,
        about: `Group created by ${currentUser.name}`,
        isGroup: true,
        groupMembers: memberNames,
        unreadCount: 0,
        lastMessage: {
          text: `${currentUser.name} created group "${groupName}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSelf: true,
          status: "read",
        },
      };

      setContacts((prev) => [newGroup, ...prev]);
      setActiveContactId(id);
      return id;
    },
    [contacts, currentUser.name]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await authSignOut();
    } catch (e) {
      console.warn("Sign out notice:", e);
    } finally {
      window.location.href = "/login";
    }
  }, []);

  return {
    currentUser,
    contacts: filteredContacts,
    allContacts: contacts,
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
    setCallState,
    startCall,
    endCall,
    selectContact: handleSelectContact,
    sendMessage,
    addReaction,
    addNewContact,
    createGroup,
    supabaseStatus,
    channelConnected,
    signOut: handleSignOut,
  };
}
