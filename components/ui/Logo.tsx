import React from "react";
import Image from "next/image";
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
      {/* Custom S9 Circular Brand Logo */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-[#086288] via-[#4D8DBA] to-[#97D7FF] shadow-[0_4px_18px_rgba(77,141,186,0.45)] transition-transform duration-300 hover:scale-105"
        style={{ width: size, height: size }}
      >
        <Image
          src="/s9-logo.jpg"
          alt="Six9Chat Logo"
          width={size}
          height={size}
          priority
          className="w-full h-full object-cover rounded-full"
        />
      </div>

      {/* Typography */}
      {showText && (
        <div className={cn("flex flex-col", textClassName)}>
          <div className="flex items-center">
            <span className="font-extrabold tracking-tight text-white text-xl sm:text-2xl drop-shadow-sm">
              Six<span className="text-[#97D7FF]">9</span>Chat
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
