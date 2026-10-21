import { supabaseServer } from "@/lib/authService";
import { ChatContact, ChatMessage, MessageReaction } from "@/types/chat";

export interface DBMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  text: string;
  media_type?: string;
  media_url?: string;
  media_meta?: any;
  reactions?: any[];
  status?: string;
  created_at: string;
}

// In-memory backup cache to guarantee 0-latency and seamless operation even if DB tables are pending
const memoryMessages = new Map<string, DBMessage[]>(); // key: conversation_id
const messageLookup = new Map<string, DBMessage>(); // key: message.id

/**
 * Helper to compute a canonical 1-on-1 conversation ID between two user IDs
 */
export function getCanonicalConversationId(userA: string, userB: string): string {
  if (!userA || !userB) return userA || userB || "general";
  if (userA.startsWith("group-") || userB.startsWith("group-")) {
    return userA.startsWith("group-") ? userA : userB;
  }
  return [userA, userB].sort().join(":");
}

/**
 * Get or create a 1-on-1 conversation record in Supabase conversations table
 */
export async function getOrCreateConversation(userA: string, userB: string): Promise<{
  id: string;
  user1_id: string;
  user2_id: string;
  last_message?: string;
  updated_at?: string;
}> {
  const [user1_id, user2_id] = [userA, userB].sort();

  // 1. Try finding existing conversation in Supabase
  try {
    const { data: existing, error } = await supabaseServer
      .from("conversations")
      .select("id, user1_id, user2_id, last_message, updated_at")
      .or(`and(user1_id.eq.${user1_id},user2_id.eq.${user2_id}),and(user1_id.eq.${user2_id},user2_id.eq.${user1_id})`)
      .limit(1)
      .maybeSingle();

    if (!error && existing) {
      return existing;
    }
  } catch (err) {
    console.warn("[ChatService] getOrCreateConversation select note:", err);
  }

  // 2. Insert new conversation row
  try {
    const { data: newRow, error: insertErr } = await supabaseServer
      .from("conversations")
      .insert({
        user1_id,
        user2_id,
        last_message: "",
        updated_at: new Date().toISOString(),
      })
      .select("id, user1_id, user2_id, last_message, updated_at")
      .maybeSingle();

    if (!insertErr && newRow) {
      return newRow;
    }
  } catch (err) {
    console.warn("[ChatService] getOrCreateConversation insert note:", err);
  }

  // 3. Fallback canonical conversation ID
  return {
    id: getCanonicalConversationId(user1_id, user2_id),
    user1_id,
    user2_id,
    last_message: "",
    updated_at: new Date().toISOString(),
  };
}

/**
 * Save a new message into Supabase messages table and in-memory cache
 */
export async function saveMessage(msg: {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  senderName?: string;
  senderAvatar?: string;
  text: string;
  mediaType?: string;
  mediaUrl?: string;
  mediaMeta?: any;
  reactions?: any[];
  status?: string;
  createdAt?: string;
}): Promise<DBMessage> {
  const canonicalId = msg.receiverId
    ? getCanonicalConversationId(msg.senderId, msg.receiverId)
    : msg.conversationId;

  const record: DBMessage = {
    id: msg.id,
    conversation_id: canonicalId,
    sender_id: msg.senderId,
    receiver_id: msg.receiverId,
    sender_name: msg.senderName || "User",
    sender_avatar: msg.senderAvatar || "",
    text: msg.text || "",
    media_type: msg.mediaType || "text",
    media_url: msg.mediaUrl || undefined,
    media_meta: msg.mediaMeta || undefined,
    reactions: msg.reactions || [],
    status: msg.status || "delivered",
    created_at: msg.createdAt || new Date().toISOString(),
  };

  // 1. Cache in memory
  messageLookup.set(record.id, record);
  const existingList = memoryMessages.get(canonicalId) || [];
  if (!existingList.some((m) => m.id === record.id)) {
    existingList.push(record);
    memoryMessages.set(canonicalId, existingList);
  }

  // Also cache by receiver ID / conversation ID for quick lookups
  if (msg.conversationId !== canonicalId) {
    const listB = memoryMessages.get(msg.conversationId) || [];
    if (!listB.some((m) => m.id === record.id)) {
      listB.push(record);
      memoryMessages.set(msg.conversationId, listB);
    }
  }

  // 2. Persist to Supabase messages table
  try {
    await supabaseServer.from("messages").upsert(
      {
        id: record.id,
        conversation_id: record.conversation_id,
        sender_id: record.sender_id,
        receiver_id: record.receiver_id,
        content: record.text,
        text: record.text,
        is_read: false,
        sender_name: record.sender_name,
        sender_avatar: record.sender_avatar,
        media_type: record.media_type,
        media_url: record.media_url,
        media_meta: record.media_meta,
        reactions: record.reactions,
        status: record.status,
        created_at: record.created_at,
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.warn("[ChatService] saveMessage db notice:", err);
  }

  // 3. Update conversations table last_message and updated_at
  if (record.receiver_id && record.sender_id && !record.conversation_id.startsWith("group-")) {
    const [u1, u2] = [record.sender_id, record.receiver_id].sort();
    try {
      await supabaseServer
        .from("conversations")
        .update({
          last_message: record.text,
          updated_at: new Date().toISOString(),
        })
        .or(`and(user1_id.eq.${u1},user2_id.eq.${u2}),and(user1_id.eq.${u2},user2_id.eq.${u1})`);
    } catch (convErr) {
      console.warn("[ChatService] saveMessage conversation update notice:", convErr);
    }
  }

  return record;
}

/**
 * Fetch messages for a conversation or between two users
 */
export async function getConversationMessages(
  conversationId: string,
  userA?: string,
  userB?: string
): Promise<ChatMessage[]> {
  const canonicalId =
    userA && userB
      ? getCanonicalConversationId(userA, userB)
      : conversationId;

  const resultMessages: DBMessage[] = [];
  const seenIds = new Set<string>();

  // 1. Try fetching from Supabase messages table
  try {
    let query = supabaseServer
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (userA && userB && !canonicalId.startsWith("group-")) {
      query = query.or(
        `conversation_id.eq.${canonicalId},and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`
      );
    } else {
      query = query.or(
        `conversation_id.eq.${canonicalId},conversation_id.eq.${conversationId}`
      );
    }

    const { data: dbData, error } = await query;
    if (!error && Array.isArray(dbData)) {
      for (const row of dbData) {
        if (!seenIds.has(row.id)) {
          seenIds.add(row.id);
          resultMessages.push({
            id: row.id,
            conversation_id: row.conversation_id,
            sender_id: row.sender_id,
            receiver_id: row.receiver_id,
            sender_name: row.sender_name,
            sender_avatar: row.sender_avatar,
            text: row.content || row.text || "",
            media_type: row.media_type,
            media_url: row.media_url,
            media_meta: row.media_meta,
            reactions: row.reactions || [],
            status: row.status,
            created_at: row.created_at,
          });
        }
      }
    }
  } catch (err) {
    console.warn("[ChatService] getConversationMessages db notice:", err);
  }

  // 2. Supplement from in-memory cache
  const cachedA = memoryMessages.get(canonicalId) || [];
  const cachedB = memoryMessages.get(conversationId) || [];
  for (const m of [...cachedA, ...cachedB]) {
    if (!seenIds.has(m.id)) {
      seenIds.add(m.id);
      resultMessages.push(m);
    }
  }

  // Sort chronologically
  resultMessages.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Map to frontend ChatMessage format
  return resultMessages.map((m) => ({
    id: m.id,
    conversationId: conversationId,
    senderId: m.sender_id,
    senderName: m.sender_name || "User",
    senderAvatar: m.sender_avatar || "",
    isSelf: userA ? m.sender_id === userA : false,
    text: m.text,
    timestamp: new Date(m.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    date: new Date(m.created_at).toDateString() === new Date().toDateString()
      ? "Today"
      : new Date(m.created_at).toLocaleDateString([], {
          month: "short",
          day: "numeric",
        }),
    status: (m.status as any) || "delivered",
    mediaType: (m.media_type as any) || "text",
    mediaUrl: m.media_url || undefined,
    mediaMeta: m.media_meta || undefined,
    reactions: m.reactions || [],
  }));
}

/**
 * Add or toggle a reaction on a message
 */
export async function toggleMessageReaction(
  messageId: string,
  emoji: string,
  userId: string
): Promise<{ success: boolean; reactions: MessageReaction[] }> {
  let target = messageLookup.get(messageId);

  // If not in memory, try fetching from Supabase
  if (!target) {
    try {
      const { data } = await supabaseServer
        .from("messages")
        .select("*")
        .eq("id", messageId)
        .maybeSingle();
      if (data) target = data as DBMessage;
    } catch {}
  }

  const reactions: MessageReaction[] = Array.isArray(target?.reactions)
    ? [...target!.reactions]
    : [];

  const existingIdx = reactions.findIndex((r) => r.emoji === emoji);
  if (existingIdx >= 0) {
    const item = reactions[existingIdx];
    if (item.userReacted) {
      if (item.count <= 1) {
        reactions.splice(existingIdx, 1);
      } else {
        reactions[existingIdx] = {
          ...item,
          count: item.count - 1,
          userReacted: false,
        };
      }
    } else {
      reactions[existingIdx] = {
        ...item,
        count: item.count + 1,
        userReacted: true,
      };
    }
  } else {
    reactions.push({ emoji, count: 1, userReacted: true });
  }

  // Update memory
  if (target) {
    target.reactions = reactions;
    messageLookup.set(messageId, target);
  }

  // Update Supabase
  try {
    await supabaseServer
      .from("messages")
      .update({ reactions })
      .eq("id", messageId);
  } catch (err) {
    console.warn("[ChatService] toggleMessageReaction db notice:", err);
  }

  return { success: true, reactions };
}

/**
 * Load all connected contacts (from conversations & accepted requests) and groups for a user
 */
export async function getUserConnectedContacts(userId: string): Promise<ChatContact[]> {
  const contactsMap = new Map<string, ChatContact>();
  const contactIds = new Set<string>();
  const lastMessageMap = new Map<string, { text: string; timestamp: string; isSelf: boolean; status: "sent" | "delivered" | "read" }>();

  // 0. Fetch contacts from Supabase `conversations` table
  try {
    const { data: convs, error: convErr } = await supabaseServer
      .from("conversations")
      .select("id, user1_id, user2_id, last_message, updated_at")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (!convErr && Array.isArray(convs)) {
      for (const c of convs) {
        const partnerId = c.user1_id === userId ? c.user2_id : c.user1_id;
        if (partnerId && partnerId !== userId) {
          contactIds.add(partnerId);
          if (c.last_message && !lastMessageMap.has(partnerId)) {
            const timeStr = c.updated_at
              ? new Date(c.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Recently";
            lastMessageMap.set(partnerId, {
              text: c.last_message,
              timestamp: timeStr,
              isSelf: false,
              status: "read",
            });
          }
        }
      }
    }
  } catch (convNotice) {
    console.warn("[ChatService] getUserConnectedContacts conversations note:", convNotice);
  }

  // 1. Fetch contacts from messages history (any 1-on-1 messages sent or received)
  try {
    const { data: recentMsgs } = await supabaseServer
      .from("messages")
      .select("id, conversation_id, sender_id, receiver_id, text, created_at, status, media_type")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(150);

    if (Array.isArray(recentMsgs)) {
      for (const m of recentMsgs) {
        if (m.conversation_id && m.conversation_id.startsWith("group-")) continue;
        const partnerId = m.sender_id === userId ? m.receiver_id : m.sender_id;
        if (partnerId && partnerId !== userId) {
          contactIds.add(partnerId);
          if (!lastMessageMap.has(partnerId)) {
            const timeStr = m.created_at
              ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Recently";
            lastMessageMap.set(partnerId, {
              text: m.text || (m.media_type ? `[${m.media_type.toUpperCase()}]` : "Message"),
              timestamp: timeStr,
              isSelf: m.sender_id === userId,
              status: (m.status as any) || "delivered",
            });
          }
        }
      }
    }
  } catch (msgErr) {
    console.warn("[ChatService] getUserConnectedContacts messages notice:", msgErr);
  }

  // 2. Fetch contacts from chat_requests (both accepted and pending)
  try {
    const { data: requests, error } = await supabaseServer
      .from("chat_requests")
      .select("id, sender_id, receiver_id, status, updated_at, created_at")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .in("status", ["accepted", "pending"]);

    if (!error && Array.isArray(requests)) {
      for (const r of requests) {
        const partnerId = r.sender_id === userId ? r.receiver_id : r.sender_id;
        if (partnerId && partnerId !== userId) {
          contactIds.add(partnerId);
          if (!lastMessageMap.has(partnerId)) {
            lastMessageMap.set(partnerId, {
              text: r.status === "accepted" ? "Connected! Start chatting" : "Chat request sent",
              timestamp: "Recently",
              isSelf: r.sender_id === userId,
              status: "read",
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn("[ChatService] getUserConnectedContacts chat_requests notice:", err);
  }

  // 3. Fetch profiles for all discovered contact IDs
  if (contactIds.size > 0) {
    try {
      const { data: profiles } = await supabaseServer
        .from("profiles")
        .select("id, username, email, full_name, about, avatar_url, updated_at, created_at")
        .in("id", Array.from(contactIds));

      if (Array.isArray(profiles)) {
        for (const p of profiles) {
          const lastMsg = lastMessageMap.get(p.id) || {
            text: "Started a conversation",
            timestamp: "Just now",
            isSelf: false,
            status: "read",
          };

          contactsMap.set(p.id, {
            id: p.id,
            name: p.username ? `@${p.username.replace(/^@/, "")}` : (p.full_name || "Contact"),
            avatar: p.avatar_url || "",
            avatarColor: "from-[#086288] to-[#4D8DBA]",
            status: "online",
            lastSeen: "Online now",
            about: p.about || "Hey there! I am using Six9Chat",
            phone: p.username || p.email || "",
            unreadCount: 0,
            lastMessage: lastMsg,
          });
        }
      }
    } catch (profErr) {
      console.warn("[ChatService] getUserConnectedContacts profiles notice:", profErr);
    }
  }

  // 2. Fetch groups where user is creator or member
  try {
    const { data: groups } = await supabaseServer
      .from("groups")
      .select("*")
      .or(`creator_id.eq.${userId},members.cs.{${userId}}`);

    if (Array.isArray(groups)) {
      for (const g of groups) {
        contactsMap.set(g.id, {
          id: g.id,
          name: g.name,
          avatar: g.avatar_url || "",
          avatarColor: "from-[#086288] via-[#4D8DBA] to-[#97D7FF]",
          status: "online",
          lastSeen: `${(g.members || []).length} members`,
          about: g.description || "Six9Chat Group",
          isGroup: true,
          groupMembers: g.members || [],
          unreadCount: 0,
          lastMessage: {
            text: `Group created`,
            timestamp: "Today",
            isSelf: false,
            status: "read",
          },
        });
      }
    }
  } catch (err) {
    console.warn("[ChatService] getUserConnectedContacts groups notice:", err);
  }

  return Array.from(contactsMap.values());
}
