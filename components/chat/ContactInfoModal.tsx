"use client";

import React from "react";
import { ProfileModal } from "./ProfileModal";
import { UserProfile, ChatContact } from "@/types/chat";

export interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | ChatContact;
  currentUserId?: string;
  targetUserId?: string;
  isOwnProfile?: boolean;
  onSignOut?: () => void;
  onUpdateProfile?: (data: {
    name: string;
    avatar: string;
    statusText: string;
    username?: string;
  }) => Promise<void>;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
}

/**
 * ContactInfoModal Component
 * Checks `isOwnProfile = (currentUserId === targetUserId)`.
 * If !isOwnProfile, completely HIDES the Email address and Language dropdown blocks.
 */
export function ContactInfoModal(props: ContactInfoModalProps) {
  const currentUserId = props.currentUserId || "";
  const targetUserId = props.targetUserId || props.currentUser?.id || "";
  
  // Explicit check: isOwnProfile = (currentUserId === targetUserId)
  const isOwnProfile = currentUserId && targetUserId
    ? currentUserId === targetUserId
    : (props.isOwnProfile ?? false);

  return (
    <ProfileModal
      {...props}
      currentUser={props.currentUser || ({} as any)}
      currentUserId={currentUserId}
      targetUserId={targetUserId}
      isOwnProfile={isOwnProfile}
    />
  );
}

export const UserProfileModal = ContactInfoModal;
export default ContactInfoModal;
