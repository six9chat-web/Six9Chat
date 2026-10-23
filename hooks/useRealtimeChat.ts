"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChatContact,
  ChatMessage,
  MediaType,
  MediaMeta,
  StoryItem,
  UserProfile,
  ChatRequest,
  MessageReaction,
  MessageStatus,
  generateUUID,
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
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile>(CURRENT_USER);
  const [contacts, setContacts] = useState<ChatContact[]>(INITIAL_CONTACTS);
  const [activeContactId, setActiveContactId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const urlId = new URLSearchParams(window.location.search).get("c");
        if (urlId) return urlId;
        const saved = localStorage.getItem("six9chat_active_chat");
        if (saved) return saved;
      } catch {}
    }
    return "";
  });
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(
    INITIAL_MESSAGES_BY_CONTACT
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ChatFilterType>("all");
  const [isTyping, setIsTyping] = useState(false);
  const [stories, setStories] = useState<StoryItem[]>(INITIAL_STORIES);
  const [activeStory, setActiveStory] = useState<StoryItem | null>(null);
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>(INITIAL_CHAT_REQUESTS);
  const currentUserRef = useRef<UserProfile>(currentUser);
  const activeContactIdRef = useRef<string>(activeContactId);

  // Clear any legacy local storage contacts caches to ensure strictly genuine DB state
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith("six9_saved_contacts_") || k.startsWith("six9_contacts_"))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {}
    }
  }, []);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    activeContactIdRef.current = activeContactId;
  }, [activeContactId]);

  // Call preview state
  const [callState, setCallState] = useState<CallModalState>({
    isOpen: false,
    type: "video",
    contact: null,
    status: "calling",
    durationSeconds: 0,
  });

  // Supabase live status
  const [supabaseStatus, _setSupabaseStatus] = useState<"checking" | "connected" | "pending" | "error">(() =>
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
    if (currentUser?.id && id) {
      Promise.resolve(
        supabase
          .from("messages")
          .update({ is_read: true, status: "read" })
          .eq("receiver_id", currentUser.id)
          .eq("is_read", false)
          .or(`sender_id.eq.${id},conversation_id.eq.${id}`)
      ).catch(() => {});
    }
  }, [currentUser?.id]);

  // Persist active chat session across page refreshes via URL and LocalStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (activeContactId) {
        localStorage.setItem("six9chat_active_chat", activeContactId);
        const url = new URL(window.location.href);
        if (url.searchParams.get("c") !== activeContactId) {
          url.searchParams.set("c", activeContactId);
          window.history.replaceState({}, "", url.toString());
        }
      } else {
        localStorage.removeItem("six9chat_active_chat");
        const url = new URL(window.location.href);
        if (url.searchParams.has("c")) {
          url.searchParams.delete("c");
          window.history.replaceState({}, "", url.toString());
        }
      }
    } catch {}
  }, [activeContactId]);

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

      // 1. Listen for incoming direct broadcast messages (0ms ultra-low latency)
      channel.on(
        "broadcast",
        { event: "new_message" },
        (payload: { payload: ChatMessage & { receiverId?: string } }) => {
          const incoming = payload.payload;
          const activeId = currentUserRef.current.id;
          if (!incoming || incoming.senderId === activeId) return;

          const isGroup = incoming.conversationId?.startsWith("group-");
          const conversationKey = isGroup ? incoming.conversationId : incoming.senderId;

          // Only accept if it's for this group, or sent to currentUser
          if (isGroup || incoming.receiverId === activeId || !incoming.receiverId) {
            const formatted: ChatMessage = {
              ...incoming,
              conversationId: conversationKey,
              isSelf: false,
              status: "delivered",
            };

            setMessagesMap((prev) => ({
              ...prev,
              [conversationKey]: [
                ...(prev[conversationKey] || []).filter((m) => m.id !== formatted.id),
                formatted,
              ],
            }));

            // Update contact list preview and unread count
            const currentActiveContactId = activeContactIdRef.current;
            const isViewingThisConversation = conversationKey === currentActiveContactId;

            setContacts((prev) => {
              const exists = prev.some((c) => c.id === conversationKey);
              if (exists) {
                return prev.map((c) =>
                  c.id === conversationKey
                    ? {
                        ...c,
                        unreadCount: isViewingThisConversation ? 0 : c.unreadCount + 1,
                        lastMessage: {
                          text:
                            formatted.text ||
                            `[${(formatted.mediaType || "media").toUpperCase()}]`,
                          timestamp: formatted.timestamp,
                          isSelf: false,
                          status: isViewingThisConversation ? "read" : "delivered",
                          mediaType: formatted.mediaType,
                        },
                      }
                    : c
                );
              } else {
                const newC: ChatContact = {
                  id: conversationKey,
                  name: formatted.senderName || "New Contact",
                  avatar: formatted.senderAvatar || "",
                  status: "online",
                  lastSeen: "Online now",
                  unreadCount: isViewingThisConversation ? 0 : 1,
                  lastMessage: {
                    text: formatted.text || "[Media]",
                    timestamp: formatted.timestamp,
                    isSelf: false,
                    status: isViewingThisConversation ? "read" : "delivered",
                    mediaType: formatted.mediaType,
                  },
                };
                return [newC, ...prev];
              }
            });

            if (isViewingThisConversation && activeId && formatted.id) {
              Promise.resolve(
                supabase
                  .from("messages")
                  .update({ is_read: true, status: "read" })
                  .eq("id", formatted.id)
              ).catch(() => {});
            }
          }
        }
      );

      // 2. Listen for message reactions broadcast
      channel.on(
        "broadcast",
        { event: "message_reaction" },
        (payload: {
          payload: {
            messageId: string;
            emoji: string;
            userId: string;
            conversationId: string;
          };
        }) => {
          const { messageId, emoji, userId, conversationId } = payload.payload;
          if (messageId && conversationId) {
            const activeId = currentUserRef.current.id;
            setMessagesMap((prev) => {
              const list = prev[conversationId] || [];
              const updated = list.map((m) => {
                if (m.id !== messageId) return m;

                const reactions = m.reactions ? [...m.reactions] : [];
                const idx = reactions.findIndex((r) => r.emoji === emoji);
                const isSelf = userId === activeId;

                if (idx >= 0) {
                  const item = reactions[idx];
                  reactions[idx] = {
                    ...item,
                    count: item.count + 1,
                    userReacted: isSelf ? true : item.userReacted,
                  };
                } else {
                  reactions.push({ emoji, count: 1, userReacted: isSelf });
                }

                return { ...m, reactions };
              });

              return { ...prev, [conversationId]: updated };
            });
          }
        }
      );

      // 3. Listen for typing events
      channel.on(
        "broadcast",
        { event: "typing" },
        (payload: { payload: { contactId: string; typing: boolean } }) => {
          const { contactId, typing } = payload.payload;
          if (contactId === activeContactIdRef.current) {
            setIsTyping(Boolean(typing));
          }
        }
      );

      // 4. Listen for real-time broadcast chat requests (instant Bell notification)
      channel.on(
        "broadcast",
        { event: "chat_request" },
        (payload: { payload: ChatRequest }) => {
          const incomingReq = payload.payload;
          const activeId = currentUserRef.current.id;
          if (
            incomingReq &&
            incomingReq.receiverId === activeId &&
            incomingReq.status === "pending"
          ) {
            setChatRequests((prev) => [
              incomingReq,
              ...prev.filter((r) => r.id !== incomingReq.id),
            ]);
          }
        }
      );

      // 5. Listen for real-time broadcast chat request accept/reject response
      channel.on(
        "broadcast",
        { event: "chat_request_response" },
        async (payload: {
          payload: {
            requestId?: string;
            status?: string;
            senderId?: string;
            receiverId?: string;
            receiverUsername?: string;
            receiverName?: string;
            receiverAvatar?: string;
          };
        }) => {
          const data = payload.payload;
          const activeId = currentUserRef.current.id;
          if (data?.requestId) {
            setChatRequests((prev) =>
              prev.filter((r) => r.id !== data.requestId)
            );
          }

          if (
            data?.status === "accepted" &&
            data?.senderId === activeId &&
            data?.receiverId
          ) {
            // The other user (receiverId) accepted our chat request!
            const otherName =
              data.receiverUsername || data.receiverName || "Contact";

            const newContact: ChatContact = {
              id: data.receiverId,
              name: otherName,
              avatar: data.receiverAvatar || "",
              avatarColor: "from-[#086288] to-[#4D8DBA]",
              status: "online",
              lastSeen: "Online now",
              about: "Connected via Six9Chat request",
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
              ...prev.filter((c) => c.id !== data.receiverId),
            ]);
            setActiveContactId(newContact.id);
          }
        }
      );

      // 6. Listen for newly created groups
      channel.on(
        "broadcast",
        { event: "new_group" },
        (payload: { payload: ChatContact }) => {
          const incomingGroup = payload.payload;
          if (incomingGroup && incomingGroup.id) {
            setContacts((prev) => [
              incomingGroup,
              ...prev.filter((c) => c.id !== incomingGroup.id),
            ]);
          }
        }
      );

      // 7. Listen for real-time unfriend broadcast events
      channel.on(
        "broadcast",
        { event: "user_unfriended" },
        (payload: { payload: { unfriendedBy: string; targetUserId: string } }) => {
          const data = payload.payload;
          const activeId = currentUserRef.current.id;
          if (data?.targetUserId === activeId && data?.unfriendedBy) {
            setContacts((prev) =>
              prev.map((c) =>
                c.id === data.unfriendedBy
                  ? { ...c, isUnfriendedByPartner: true }
                  : c
              )
            );
          }
        }
      );

      // 8. Listen for postgres changes on messages table
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: { new: Record<string, unknown> | null }) => {
          const newRecord = payload.new;
          if (!newRecord) return;

          const activeId = currentUserRef.current.id;
          const isSelf = newRecord.sender_id === activeId;
          const convId = (newRecord.conversation_id as string) || "";
          const receiverId = (newRecord.receiver_id as string) || "";
          const senderId = (newRecord.sender_id as string) || "";

          // Only process if relevant to current user or group
          if (
            !isSelf &&
            receiverId !== activeId &&
            !convId.startsWith("group-")
          ) {
            return;
          }

          const conversationKey = convId.startsWith("group-")
            ? convId
            : isSelf
            ? (receiverId || convId)
            : senderId;

          const contentText = String(newRecord.content || newRecord.text || "");

          const formatted: ChatMessage = {
            id: String(newRecord.id || Date.now()),
            conversationId: conversationKey,
            senderId: String(newRecord.sender_id || "other"),
            senderName: String(newRecord.sender_name || "Contact"),
            senderAvatar: String(newRecord.sender_avatar || ""),
            isSelf,
            text: contentText,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            date: "Today",
            status: (newRecord.status as MessageStatus) || "delivered",
            mediaType: (newRecord.media_type as MediaType) || "text",
            mediaUrl: (newRecord.media_url as string) || undefined,
            mediaMeta: (newRecord.media_meta as MediaMeta) || undefined,
            reactions: (newRecord.reactions as MessageReaction[]) || [],
            replyTo: ((newRecord.reply_to || newRecord.replyTo || undefined) as any),
          };

          setMessagesMap((prev) => {
            const currentList = prev[conversationKey] || prev[convId] || [];
            const updatedList = [
              ...currentList.filter((m) => m.id !== formatted.id),
              formatted,
            ];
            return {
              ...prev,
              [conversationKey]: updatedList,
              ...(convId && convId !== conversationKey ? { [convId]: updatedList } : {}),
            };
          });

          // Update contact sidebar last message and unread count dynamically
          const currentActiveContactId = activeContactIdRef.current;
          setContacts((prev) => {
            const targetId = isSelf ? receiverId : senderId;
            const exists = prev.some(
              (c) => c.id === conversationKey || c.id === targetId || c.id === convId
            );
            if (exists) {
              return prev.map((c) =>
                c.id === conversationKey || c.id === targetId || c.id === convId
                  ? {
                      ...c,
                      unreadCount:
                        isSelf || c.id === currentActiveContactId
                          ? 0
                          : (c.unreadCount || 0) + 1,
                      lastMessage: {
                        text:
                          contentText ||
                          (formatted.mediaType ? `[${formatted.mediaType.toUpperCase()}]` : "[Message]"),
                        timestamp: formatted.timestamp,
                        isSelf,
                        status: formatted.status,
                        mediaType: formatted.mediaType,
                      },
                    }
                  : c
              );
            } else if (!isSelf && senderId) {
              const newC: ChatContact = {
                id: senderId,
                name: formatted.senderName || "New Contact",
                avatar: formatted.senderAvatar || "",
                status: "online",
                lastSeen: "Online now",
                unreadCount: currentActiveContactId === senderId ? 0 : 1,
                lastMessage: {
                  text: contentText || "[Message]",
                  timestamp: formatted.timestamp,
                  isSelf: false,
                  status: formatted.status,
                  mediaType: formatted.mediaType,
                },
              };
              return [newC, ...prev];
            }
            return prev;
          });
        }
      );

      // 8. Listen for message reactions / updates
      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload: { new: Record<string, unknown> | null }) => {
          const updated = payload.new;
          if (updated && updated.id) {
            setMessagesMap((prev) => {
              const res = { ...prev };
              for (const key of Object.keys(res)) {
                if (res[key].some((m) => m.id === updated.id)) {
                  res[key] = res[key].map((m) =>
                    m.id === updated.id
                      ? {
                          ...m,
                          reactions: (updated.reactions as MessageReaction[]) || m.reactions,
                          status: (updated.status as MessageStatus) || m.status,
                        }
                      : m
                  );
                }
              }
              return res;
            });
          }
        }
      );

      // 9. Listen for realtime conversation updates
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        (payload: { new: Record<string, unknown> | null }) => {
          const conv = payload.new;
          if (!conv) return;
          const activeId = currentUserRef.current.id;
          if (conv.user1_id === activeId || conv.user2_id === activeId) {
            const partnerId = conv.user1_id === activeId ? String(conv.user2_id) : String(conv.user1_id);
            const timeStr = conv.updated_at
              ? new Date(conv.updated_at as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Recently";

            setContacts((prev) => {
              const exists = prev.some((c) => c.id === partnerId || c.id === conv.id);
              if (exists) {
                return prev.map((c) =>
                  c.id === partnerId || c.id === conv.id
                    ? {
                        ...c,
                        lastMessage: conv.last_message
                          ? {
                              text: String(conv.last_message),
                              timestamp: timeStr,
                              isSelf: false,
                              status: "read",
                            }
                          : c.lastMessage,
                      }
                    : c
                );
              }
              return prev;
            });
          }
        }
      );

      // 10. Listen for postgres changes on chat_requests table
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_requests" },
        async (payload: { new: Record<string, unknown> | null }) => {
          const rec = payload.new;
          if (!rec) return;
          const activeId = currentUserRef.current.id;

          // Pending request sent to me
          if (rec.receiver_id === activeId && rec.status === "pending") {
            let senderName = "Six9 User";
            let senderUsername = "";
            let senderAvatar = "";

            try {
              const { data: sp } = await supabase
                .from("profiles")
                .select("full_name, username, avatar_url")
                .eq("id", String(rec.sender_id))
                .maybeSingle();

              if (sp) {
                senderUsername = sp.username || "";
                senderName = senderUsername || "User";
                senderAvatar = sp.avatar_url || "";
              }
            } catch (err) {
              console.warn("Could not fetch sender profile for request:", err);
            }

            const formattedReq: ChatRequest = {
              id: String(rec.id),
              senderId: String(rec.sender_id),
              senderName,
              senderUsername,
              senderAvatar,
              receiverId: String(rec.receiver_id),
              status: "pending",
              message: String(rec.message || "wants to start a conversation with you"),
              createdAt: "Just now",
            };
            setChatRequests((prev) => [
              formattedReq,
              ...prev.filter((r) => r.id !== formattedReq.id),
            ]);
          }

          // If accepted or declined, remove from pending requests
          if (rec.status !== "pending") {
            setChatRequests((prev) => prev.filter((r) => r.id !== String(rec.id)));
          }

          // If my sent request was accepted by the other user, add them to contacts immediately!
          if (rec.status === "accepted" && String(rec.sender_id) === activeId) {
            const receiverId = String(rec.receiver_id);
            try {
              const { data: rp } = await supabase
                .from("profiles")
                .select("id, full_name, username, avatar_url, about, status")
                .eq("id", receiverId)
                .maybeSingle();

              const displayName = rp?.username || rp?.full_name || "Contact";

              const newContact: ChatContact = {
                id: receiverId,
                name: displayName,
                avatar: rp?.avatar_url || "",
                avatarColor: "from-[#086288] to-[#4D8DBA]",
                status: "online",
                lastSeen: "Online now",
                about: rp?.about || rp?.status || "Connected via Six9Chat request",
                phone: "",
                unreadCount: 0,
                lastMessage: {
                  text: "Chat request accepted. Say hi! 👋",
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  isSelf: false,
                  status: "read",
                },
              };

              setContacts((prev) => [newContact, ...prev.filter((c) => c.id !== receiverId)]);
              setActiveContactId(newContact.id);
            } catch (err) {
              console.warn("Could not load newly accepted contact profile:", err);
            }
          }
        }
      );

      channel.subscribe((status: string) => {
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
  }, [currentUser.id]);

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
      mediaUrl?: string,
      replyTo?: { id: string; senderName: string; text: string }
    ) => {
      if (!text.trim() && !mediaUrl && mediaType === "text") return;

      const currentContact = contacts.find((c) => c.id === activeContactId);
      if (currentContact?.isBlocked || currentContact?.isUnfriended || currentContact?.isUnfriendedByPartner) return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const msgId = generateUUID();

      const newMsg: ChatMessage = {
        id: msgId,
        conversationId: activeContactId,
        senderId: currentUser.id,
        senderName: currentUser.name || "You",
        senderAvatar: currentUser.avatar || "",
        senderColor: "from-[#086288] to-[#97D7FF]",
        isSelf: true,
        text: text.trim(),
        timestamp: timeStr,
        date: "Today",
        status: "sending",
        mediaType,
        mediaUrl,
        mediaMeta,
        reactions: [],
        replyTo,
      };

      // 1. Optimistic update
      setMessagesMap((prev) => ({
        ...prev,
        [activeContactId]: [...(prev[activeContactId] || []), newMsg],
      }));

      // 2. Update contact list preview
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

      // 3. Supabase Realtime broadcast to other connected users
      if (channelRef.current) {
        try {
          await channelRef.current.send({
            type: "broadcast",
            event: "new_message",
            payload: {
              ...newMsg,
              receiverId: activeContactId,
              replyTo,
            },
          });
        } catch (err) {
          console.warn("Realtime broadcast notice:", err);
        }
      }

      // 4. Persist to Supabase messages table via backend API & direct client write
      try {
        await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: newMsg.id,
            conversationId: activeContactId,
            senderId: currentUser.id,
            receiverId: activeContactId,
            senderName: currentUser.name,
            senderAvatar: currentUser.avatar,
            text: newMsg.text,
            content: newMsg.text,
            mediaType: newMsg.mediaType,
            mediaUrl: newMsg.mediaUrl,
            mediaMeta: newMsg.mediaMeta,
            reactions: [],
            status: "delivered",
            createdAt: now.toISOString(),
            replyTo,
            replyToId: replyTo?.id,
          }),
        });

        // Direct client Supabase fallback write
        try {
          let convUuid = "";
          if (!activeContactId.startsWith("group-")) {
            const [u1, u2] = [currentUser.id, activeContactId].sort();
            const { data: convRow } = await supabase
              .from("conversations")
              .upsert(
                {
                  user1_id: u1,
                  user2_id: u2,
                  last_message: newMsg.text,
                  updated_at: now.toISOString(),
                },
                { onConflict: "user1_id,user2_id" }
              )
              .select("id")
              .maybeSingle();

            if (convRow?.id) convUuid = convRow.id;
          }

          const targetConvId = convUuid || activeContactId;
          await supabase.from("messages").upsert(
            {
              id: newMsg.id,
              conversation_id: targetConvId,
              sender_id: currentUser.id,
              receiver_id: activeContactId,
              content: newMsg.text,
              text: newMsg.text,
              media_type: newMsg.mediaType || "text",
              media_url: newMsg.mediaUrl || null,
              status: "delivered",
              is_read: false,
              created_at: now.toISOString(),
              reply_to: replyTo || null,
              reply_to_id: replyTo?.id || null,
            },
            { onConflict: "id" }
          );
        } catch {}

        setMessagesMap((prev) => ({
          ...prev,
          [activeContactId]: (prev[activeContactId] || []).map((m) =>
            m.id === msgId ? { ...m, status: "delivered" } : m
          ),
        }));
      } catch (e) {
        console.warn("Persist message error:", e);
      }

      // Only simulate bot replies on demo contacts
      if (activeContactId.startsWith("contact-")) {
        simulateReply(activeContactId, text);
      }
    },
    [activeContactId, currentUser, simulateReply]
  );

  // Reaction toggling with Realtime sync and database persistence
  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
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

      // Broadcast reaction via Realtime
      try {
        channelRef.current?.send({
          type: "broadcast",
          event: "message_reaction",
          payload: {
            messageId,
            emoji,
            userId: currentUser.id,
            conversationId: activeContactId,
          },
        });
      } catch {}

      // Persist reaction to Supabase
      try {
        await fetch("/api/chat/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId,
            emoji,
            userId: currentUser.id,
          }),
        });
      } catch (err) {
        console.warn("Persist reaction error:", err);
      }
    },
    [activeContactId, currentUser.id]
  );

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
          const _initials = displayName
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
            displayName.replace(/\s+/g, "_");

          setCurrentUser({
            id: user.id,
            name: username || displayName,
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

          // 1. Fetch connected contacts & groups strictly from Supabase DB conversations API
          try {
            const convRes = await fetch(`/api/chat/conversations?userId=${user.id}`);
            const convData = await convRes.json();
            const serverContacts: ChatContact[] =
              convData.success && Array.isArray(convData.contacts) ? convData.contacts : [];

            // Check if there was an active contact ID stored in URL search param or localStorage
            let savedTargetId = "";
            if (typeof window !== "undefined") {
              try {
                savedTargetId =
                  new URLSearchParams(window.location.search).get("c") ||
                  localStorage.getItem("six9chat_active_chat") ||
                  "";
              } catch {}
            }

            if (savedTargetId && !serverContacts.some((c) => c.id === savedTargetId)) {
              // Only restore if a genuine conversation exists and request was accepted in database
              try {
                let isAuthorized = savedTargetId.startsWith("group-");
                if (!isAuthorized) {
                  const { data: acceptedReq } = await supabase
                    .from("chat_requests")
                    .select("id")
                    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${savedTargetId}),and(sender_id.eq.${savedTargetId},receiver_id.eq.${user.id})`)
                    .eq("status", "accepted")
                    .maybeSingle();
                  isAuthorized = Boolean(acceptedReq);
                }

                if (isAuthorized) {
                  let partnerId = savedTargetId;
                  if (!savedTargetId.startsWith("group-")) {
                    const [u1, u2] = [user.id, savedTargetId].sort();
                    try {
                      const { data: convRow } = await supabase
                        .from("conversations")
                        .upsert(
                          {
                            user1_id: u1,
                            user2_id: u2,
                            last_message: "Chat request accepted. Say hi! 👋",
                            updated_at: new Date().toISOString(),
                          },
                          { onConflict: "user1_id,user2_id" }
                        )
                        .select("id, user1_id, user2_id")
                        .maybeSingle();

                      if (convRow) {
                        partnerId = convRow.user1_id === user.id ? convRow.user2_id : convRow.user1_id;
                      }
                    } catch {}
                  }

                  const { data: partnerProfile } = await supabase
                    .from("profiles")
                    .select("id, full_name, username, avatar_url, about")
                    .eq("id", partnerId)
                    .maybeSingle();

                  if (partnerProfile && partnerProfile.id !== user.id) {
                    const restoredContact: ChatContact = {
                      id: partnerProfile.id,
                      name: partnerProfile.username || partnerProfile.full_name || "User",
                      avatar: partnerProfile.avatar_url || "",
                      avatarColor: "from-[#086288] to-[#4D8DBA]",
                      status: "online",
                      lastSeen: "Online now",
                      about: partnerProfile.about || "Connected on Six9Chat",
                      unreadCount: 0,
                    };
                    serverContacts.unshift(restoredContact);
                    savedTargetId = partnerProfile.id;
                  }
                } else {
                  // No verified conversation exists! Clear stale target to prevent unapproved chats
                  savedTargetId = "";
                  try {
                    localStorage.removeItem("six9chat_active_chat");
                    const url = new URL(window.location.href);
                    if (url.searchParams.has("c")) {
                      url.searchParams.delete("c");
                      window.history.replaceState({}, "", url.toString());
                    }
                  } catch {}
                }
              } catch {}
            }

            let initialActiveId = "";
            if (savedTargetId && serverContacts.some((c) => c.id === savedTargetId)) {
              initialActiveId = savedTargetId;
            } else if (serverContacts.length > 0) {
              initialActiveId = serverContacts[0].id;
            }

            // Immediately clear unreadCount for the currently open active contact room
            const hydratedContacts = initialActiveId
              ? serverContacts.map((c) => (c.id === initialActiveId ? { ...c, unreadCount: 0 } : c))
              : serverContacts;

            setContacts(hydratedContacts);
            setActiveContactId(initialActiveId);

            if (initialActiveId && user.id) {
              Promise.resolve(
                supabase
                  .from("messages")
                  .update({ is_read: true, status: "read" })
                  .eq("receiver_id", user.id)
                  .eq("is_read", false)
                  .or(`sender_id.eq.${initialActiveId},conversation_id.eq.${initialActiveId}`)
              ).catch(() => {});
            }
          } catch (e) {
            console.warn("Could not load conversations from API:", e);
            setContacts([]);
            setActiveContactId("");
          }

          // 2. Fetch pending chat requests from Supabase
          try {
            const { data: dbRequests } = await supabase
              .from("chat_requests")
              .select("id, sender_id, receiver_id, status, created_at")
              .eq("receiver_id", user.id)
              .eq("status", "pending")
              .order("created_at", { ascending: false });

            if (dbRequests && dbRequests.length > 0) {
              const senderIds = Array.from(new Set(dbRequests.map((r: { sender_id: string }) => r.sender_id)));
              const { data: senderProfiles } = await supabase
                .from("profiles")
                .select("id, full_name, username, avatar_url")
                .in("id", senderIds);

              const profileMap = new Map<string, { full_name?: string; username?: string; avatar_url?: string }>();
              senderProfiles?.forEach((p: { id: string; full_name?: string; username?: string; avatar_url?: string }) => profileMap.set(p.id, p));

              const mapped: ChatRequest[] = dbRequests.map((r: { id: string; sender_id: string; receiver_id: string; status: string; created_at: string }) => {
                const sp = profileMap.get(r.sender_id);
                const senderUsername = sp?.username || "";
                return {
                  id: r.id,
                  senderId: r.sender_id,
                  senderName: senderUsername || sp?.full_name || "User",
                  senderUsername: senderUsername,
                  senderAvatar: sp?.avatar_url || "",
                  receiverId: r.receiver_id,
                  status: r.status as "pending",
                  message: "wants to start a conversation with you",
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

  // 3. Load conversation message history whenever active chat contact changes
  useEffect(() => {
    if (!activeContactId || !currentUser?.id) return;

    // Immediately set unread_count to 0 for this conversation in local state
    setContacts((prev) =>
      prev.map((c) => (c.id === activeContactId && c.unreadCount > 0 ? { ...c, unreadCount: 0 } : c))
    );

    // Trigger Supabase query/RPC update to mark incoming unread messages as is_read = true
    Promise.resolve(
      supabase
        .from("messages")
        .update({ is_read: true, status: "read" })
        .eq("receiver_id", currentUser.id)
        .eq("is_read", false)
        .or(`sender_id.eq.${activeContactId},conversation_id.eq.${activeContactId}`)
    ).catch((e: unknown) => console.warn("Supabase mark read note:", e));

    let isMounted = true;
    async function fetchMessages() {
      try {
        const res = await fetch(
          `/api/chat/messages?conversationId=${activeContactId}&userA=${currentUser.id}&userB=${activeContactId}`
        );
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.messages)) {
          setMessagesMap((prev) => ({
            ...prev,
            [activeContactId]: data.messages,
          }));
        }
      } catch (err) {
        console.warn("Could not load messages history:", err);
      }
    }

    fetchMessages();
    return () => {
      isMounted = false;
    };
  }, [activeContactId, currentUser?.id]);

  // Accept a pending chat request
  const acceptChatRequest = useCallback(async (req: ChatRequest) => {
    // 1. Update status in Supabase via server API route (guaranteed to bypass client RLS issues)
    try {
      await fetch("/api/user/send-request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: req.id,
          status: "accepted",
        }),
      });
    } catch (err) {
      console.warn("Could not sync chat_request accept to API:", err);
    }

    // Automatically generate or verify 1-on-1 row in conversations table
    try {
      if (currentUser?.id && req.senderId) {
        await fetch("/api/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            partnerId: req.senderId,
          }),
        });
      }
    } catch (e) {
      console.warn("Could not generate conversation on request accept:", e);
    }

    // Direct Supabase client sync fallback
    try {
      if (currentUser?.id && req.senderId) {
        const [u1, u2] = [currentUser.id, req.senderId].sort();
        await supabase
          .from("conversations")
          .upsert(
            {
              user1_id: u1,
              user2_id: u2,
              last_message: "Chat request accepted. Say hi! 👋",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user1_id,user2_id" }
          );
      }
      await supabase
        .from("chat_requests")
        .update({ status: "accepted" })
        .eq("id", req.id);
    } catch (err) {
      console.warn("Could not sync chat_request accept to Supabase:", err);
    }

    // 2. Broadcast response via Realtime channel
    try {
      channelRef.current?.send({
        type: "broadcast",
        event: "chat_request_response",
        payload: {
          requestId: req.id,
          status: "accepted",
          senderId: req.senderId,
          receiverId: currentUser.id,
          senderName: req.senderName,
          senderUsername: req.senderUsername,
          senderAvatar: req.senderAvatar,
          receiverName: currentUser.name,
          receiverUsername: currentUser.username,
          receiverAvatar: currentUser.avatar,
        },
      });
    } catch {}

    // 3. Remove from pending requests
    setChatRequests((prev) => prev.filter((r) => r.id !== req.id));

    // 4. Automatically add requester to user's contacts and open chat
    const displayName = req.senderUsername || req.senderName || "Contact";

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
  }, [currentUser]);

  // Decline a pending chat request
  const rejectChatRequest = useCallback(async (requestId: string) => {
    // 1. Update status in Supabase via server API route
    try {
      await fetch("/api/user/send-request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          status: "declined",
        }),
      });
    } catch (err) {
      console.warn("Could not sync chat_request decline to API:", err);
    }

    // Direct Supabase client sync fallback
    try {
      await supabase
        .from("chat_requests")
        .update({ status: "declined" })
        .eq("id", requestId);
    } catch (err) {
      console.warn("Could not sync chat_request decline to Supabase:", err);
    }

    // 2. Broadcast response via Realtime channel
    try {
      channelRef.current?.send({
        type: "broadcast",
        event: "chat_request_response",
        payload: { requestId, status: "declined" },
      });
    } catch {}

    // 3. Remove from pending requests
    setChatRequests((prev) => prev.filter((r) => r.id !== requestId));
  }, []);

  // 1. Block User
  const blockUser = useCallback(
    async (contactId: string) => {
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, isBlocked: true } : c))
      );

      try {
        if (currentUser?.id) {
          await fetch("/api/chat/actions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "block",
              userId: currentUser.id,
              partnerId: contactId,
            }),
          });
        }
      } catch (e) {
        console.warn("blockUser API notice:", e);
      }
    },
    [currentUser]
  );

  // 2. Unblock User
  const unblockUser = useCallback(
    async (contactId: string) => {
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, isBlocked: false } : c))
      );

      try {
        if (currentUser?.id) {
          await fetch("/api/chat/actions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "unblock",
              userId: currentUser.id,
              partnerId: contactId,
            }),
          });
        }
      } catch (e) {
        console.warn("unblockUser API notice:", e);
      }
    },
    [currentUser]
  );

  // 3. Clear Chat
  const clearChat = useCallback(
    async (contactId: string) => {
      // Clear messages in state
      setMessagesMap((prev) => ({
        ...prev,
        [contactId]: [],
      }));

      // Update lastMessage preview
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId
            ? {
                ...c,
                lastMessage: {
                  text: "Chat cleared",
                  timestamp: "Just now",
                  isSelf: true,
                  status: "read",
                },
              }
            : c
        )
      );

      try {
        if (currentUser?.id) {
          await fetch("/api/chat/actions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "clear_chat",
              userId: currentUser.id,
              partnerId: contactId,
            }),
          });
        }
      } catch (e) {
        console.warn("clearChat API notice:", e);
      }
    },
    [currentUser]
  );

  // 4. Delete Chat (Removes conversation entry from chat list while preserving friendship)
  const deleteChat = useCallback(
    async (contactId: string) => {
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      setMessagesMap((prev) => ({
        ...prev,
        [contactId]: [],
      }));

      if (activeContactId === contactId) {
        setActiveContactId("");
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("six9chat_active_chat");
            const url = new URL(window.location.href);
            url.searchParams.delete("c");
            window.history.replaceState({}, "", url.toString());
          } catch {}
        }
      }

      try {
        if (currentUser?.id) {
          await fetch("/api/chat/actions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "delete_chat",
              userId: currentUser.id,
              partnerId: contactId,
            }),
          });
        }
      } catch (e) {
        console.warn("deleteChat API notice:", e);
      }
    },
    [activeContactId, currentUser]
  );

  // 5. Unfriend User (Updates chat_requests, updates contact state, broadcasts event)
  const unfriendUser = useCallback(
    async (contactId: string) => {
      // Mark contact as unfriended locally so the user sees the action footer
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId
            ? { ...c, isUnfriended: true, isUnfriendedByPartner: false }
            : c
        )
      );
      setChatRequests((prev) =>
        prev.filter((r) => r.senderId !== contactId && r.receiverId !== contactId)
      );

      // Broadcast unfriend event to partner in realtime
      try {
        channelRef.current?.send({
          type: "broadcast",
          event: "user_unfriended",
          payload: {
            unfriendedBy: currentUser.id,
            targetUserId: contactId,
          },
        });
      } catch {}

      try {
        if (currentUser?.id) {
          await fetch("/api/chat/actions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "unfriend",
              userId: currentUser.id,
              partnerId: contactId,
            }),
          });
        }
      } catch (e) {
        console.warn("unfriendUser API notice:", e);
      }
    },
    [currentUser]
  );

  const deleteContact = deleteChat;

  // Add a new direct contact or start chat using their genuine Supabase user ID
  const addNewContact = useCallback((name: string, phone: string, avatar?: string, existingUserId?: string) => {
    const id = existingUserId || `contact-${Date.now()}`;

    // If contact already exists in active contacts list, activate them immediately
    const existing = contacts.find((c) => c.id === id || (existingUserId && c.id === existingUserId));
    if (existing) {
      setActiveContactId(existing.id);
      return existing.id;
    }

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

    setContacts((prev) => [newContact, ...prev.filter((c) => c.id !== id)]);
    setActiveContactId(id);

    return id;
  }, [contacts]);

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
    async (targetUserId: string, _targetName?: string, _targetUsername?: string, _targetAvatar?: string) => {
      try {
        await fetch("/api/user/send-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: currentUser.id,
            receiverId: targetUserId,
            message: `${currentUser.name || currentUser.username || "User"} wants to start a conversation with you`,
          }),
        });

        // Direct client Supabase fallback
        try {
          await supabase.from("chat_requests").upsert(
            {
              sender_id: currentUser.id,
              receiver_id: targetUserId,
              status: "pending",
              message: `${currentUser.name || currentUser.username || "User"} wants to start a conversation with you`,
            },
            { onConflict: "sender_id,receiver_id" }
          );
        } catch {}

        channelRef.current?.send({
          type: "broadcast",
          event: "chat_request",
          payload: {
            id: generateUUID(),
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

        // Reset unfriended state on this contact
        setContacts((prev) =>
          prev.map((c) =>
            c.id === targetUserId
              ? { ...c, isUnfriended: false, isUnfriendedByPartner: false }
              : c
          )
        );
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
      router.push("/login");
    }
  }, [router]);

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
    deleteContact,
    blockUser,
    unblockUser,
    clearChat,
    deleteChat,
    unfriendUser,
    signOut: handleSignOut,
  };
}
