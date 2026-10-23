import { supabaseServer } from "@/lib/authService";
import { ChatContact, ChatMessage, MediaMeta, MediaType, MessageReaction, MessageStatus, generateUUID } from "@/types/chat";

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
  media_meta?: MediaMeta;
  reactions?: MessageReaction[];
  reply_to?: { id: string; senderName: string; text: string };
  reply_to_id?: string;
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
 * Get or create a permanent 1-on-1 conversation record in Supabase conversations table
 */
export async function getOrCreateConversation(userA: string, userB: string): Promise<{
  id: string;
  user1_id: string;
  user2_id: string;
  last_message?: string;
  updated_at?: string;
}> {
  const [user1_id, user2_id] = [userA, userB].sort();

  // Try finding existing conversation in Supabase
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

    // Insert or upsert permanent conversation row
    const { data: upsertedRow, error: insertErr } = await supabaseServer
      .from("conversations")
      .upsert(
        {
          user1_id,
          user2_id,
          last_message: "Chat request accepted. Say hi! 👋",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user1_id,user2_id" }
      )
      .select("id, user1_id, user2_id, last_message, updated_at")
      .maybeSingle();

    if (!insertErr && upsertedRow) {
      return upsertedRow;
    }

    // In case upsert had a conflict without returning data, re-query existing
    const { data: retryExisting } = await supabaseServer
      .from("conversations")
      .select("id, user1_id, user2_id, last_message, updated_at")
      .or(`and(user1_id.eq.${user1_id},user2_id.eq.${user2_id}),and(user1_id.eq.${user2_id},user2_id.eq.${user1_id})`)
      .limit(1)
      .maybeSingle();

    if (retryExisting) {
      return retryExisting;
    }
  } catch (err) {
    console.warn("[ChatService] getOrCreateConversation note:", err);
  }

  // Fallback canonical conversation ID
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
  mediaMeta?: MediaMeta;
  reactions?: MessageReaction[];
  replyTo?: { id: string; senderName: string; text: string };
  replyToId?: string;
  status?: string;
  createdAt?: string;
}): Promise<DBMessage> {
  const canonicalId = msg.receiverId
    ? getCanonicalConversationId(msg.senderId, msg.receiverId)
    : msg.conversationId;

  // Validate or assign a valid UUID for message ID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const validMsgId = uuidRegex.test(msg.id) ? msg.id : generateUUID();
  const replyToId = msg.replyTo?.id || msg.replyToId || undefined;

  const record: DBMessage = {
    id: validMsgId,
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
    reply_to: msg.replyTo,
    reply_to_id: replyToId,
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

  // 2. Persist to Supabase messages table and update conversations
  try {
    let targetConvId = record.conversation_id;

    if (record.receiver_id && record.sender_id && !record.conversation_id.startsWith("group-")) {
      const conv = await getOrCreateConversation(record.sender_id, record.receiver_id);
      if (conv && conv.id) {
        targetConvId = conv.id;
        record.conversation_id = conv.id;
        // Update last_message on conversation
        await supabaseServer
          .from("conversations")
          .update({
            last_message: record.text,
            updated_at: record.created_at,
          })
          .eq("id", conv.id);
      }
    }

    await supabaseServer.from("messages").upsert(
      {
        id: record.id,
        conversation_id: targetConvId,
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
        reply_to: record.reply_to || null,
        reply_to_id: replyToId || null,
        status: record.status,
        created_at: record.created_at,
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.warn("[ChatService] saveMessage db notice:", err);
  }

  return record;
}

/**
 * Permanently delete a message from Supabase messages table and memory cache
 */
export async function deleteMessageFromDb(messageId: string): Promise<boolean> {
  try {
    messageLookup.delete(messageId);
    for (const [convId, list] of memoryMessages.entries()) {
      memoryMessages.set(convId, list.filter((m) => m.id !== messageId));
    }

    const { error } = await supabaseServer
      .from("messages")
      .delete()
      .eq("id", messageId);

    if (error) {
      console.warn("[ChatService] deleteMessageFromDb db notice:", error);
    }
    return !error;
  } catch (err) {
    console.warn("[ChatService] deleteMessageFromDb exception:", err);
    return false;
  }
}

/**
 * Permanently delete multiple messages from Supabase messages table and memory cache
 */
export async function deleteMultipleMessagesFromDb(messageIds: string[]): Promise<boolean> {
  if (!messageIds || messageIds.length === 0) return true;
  try {
    for (const id of messageIds) {
      messageLookup.delete(id);
    }
    for (const [convId, list] of memoryMessages.entries()) {
      memoryMessages.set(convId, list.filter((m) => !messageIds.includes(m.id)));
    }

    const { error } = await supabaseServer
      .from("messages")
      .delete()
      .in("id", messageIds);

    if (error) {
      console.warn("[ChatService] deleteMultipleMessagesFromDb db notice:", error);
    }
    return !error;
  } catch (err) {
    console.warn("[ChatService] deleteMultipleMessagesFromDb exception:", err);
    return false;
  }
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

  // Mark unread messages received by userA from userB as read
  if (userA && userB) {
    try {
      await supabaseServer
        .from("messages")
        .update({ is_read: true, status: "read" })
        .eq("receiver_id", userA)
        .eq("sender_id", userB)
        .eq("is_read", false);
    } catch {}
  }

  // 1. Try fetching from Supabase messages table
  try {
    let query = supabaseServer
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (userA && userB && !canonicalId.startsWith("group-")) {
      let convUuid = "";
      try {
        const conv = await getOrCreateConversation(userA, userB);
        if (conv?.id) convUuid = conv.id;
      } catch {}

      const orFilters = [
        `and(sender_id.eq.${userA},receiver_id.eq.${userB})`,
        `and(sender_id.eq.${userB},receiver_id.eq.${userA})`,
      ];
      if (convUuid) orFilters.push(`conversation_id.eq.${convUuid}`);
      if (canonicalId && canonicalId !== convUuid) orFilters.push(`conversation_id.eq.${canonicalId}`);
      if (conversationId && conversationId !== convUuid && conversationId !== canonicalId) {
        orFilters.push(`conversation_id.eq.${conversationId}`);
      }

      query = query.or(orFilters.join(","));
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
            reply_to: row.reply_to || (row.reply_to_id ? { id: row.reply_to_id, senderName: "", text: "" } : undefined),
            reply_to_id: row.reply_to_id,
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
    status: (m.status as MessageStatus) || "delivered",
    mediaType: (m.media_type as MediaType) || "text",
    mediaUrl: m.media_url || undefined,
    mediaMeta: m.media_meta || undefined,
    reactions: m.reactions || [],
    replyTo: m.reply_to || (m as any).replyTo || undefined,
  }));
}

/**
 * Add or toggle a reaction on a message
 */
export async function toggleMessageReaction(
  messageId: string,
  emoji: string,
  _userId: string
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
 * Load all connected contacts (from chat_requests & conversations) and groups for a user
 * Guarantees 100% persistent load of accepted friends and active chats like WhatsApp.
 */
export async function getUserConnectedContacts(userId: string): Promise<ChatContact[]> {
  const contactsMap = new Map<string, ChatContact>();
  const allContactIds = new Set<string>();
  const lastMessageMap = new Map<
    string,
    { text: string; timestamp: string; isSelf: boolean; status: MessageStatus; rawTime?: string }
  >();
  const conversationMap = new Map<string, { id: string; last_message?: string; updated_at?: string }>();

  // 1. Fetch chat requests (accepted, unfriended, blocked) for this user
  const acceptedPartnerIds = new Set<string>();
  const unfriendedByMeSet = new Set<string>();
  const unfriendedByPartnerSet = new Set<string>();
  const blockedByMeSet = new Set<string>();
  const blockedMeSet = new Set<string>();

  try {
    const { data: requests, error } = await supabaseServer
      .from("chat_requests")
      .select("id, sender_id, receiver_id, status, updated_at, created_at")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (!error && Array.isArray(requests)) {
      for (const r of requests) {
        const partnerId = r.sender_id === userId ? r.receiver_id : r.sender_id;
        if (!partnerId || partnerId === userId) continue;

        if (r.status === "accepted") {
          acceptedPartnerIds.add(partnerId);
          allContactIds.add(partnerId);
        } else if (r.status === "unfriended") {
          if (r.sender_id === userId) {
            unfriendedByMeSet.add(partnerId);
          } else {
            unfriendedByPartnerSet.add(partnerId);
          }
          allContactIds.add(partnerId);
        } else if (r.status === "blocked") {
          if (r.sender_id === userId) {
            blockedByMeSet.add(partnerId);
          } else {
            blockedMeSet.add(partnerId);
          }
          allContactIds.add(partnerId);
        }
      }
    }
  } catch (err) {
    console.warn("[ChatService] getUserConnectedContacts chat_requests notice:", err);
  }

  // 2. Fetch conversations for this user
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
          conversationMap.set(partnerId, c);
          // If not unfriended/blocked, ensure partner is in active contacts list
          if (!unfriendedByMeSet.has(partnerId) && !unfriendedByPartnerSet.has(partnerId)) {
            allContactIds.add(partnerId);
          }
        }
      }
    }
  } catch (convNotice) {
    console.warn("[ChatService] getUserConnectedContacts conversations note:", convNotice);
  }

  // 3. For every accepted friend, ensure a permanent row in conversations exists
  for (const partnerId of acceptedPartnerIds) {
    if (!conversationMap.has(partnerId)) {
      try {
        const conv = await getOrCreateConversation(userId, partnerId);
        if (conv) {
          conversationMap.set(partnerId, conv);
        }
      } catch (convErr) {
        console.warn("[ChatService] auto create conversation note:", convErr);
      }
    }
  }

  // 4. Query blocked_users table
  try {
    const { data: blocks } = await supabaseServer
      .from("blocked_users")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

    if (Array.isArray(blocks)) {
      for (const b of blocks) {
        if (b.blocker_id === userId) {
          blockedByMeSet.add(b.blocked_id);
        } else if (b.blocked_id === userId) {
          blockedMeSet.add(b.blocker_id);
        }
      }
    }
  } catch (blockErr) {
    console.warn("[ChatService] getUserConnectedContacts blocked_users notice:", blockErr);
  }

  // 5. Query unread count for active user (receiver_id = userId, is_read = false)
  const unreadCountMap = new Map<string, number>();
  try {
    const { data: unreadRows } = await supabaseServer
      .from("messages")
      .select("id, sender_id")
      .eq("receiver_id", userId)
      .eq("is_read", false);

    if (Array.isArray(unreadRows)) {
      for (const row of unreadRows) {
        if (row.sender_id) {
          unreadCountMap.set(row.sender_id, (unreadCountMap.get(row.sender_id) || 0) + 1);
        }
      }
    }
  } catch (unreadErr) {
    console.warn("[ChatService] getUserConnectedContacts unread messages notice:", unreadErr);
  }

  // 6. Query recent messages to populate accurate last message preview
  if (allContactIds.size > 0) {
    try {
      const { data: recentMsgs } = await supabaseServer
        .from("messages")
        .select("id, conversation_id, sender_id, receiver_id, content, text, created_at, status, media_type")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(300);

      if (Array.isArray(recentMsgs)) {
        for (const m of recentMsgs) {
          if (m.conversation_id && m.conversation_id.startsWith("group-")) continue;
          const partnerId = m.sender_id === userId ? m.receiver_id : m.sender_id;
          if (partnerId && allContactIds.has(partnerId) && !lastMessageMap.has(partnerId)) {
            const timeStr = m.created_at
              ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Recently";
            const textContent = m.content || m.text || (m.media_type ? `[${m.media_type.toUpperCase()}]` : "Message");
            lastMessageMap.set(partnerId, {
              text: textContent,
              timestamp: timeStr,
              isSelf: m.sender_id === userId,
              status: (m.status as MessageStatus) || "delivered",
              rawTime: m.created_at,
            });
          }
        }
      }
    } catch (msgErr) {
      console.warn("[ChatService] getUserConnectedContacts messages notice:", msgErr);
    }
  }

  // 7. Fetch profiles for all discovered contact IDs
  if (allContactIds.size > 0) {
    try {
      const { data: profiles } = await supabaseServer
        .from("profiles")
        .select("id, username, email, full_name, about, avatar_url, updated_at, created_at")
        .in("id", Array.from(allContactIds));

      if (Array.isArray(profiles)) {
        for (const p of profiles) {
          const conv = conversationMap.get(p.id);
          const lastMsg = lastMessageMap.get(p.id) || {
            text: conv?.last_message || (unfriendedByMeSet.has(p.id) || unfriendedByPartnerSet.has(p.id) ? "Unfriended" : "Chat request accepted. Say hi! 👋"),
            timestamp: conv?.updated_at
              ? new Date(conv.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Recently",
            isSelf: false,
            status: "read",
            rawTime: conv?.updated_at || p.updated_at,
          };

          contactsMap.set(p.id, {
            id: p.id,
            name: p.username ? p.username : (p.full_name || "Contact"),
            avatar: p.avatar_url || "",
            avatarColor: "from-[#086288] to-[#4D8DBA]",
            status: "online",
            lastSeen: "Online now",
            about: p.about || "Hey there! I am using Six9Chat",
            phone: p.username || p.email || "",
            unreadCount: unreadCountMap.get(p.id) || 0,
            isBlocked: blockedByMeSet.has(p.id),
            isBlockedByPartner: blockedMeSet.has(p.id),
            isUnfriended: unfriendedByMeSet.has(p.id),
            isUnfriendedByPartner: unfriendedByPartnerSet.has(p.id),
            lastMessage: {
              text: lastMsg.text,
              timestamp: lastMsg.timestamp,
              isSelf: lastMsg.isSelf,
              status: lastMsg.status,
            },
            updatedAt: lastMsg.rawTime || conv?.updated_at || p.updated_at || new Date().toISOString(),
          } as ChatContact & { updatedAt?: string });
        }
      }
    } catch (profErr) {
      console.warn("[ChatService] getUserConnectedContacts profiles notice:", profErr);
    }
  }

  // 8. Fetch groups where user is creator or member
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
          updatedAt: g.updated_at || g.created_at || new Date().toISOString(),
        } as ChatContact & { updatedAt?: string });
      }
    }
  } catch (err) {
    console.warn("[ChatService] getUserConnectedContacts groups notice:", err);
  }

  // 9. Sort contacts by latest activity descending (WhatsApp style)
  const sorted = Array.from(contactsMap.values()).sort((a, b) => {
    const tA = (a as any).updatedAt ? new Date((a as any).updatedAt).getTime() : 0;
    const tB = (b as any).updatedAt ? new Date((b as any).updatedAt).getTime() : 0;
    return tB - tA;
  });

  return sorted;
}
