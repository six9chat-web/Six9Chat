"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, Globe } from "lucide-react";
import { COUNTRIES, Country } from "@/lib/countries";
import { motion, AnimatePresence } from "framer-motion";

interface CountryCodeSelectorProps {
  selectedCountry: Country;
  onSelect: (country: Country) => void;
  disabled?: boolean;
}

export function CountryCodeSelector({
  selectedCountry,
  onSelect,
  disabled = false,
}: CountryCodeSelectorProps) {
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
      // Auto-focus search input
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial_code.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-11 px-3 rounded-xl bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 focus:border-[#1DB980] focus:ring-1 focus:ring-[#1DB980] flex items-center gap-2 text-xs font-medium text-slate-200 transition outline-none disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        title="Select Country Dial Code"
      >
        <span className="text-base select-none">{selectedCountry.flag}</span>
        <span className="font-semibold text-white tracking-wide">
          {selectedCountry.dial_code}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
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
            className="absolute top-full left-0 mt-1.5 w-72 max-w-[90vw] z-50 bg-[#0F172A] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl"
          >
            {/* Search Input Bar */}
            <div className="p-2.5 border-b border-slate-800 bg-slate-900/80">
              <div className="relative flex items-center bg-slate-800/90 rounded-xl px-2.5 py-1.5 border border-slate-700/80 focus-within:border-[#1DB980] transition">
                <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country or code..."
                  className="w-full bg-transparent text-xs text-white placeholder-slate-400 outline-none"
                />
              </div>
            </div>

            {/* List of Countries */}
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
              {filteredCountries.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <Globe className="w-5 h-5 mx-auto mb-1 text-slate-400 opacity-60" />
                  No country found
                </div>
              ) : (
                filteredCountries.map((country) => {
                  const isSelected = country.code === selectedCountry.code;
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => {
                        onSelect(country);
                        setIsOpen(false);
                        setSearch("");
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                        isSelected
                          ? "bg-[#1DB980]/15 text-[#1DB980] font-semibold"
                          : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-base select-none">{country.flag}</span>
                        <span className="truncate">{country.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2 font-mono text-[11px] text-slate-400">
                        <span>{country.dial_code}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#1DB980]" />}
                      </div>
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
