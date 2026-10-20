import { ChatContact, ChatMessage, StoryItem, UserProfile } from "@/types/chat";

export const CURRENT_USER: UserProfile = {
  id: "",
  name: "",
  status: "offline",
  statusText: "",
  avatar: "",
  phone: "",
  email: "",
  uid: "",
};

export const INITIAL_CONTACTS: ChatContact[] = [];

export const INITIAL_MESSAGES_BY_CONTACT: Record<string, ChatMessage[]> = {};

export const INITIAL_STORIES: StoryItem[] = [];
