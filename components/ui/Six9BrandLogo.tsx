"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Six9BrandLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export function Six9BrandLogo({
  size = 80,
  className,
  glow = false,
}: Six9BrandLogoProps) {
  return (
    <div
      className={cn("relative flex items-center justify-center select-none", className)}
      style={{ width: size, height: size }}
    >
      {glow && (
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.35, 0.6, 0.35],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -inset-2.5 rounded-full bg-gradient-to-tr from-[#086288]/40 via-[#4D8DBA]/35 to-[#97D7FF]/35 blur-xl pointer-events-none"
        />
      )}

      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_8px_24px_rgba(8,98,136,0.45)]"
      >
        <defs>
          <linearGradient id="brandRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#086288" />
            <stop offset="35%" stopColor="#4D8DBA" />
            <stop offset="75%" stopColor="#97D7FF" />
            <stop offset="100%" stopColor="#FFEFC4" />
          </linearGradient>

          <linearGradient id="brandRibbonGrad" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#086288" />
            <stop offset="50%" stopColor="#4D8DBA" />
            <stop offset="100%" stopColor="#97D7FF" />
          </linearGradient>

          <linearGradient id="brandBubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4D8DBA" />
            <stop offset="100%" stopColor="#97D7FF" />
          </linearGradient>
        </defs>

        {/* Ambient Outer Ring */}
        <circle
          cx="100"
          cy="100"
          r="82"
          stroke="url(#brandRingGrad)"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Left Chat Bubble Accent */}
        <path
          d="M87 56 C82 56 78 60 78 65 C78 67 79 69 80 70 L77 76 L84 73 C85 74 86 74 87 74 C92 74 96 70 96 65 C96 60 92 56 87 56 Z"
          fill="url(#brandBubbleGrad)"
          opacity="0.95"
        />

        {/* Right Chat Bubble Accent */}
        <path
          d="M109 61 C105 61 102 64 102 68 C102 70 103 71.5 104 72.5 L102 77 L107 75 C107.8 75.2 108.4 75.3 109 75.3 C113 75.3 116 72 116 68 C116 64 113 61 109 61 Z"
          fill="url(#brandBubbleGrad)"
          opacity="0.9"
        />

        {/* Ribbon '6' Shape */}
        <path
          d="M 94 88
             C 85 86, 70 88, 68 100
             C 66 110, 84 113, 94 118
             C 104 123, 103 134, 95 139
             C 86 144, 71 141, 64 130
             C 56 119, 58 101, 69 89
             C 76 81, 88 77, 98 83"
          stroke="url(#brandRibbonGrad)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Ribbon '9' Shape */}
        <path
          d="M 98 116
             C 106 113, 126 108, 127 94
             C 128 83, 114 78, 104 84
             C 95 89, 97 101, 107 105
             C 118 109, 128 111, 124 125
             C 120 137, 108 149, 90 152
             C 80 154, 70 150, 64 142"
          stroke="url(#brandRibbonGrad)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
