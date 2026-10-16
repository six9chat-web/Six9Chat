"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ChatContact,
  ChatMessage,
  MediaType,
  MediaMeta,
  StoryItem,
  UserProfile,
  ChatRequest,
} from "@/types/chat";
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

const INITIAL_CHAT_REQUESTS: ChatRequest[] = [];

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
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>(INITIAL_CHAT_REQUESTS);

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

      // Listen for incoming real-time chat requests via broadcast
      channel.on("broadcast", { event: "chat_request" }, (payload) => {
        const incomingReq = payload.payload as ChatRequest;
        if (incomingReq && incomingReq.receiverId === currentUser.id) {
          setChatRequests((prev) => [
            incomingReq,
            ...prev.filter((r) => r.id !== incomingReq.id),
          ]);
        }
      });

      // Listen for accepted/rejected status responses
      channel.on("broadcast", { event: "chat_request_response" }, (payload) => {
        const { requestId } = payload.payload as { requestId: string };
        if (requestId) {
          setChatRequests((prev) => prev.filter((r) => r.id !== requestId));
        }
      });

      // Listen for newly created groups
      channel.on("broadcast", { event: "new_group" }, (payload) => {
        const incomingGroup = payload.payload as ChatContact;
        if (incomingGroup && incomingGroup.id) {
          setContacts((prev) => [
            incomingGroup,
            ...prev.filter((c) => c.id !== incomingGroup.id),
          ]);
        }
      });

      // Listen for postgres changes on messages
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

      // Listen for postgres changes on chat_requests
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_requests" },
        async (payload) => {
          const newReq = payload.new as Record<string, unknown> | null;
          if (
            newReq &&
            newReq.receiver_id === currentUser.id &&
            newReq.status === "pending"
          ) {
            let senderName = "Six9 User";
            let senderUsername = "";
            let senderAvatar = "";

            try {
              const { data: sp } = await supabase
                .from("profiles")
                .select("full_name, username, avatar_url")
                .eq("id", String(newReq.sender_id))
                .maybeSingle();

              if (sp) {
                senderName = sp.full_name || sp.username || "Six9 User";
                senderUsername = sp.username || "";
                senderAvatar = sp.avatar_url || "";
              }
            } catch (err) {
              console.warn("Could not fetch sender profile for request:", err);
            }

            const formattedReq: ChatRequest = {
              id: String(newReq.id),
              senderId: String(newReq.sender_id),
              senderName,
              senderUsername,
              senderAvatar,
              receiverId: String(newReq.receiver_id),
              status: "pending",
              message: String(newReq.message || "wants to start a conversation with you"),
              createdAt: "Just now",
            };
            setChatRequests((prev) => [
              formattedReq,
              ...prev.filter((r) => r.id !== formattedReq.id),
            ]);
          }
        }
      );

      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_requests" },
        (payload) => {
          const updated = payload.new as Record<string, unknown> | null;
          if (updated) {
            setChatRequests((prev) => prev.filter((r) => r.id !== String(updated.id)));
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
            avatar: profile?.avatar_url || "",
            phone:
              profile?.phone ||
              user.phone ||
              (user.user_metadata?.phone as string) ||
              "",
            email: userEmail,
            uid: assignedUid,
          });

          // Fetch pending chat requests from Supabase
          try {
            const { data: dbRequests } = await supabase
              .from("chat_requests")
              .select("id, sender_id, receiver_id, status, message, created_at")
              .eq("receiver_id", user.id)
              .eq("status", "pending")
              .order("created_at", { ascending: false });

            if (dbRequests && dbRequests.length > 0) {
              const senderIds = Array.from(new Set(dbRequests.map((r) => r.sender_id)));
              const { data: senderProfiles } = await supabase
                .from("profiles")
                .select("id, full_name, username, avatar_url")
                .in("id", senderIds);

              const profileMap = new Map<string, { full_name?: string; username?: string; avatar_url?: string }>();
              senderProfiles?.forEach((p) => profileMap.set(p.id, p));

              const mapped: ChatRequest[] = dbRequests.map((r) => {
                const sp = profileMap.get(r.sender_id);
                return {
                  id: r.id,
                  senderId: r.sender_id,
                  senderName: sp?.full_name || sp?.username || "Six9 User",
                  senderUsername: sp?.username || "",
                  senderAvatar: sp?.avatar_url || "",
                  receiverId: r.receiver_id,
                  status: r.status as "pending",
                  message: r.message || "wants to start a conversation with you",
                  createdAt: new Date(r.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                };
              });
              setChatRequests(mapped);
            } else {
              setChatRequests([]);
            }
          } catch (e) {
            console.warn("Could not load chat requests from database:", e);
          }
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

  // Accept a pending chat request
  const acceptChatRequest = useCallback(async (req: ChatRequest) => {
    // 1. Update status in Supabase if configured
    try {
      await supabase
        .from("chat_requests")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", req.id);
    } catch (err) {
      console.warn("Could not sync chat_request accept to Supabase:", err);
    }

    // 2. Broadcast response via Realtime channel
    try {
      channelRef.current?.send({
        type: "broadcast",
        event: "chat_request_response",
        payload: { requestId: req.id, status: "accepted" },
      });
    } catch {}

    // 3. Remove from pending requests
    setChatRequests((prev) => prev.filter((r) => r.id !== req.id));

    // 4. Automatically add requester to user's contacts and open chat
    const displayName = req.senderUsername
      ? `@${req.senderUsername.replace(/^@/, "")}`
      : req.senderName || "Contact";

    const newContact: ChatContact = {
      id: req.senderId,
      name: displayName,
      avatar: req.senderAvatar || "",
      avatarColor: "from-[#086288] to-[#4D8DBA]",
      status: "online",
      lastSeen: "Online now",
      about: "Connected via Six9Chat request",
      phone: "",
      unreadCount: 0,
      lastMessage: {
        text: "Chat request accepted. Say hi! 👋",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isSelf: false,
        status: "read",
      },
    };

    setContacts((prev) => [
      newContact,
      ...prev.filter((c) => c.id !== req.senderId),
    ]);
    setActiveContactId(newContact.id);
  }, []);

  // Reject a pending chat request
  const rejectChatRequest = useCallback(async (requestId: string) => {
    // 1. Update status in Supabase if configured
    try {
      await supabase
        .from("chat_requests")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", requestId);
    } catch (err) {
      console.warn("Could not sync chat_request reject to Supabase:", err);
    }

    // 2. Broadcast response via Realtime channel
    try {
      channelRef.current?.send({
        type: "broadcast",
        event: "chat_request_response",
        payload: { requestId, status: "rejected" },
      });
    } catch {}

    // 3. Remove from pending requests
    setChatRequests((prev) => prev.filter((r) => r.id !== requestId));
  }, []);

  // Add a new direct contact or start chat via phone number
  const addNewContact = useCallback((name: string, phone: string, avatar?: string) => {
    const id = `contact-${Date.now()}`;

    const newContact: ChatContact = {
      id,
      name,
      avatar: avatar || "",
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

  // Create a new group conversation with members and persist to Supabase
  const createGroup = useCallback(
    (groupName: string, memberIds: string[], groupAvatar?: string): string => {
      const id = `group-${Date.now()}`;

      const memberNames = contacts
        .filter((c) => memberIds.includes(c.id))
        .map((c) => c.name);
      memberNames.push("You");

      const newGroup: ChatContact = {
        id,
        name: groupName,
        avatar: groupAvatar || "",
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

      // Persist to Supabase groups table in background
      fetch("/api/user/create-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: groupName,
          memberIds: [...memberIds, currentUser.id],
          avatarUrl: groupAvatar || "",
          createdBy: currentUser.id,
        }),
      }).catch((e) => console.warn("Group persist note:", e));

      // Broadcast to other clients
      try {
        channelRef.current?.send({
          type: "broadcast",
          event: "new_group",
          payload: newGroup,
        });
      } catch {}

      return id;
    },
    [contacts, currentUser.name, currentUser.id]
  );

  // Send a real-time pending chat request to another user
  const sendChatRequest = useCallback(
    async (targetUserId: string, targetName?: string, targetUsername?: string, targetAvatar?: string) => {
      try {
        await fetch("/api/user/send-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: currentUser.id,
            receiverId: targetUserId,
            message: `${currentUser.name} wants to start a conversation with you`,
          }),
        });

        channelRef.current?.send({
          type: "broadcast",
          event: "chat_request",
          payload: {
            id: `req-${Date.now()}`,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderUsername: currentUser.username,
            senderAvatar: currentUser.avatar,
            receiverId: targetUserId,
            status: "pending",
            message: `${currentUser.name} wants to start a conversation with you`,
            createdAt: "Just now",
          },
        });
      } catch (e) {
        console.warn("Send request error:", e);
      }
    },
    [currentUser]
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
    chatRequests,
    acceptChatRequest,
    rejectChatRequest,
    sendChatRequest,
    signOut: handleSignOut,
  };
}
