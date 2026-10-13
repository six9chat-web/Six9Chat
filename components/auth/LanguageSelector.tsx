"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check, Search } from "lucide-react";
import { LANGUAGES, Language } from "@/lib/languages";
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

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-12 px-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] flex items-center justify-between text-sm text-slate-100 transition outline-none disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-[#1DB980] shrink-0" />
          <span className="text-lg">{selectedLanguage.flag}</span>
          <span className="font-semibold text-white">{selectedLanguage.name}</span>
          <span className="text-xs text-slate-400">({selectedLanguage.nativeName})</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#1DB980]" : ""
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
            className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#0F172A] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-slate-800 bg-slate-900/80">
              <div className="relative flex items-center bg-slate-800/90 rounded-xl px-3 py-2 border border-slate-700/80 focus-within:border-[#1DB980] transition">
                <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search language..."
                  className="w-full bg-transparent text-xs text-white placeholder-slate-400 outline-none"
                />
              </div>
            </div>

            {/* List of Languages */}
            <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {filteredLanguages.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No language found
                </div>
              ) : (
                filteredLanguages.map((lang) => {
                  const isSelected = lang.code === selectedLanguage.code;
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
                          ? "bg-[#1DB980]/20 text-[#1DB980] font-semibold"
                          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{lang.flag}</span>
                        <span className="font-medium text-white">{lang.name}</span>
                        <span className="text-slate-400 text-[11px]">({lang.nativeName})</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#1DB980]" />}
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
