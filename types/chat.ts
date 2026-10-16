export type MessageStatus = "sending" | "sent" | "delivered" | "read";

export type MediaType = "text" | "image" | "video" | "audio" | "document" | "file" | "location" | "call";

export interface CallLogMeta {
  type: "voice" | "video";
  status: "no_answer" | "missed" | "completed";
  duration?: string;
}

export interface MediaMeta {
  fileName?: string;
  fileSize?: string;
  duration?: string;
  aspectRatio?: string;
  locationName?: string;
  coordinates?: string;
  callLog?: CallLogMeta;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  userReacted?: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderColor?: string;
  isSelf: boolean;
  text: string;
  timestamp: string; // e.g. "10:45 AM"
  date: string; // e.g. "Today", "Yesterday", "Monday"
  status: MessageStatus;
  mediaType?: MediaType;
  mediaUrl?: string;
  mediaMeta?: MediaMeta;
  reactions?: MessageReaction[];
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
}

export interface ChatContact {
  id: string;
  name: string;
  avatar: string;
  avatarColor?: string;
  status: "online" | "offline" | "typing" | "away";
  lastSeen?: string;
  about?: string;
  phone?: string;
  isPinned?: boolean;
  isFavourite?: boolean;
  isCommunity?: boolean;
  isGroup?: boolean;
  groupMembers?: string[];
  unreadCount: number;
  lastMessage?: {
    text: string;
    timestamp: string;
    isSelf: boolean;
    status?: MessageStatus;
    mediaType?: MediaType;
    reaction?: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  status: "online" | "offline" | "busy" | "away";
  statusText: string;
  avatar: string;
  phone: string;
  email?: string;
  uid?: string;
}

export interface StoryItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl?: string;
  caption?: string;
  timestamp: string;
  viewed: boolean;
}

export interface ChatRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername?: string;
  senderAvatar?: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  message?: string;
  createdAt: string;
}

