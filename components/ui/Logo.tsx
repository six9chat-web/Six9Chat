import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  showText?: boolean;
  layout?: "horizontal" | "vertical";
  className?: string;
  textClassName?: string;
}

export function Logo({
  size = 40,
  showText = true,
  layout = "horizontal",
  className,
  textClassName,
}: LogoProps) {
  return (
    <div
      className={cn(
        "flex items-center select-none",
        layout === "vertical" ? "flex-col gap-2.5 text-center" : "flex-row gap-3",
        className
      )}
    >
      {/* SVG Brand Mark */}
      <div
        className="relative shrink-0 flex items-center justify-center transition-transform duration-300 hover:scale-105"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_16px_rgba(77,141,186,0.4)]"
        >
          <defs>
            {/* Outer Ring Gradient */}
            <linearGradient id="six9RingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#086288" />
              <stop offset="35%" stopColor="#4D8DBA" />
              <stop offset="75%" stopColor="#97D7FF" />
              <stop offset="100%" stopColor="#FFEFC4" />
            </linearGradient>

            {/* Inner Ribbon Gradient */}
            <linearGradient id="six9RibbonGrad" x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor="#086288" />
              <stop offset="50%" stopColor="#4D8DBA" />
              <stop offset="100%" stopColor="#97D7FF" />
            </linearGradient>

            {/* Chat Bubble Gradient */}
            <linearGradient id="six9BubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4D8DBA" />
              <stop offset="100%" stopColor="#97D7FF" />
            </linearGradient>

            {/* Ambient Glow Filter */}
            <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Circular Gradient Ring */}
          <circle
            cx="100"
            cy="100"
            r="82"
            stroke="url(#six9RingGrad)"
            strokeWidth="13"
            strokeLinecap="round"
          />

          {/* Left Chat Bubble Accent */}
          <path
            d="M87 56 C82 56 78 60 78 65 C78 67 79 69 80 70 L77 76 L84 73 C85 74 86 74 87 74 C92 74 96 70 96 65 C96 60 92 56 87 56 Z"
            fill="url(#six9BubbleGrad)"
            opacity="0.95"
          />

          {/* Right Chat Bubble Accent */}
          <path
            d="M109 61 C105 61 102 64 102 68 C102 70 103 71.5 104 72.5 L102 77 L107 75 C107.8 75.2 108.4 75.3 109 75.3 C113 75.3 116 72 116 68 C116 64 113 61 109 61 Z"
            fill="url(#six9BubbleGrad)"
            opacity="0.9"
          />

          {/* Ribbon 'S' Shape (Left Loop & Outer Flow) */}
          <path
            d="M 94 88
               C 85 86, 70 88, 68 100
               C 66 110, 84 113, 94 118
               C 104 123, 103 134, 95 139
               C 86 144, 71 141, 64 130
               C 56 119, 58 101, 69 89
               C 76 81, 88 77, 98 83"
            stroke="url(#six9RibbonGrad)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Ribbon '9' Shape (Right Loop & Downward Stem) */}
          <path
            d="M 98 116
               C 106 113, 126 108, 127 94
               C 128 83, 114 78, 104 84
               C 95 89, 97 101, 107 105
               C 118 109, 128 111, 124 125
               C 120 137, 108 149, 90 152
               C 80 154, 70 150, 64 142"
            stroke="url(#six9RibbonGrad)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className={cn("flex flex-col", textClassName)}>
          <div className="flex items-center">
            <span className="font-extrabold tracking-tight text-white text-xl sm:text-2xl">
              Six<span className="text-[#97D7FF]">9</span>Chat
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
