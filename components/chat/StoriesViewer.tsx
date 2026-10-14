"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { StoryItem } from "@/types/chat";

interface StoriesViewerProps {
  stories: StoryItem[];
  activeStory: StoryItem | null;
  onClose: () => void;
}

export function StoriesViewer({
  stories,
  activeStory,
  onClose,
}: StoriesViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (activeStory) {
      const idx = stories.findIndex((s) => s.id === activeStory.id);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });
  const [progress, setProgress] = useState(0);

  // Sync index when activeStory changes
  const [prevStoryId, setPrevStoryId] = useState(activeStory?.id);
  if (activeStory && activeStory.id !== prevStoryId) {
    setPrevStoryId(activeStory.id);
    const idx = stories.findIndex((s) => s.id === activeStory.id);
    if (idx >= 0) setCurrentIndex(idx);
    setProgress(0);
  }

  // Story auto-advancement timer (5 seconds)
  useEffect(() => {
    if (!activeStory) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((i) => i + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, stories.length, activeStory, onClose]);

  if (!activeStory) return null;

  const current = stories[currentIndex] || stories[0];

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md h-[580px] bg-[#086288] rounded-3xl overflow-hidden border border-[#4D8DBA]/60 shadow-2xl flex flex-col justify-between p-4"
        >
          {/* Progress Bars for all stories */}
          <div className="flex items-center gap-1.5 w-full z-20">
            {stories.map((s, i) => (
              <div
                key={s.id}
                className="flex-1 h-1 bg-[#053b53] rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-gradient-to-r from-[#4D8DBA] to-[#97D7FF] transition-all"
                  style={{
                    width:
                      i < currentIndex
                        ? "100%"
                        : i === currentIndex
                        ? `${progress}%`
                        : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* User Header */}
          <div className="flex items-center justify-between mt-2 z-20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#086288] to-[#97D7FF] flex items-center justify-center font-bold text-xs text-white shadow-md overflow-hidden">
                {current.userAvatar && (current.userAvatar.startsWith("http") || current.userAvatar.startsWith("data:")) ? (
                  <img src={current.userAvatar} alt={current.userName} className="w-full h-full object-cover" />
                ) : (
                  current.userAvatar
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">
                  {current.userName}
                </span>
                <span className="text-[10px] text-slate-300">
                  {current.timestamp}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Story Content & Decorative Canvas */}
          <div className="my-auto flex flex-col items-center justify-center text-center p-6 relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#086288] via-[#4D8DBA] to-[#97D7FF] flex items-center justify-center shadow-2xl mb-6">
              <Sparkles className="w-10 h-10 text-[#FFEFC4]" />
            </div>

            <p className="text-base sm:text-lg font-medium text-white leading-relaxed">
              &ldquo;{current.caption}&rdquo;
            </p>
          </div>

          {/* Left/Right Click Navigators */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white z-20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Bottom indicator */}
          <div className="text-center pb-2 z-20">
            <span className="text-[11px] text-[#97D7FF]">
              Six9Chat Real-Time Stories
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
