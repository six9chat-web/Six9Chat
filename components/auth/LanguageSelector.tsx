"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { LANGUAGES, Language, getCountryCodeFromFlag } from "@/lib/languages";
import { motion, AnimatePresence } from "framer-motion";

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onSelect: (language: Language) => void;
  disabled?: boolean;
}

export function LanguageSelector({
  selectedLanguage,
  onSelect,
  disabled = false,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
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

  const selectedCountryCode = getCountryCodeFromFlag(selectedLanguage.flag);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-12 px-4 rounded-2xl bg-[#053b53] border border-[#4D8DBA]/50 hover:border-[#97D7FF] focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] flex items-center justify-between text-sm text-slate-100 transition outline-none disabled:opacity-50"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center justify-center w-7 h-4.5 overflow-hidden rounded-[3px] border border-white/20 shadow-xs bg-[#086288] shrink-0 select-none">
            <img
              src={`https://flagcdn.com/w40/${selectedCountryCode}.png`}
              alt={selectedLanguage.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </span>
          <span className="font-semibold text-white text-sm truncate">{selectedLanguage.name}</span>
          <span className="text-xs text-[#97D7FF]/90 font-medium shrink-0">({selectedLanguage.nativeName})</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-[#97D7FF]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#086288] border border-[#4D8DBA]/70 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl"
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
                  const isSelected = lang.code === selectedLanguage.code;
                  const langCountryCode = getCountryCodeFromFlag(lang.flag);
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onSelect(lang);
                        setIsOpen(false);
                        setSearch("");
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition ${
                        isSelected
                          ? "bg-[#97D7FF]/25 text-[#FFEFC4] font-bold"
                          : "text-slate-200 hover:bg-[#4D8DBA]/30 hover:text-white"
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
                        <span className="font-medium text-white truncate">{lang.name}</span>
                        <span className="text-slate-300 text-[11px] shrink-0">({lang.nativeName})</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#FFEFC4] shrink-0" />}
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
