"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { LANGUAGES, Language, getCountryCodeFromFlag } from "@/lib/languages";
import { useLanguage } from "@/lib/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

interface LanguageSelectorProps {
  selectedLanguage?: Language;
  onSelect?: (language: Language) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

export function LanguageSelector({
  selectedLanguage: propSelectedLanguage,
  onSelect: propOnSelect,
  disabled = false,
  compact = false,
  className = "",
}: LanguageSelectorProps) {
  const { language: contextLanguage, setLanguage: contextSetLanguage } = useLanguage();

  const currentSelected = propSelectedLanguage || contextLanguage;

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (lang: Language) => {
    // Immediate state updates for instant response
    setIsOpen(false);
    setSearch("");
    if (propOnSelect) {
      propOnSelect(lang);
    }
    contextSetLanguage(lang);
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredLanguages = LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(search.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      lang.code.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCountryCode = getCountryCodeFromFlag(currentSelected.flag);

  return (
    <div
      className={`relative ${compact ? "w-auto" : "w-full"} ${className}`}
      style={{ zIndex: isOpen ? 9999 : 30 }}
      ref={dropdownRef}
      onMouseDown={(e) => {
        // Stop bubbling so outside-click doesn't prematurely dismiss
        e.stopPropagation();
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`rounded-2xl bg-[#053b53] border border-[#4D8DBA]/50 hover:border-[#97D7FF] focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] flex items-center justify-between text-slate-100 transition outline-none disabled:opacity-50 cursor-pointer shadow-sm select-none ${
          compact
            ? "h-10 px-3 gap-2 text-xs"
            : "w-full h-12 px-4 gap-3 text-sm"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex items-center justify-center w-6 h-4 overflow-hidden rounded-[3px] border border-white/20 shadow-xs bg-[#086288] shrink-0 select-none">
            <img
              src={`https://flagcdn.com/w40/${selectedCountryCode}.png`}
              alt={currentSelected.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </span>
          <span className="font-semibold text-white truncate max-w-[140px] text-left">
            {currentSelected.name}
          </span>
          {!compact && (
            <span className="text-xs text-[#97D7FF]/90 font-medium shrink-0">
              ({currentSelected.nativeName})
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-300 transition-transform duration-150 shrink-0 ${
            isOpen ? "rotate-180 text-[#97D7FF]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu with absolute highest z-index 9999 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            style={{ zIndex: 9999 }}
            onMouseDown={(e) => e.stopPropagation()}
            className={`absolute top-full mt-2 bg-[#086288] border border-[#4D8DBA]/70 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden backdrop-blur-2xl ring-1 ring-[#97D7FF]/40 ${
              compact ? "right-0 w-72" : "left-0 right-0"
            }`}
          >
            {/* Search Input */}
            <div className="p-3 border-b border-[#4D8DBA]/35 bg-[#086288]">
              <div className="relative flex items-center bg-[#053b53] rounded-xl px-3 py-2 border border-[#4D8DBA]/50 focus-within:border-[#97D7FF] transition">
                <Search className="w-4 h-4 text-[#4D8DBA] mr-2.5 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="Search among 70+ languages..."
                  className="w-full bg-transparent text-xs text-white placeholder-slate-300 outline-none"
                />
              </div>
            </div>

            {/* List of Languages */}
            <div className="max-h-72 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {filteredLanguages.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-300">
                  No language found
                </div>
              ) : (
                filteredLanguages.map((lang) => {
                  const isSelected = lang.code === currentSelected.code;
                  const langCountryCode = getCountryCodeFromFlag(lang.flag);
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(lang);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition cursor-pointer select-none text-left active:scale-[0.99] ${
                        isSelected
                          ? "bg-[#97D7FF]/25 text-[#FFEFC4] font-bold ring-1 ring-[#97D7FF]/40"
                          : "text-slate-200 hover:bg-[#4D8DBA]/35 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="inline-flex items-center justify-center w-6 h-4 overflow-hidden rounded-[3px] border border-white/20 shadow-xs bg-[#053b53] shrink-0 select-none">
                          <img
                            src={`https://flagcdn.com/w40/${langCountryCode}.png`}
                            alt={lang.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </span>
                        <span className="font-medium text-white truncate">
                          {lang.name}
                        </span>
                        <span className="text-slate-300 text-[11px] shrink-0">
                          ({lang.nativeName})
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#FFEFC4] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
