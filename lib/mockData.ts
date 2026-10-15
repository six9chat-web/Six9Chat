import { ChatContact, ChatMessage, StoryItem, UserProfile } from "@/types/chat";

export const CURRENT_USER: UserProfile = {
  id: "user-me",
  name: "You",
  status: "online",
  statusText: "Building with Six9Chat 🚀",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  phone: "+1 (555) 019-2834",
  email: "you@six9chat.com",
  uid: "S9-01",
};

export const INITIAL_CONTACTS: ChatContact[] = [];

export const INITIAL_MESSAGES_BY_CONTACT: Record<string, ChatMessage[]> = {};

export const INITIAL_STORIES: StoryItem[] = [];
