"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
}

/**
 * Clean, neutral WhatsApp-style SVG silhouette icon for users without a custom DP.
 */
export function DefaultAvatarSilhouette({
  className = "w-3/5 h-3/5 text-slate-200/90",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-hidden="true"
    >
      {/* WhatsApp-style Head */}
      <circle cx="12" cy="7.5" r="4.5" />
      {/* WhatsApp-style Body / Shoulders */}
      <path d="M12 13.8c-3.6 0-9 1.8-9 5.4V21h18v-1.8c0-3.6-5.4-5.4-9-5.4z" />
    </svg>
  );
}

/**
 * Reusable Avatar component:
 * - If src is a valid image URL, renders <img> with error fallback
 * - If no custom DP (or empty, or letter initials), renders clean WhatsApp-style neutral silhouette
 */
export function Avatar({
  src,
  alt = "User Avatar",
  className,
  iconClassName,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const isImageSrc =
    !imageError &&
    typeof src === "string" &&
    src.trim().length > 0 &&
    (src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("data:") ||
      src.startsWith("blob:") ||
      src.startsWith("/"));

  return (
    <div
      className={cn(
        "relative rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-tr from-[#086288] to-[#4D8DBA] shrink-0",
        className
      )}
    >
      {isImageSrc ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <DefaultAvatarSilhouette className={iconClassName || "w-3/5 h-3/5 text-slate-200/90"} />
      )}
    </div>
  );
}
