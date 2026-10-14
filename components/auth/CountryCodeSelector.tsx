"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, Globe } from "lucide-react";
import { COUNTRIES, Country } from "@/lib/countries";
import { motion, AnimatePresence } from "framer-motion";

interface CountryCodeSelectorProps {
  selectedCountry: Country;
  onSelect: (country: Country) => void;
  disabled?: boolean;
  variant?: "compact" | "full";
}

export function CountryCodeSelector({
  selectedCountry,
  onSelect,
  disabled = false,
  variant = "compact",
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
    <div className={`relative ${variant === "full" ? "w-full" : ""}`} ref={dropdownRef}>
      {/* Trigger Button */}
      {variant === "full" ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full h-12 px-4 rounded-2xl bg-[#053b53] border border-[#4D8DBA]/50 hover:border-[#97D7FF] focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] flex items-center justify-between text-sm transition outline-none disabled:opacity-50"
          title="Choose a country"
        >
          <div className="flex items-center gap-3 truncate">
            <span className="inline-flex items-center justify-center w-7 h-4.5 overflow-hidden rounded-[3px] border border-white/20 shadow-xs bg-[#086288] shrink-0 select-none">
              <img
                src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
                alt={selectedCountry.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </span>
            <span className="font-semibold text-white tracking-wide truncate">
              {selectedCountry.name}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="font-mono text-[#FFEFC4] font-semibold text-xs">
              {selectedCountry.dial_code}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-300 transition-transform duration-200 ${
                isOpen ? "rotate-180 text-[#97D7FF]" : ""
              }`}
            />
          </div>
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className="h-11 px-3 rounded-xl bg-[#053b53] border border-[#4D8DBA]/50 hover:border-[#97D7FF] focus:border-[#97D7FF] focus:ring-1 focus:ring-[#97D7FF] flex items-center gap-2 text-xs font-medium text-slate-200 transition outline-none disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          title="Select Country Dial Code"
        >
          <span className="inline-flex items-center justify-center w-5 h-3.5 overflow-hidden rounded-[2px] border border-white/20 shrink-0 select-none">
            <img
              src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`}
              alt={selectedCountry.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </span>
          <span className="font-semibold text-[#FFEFC4] tracking-wide">
            {selectedCountry.dial_code}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#97D7FF]" : ""
            }`}
          />
        </button>
      )}

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute top-full left-0 z-50 bg-[#086288] border border-[#4D8DBA]/70 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl mt-1.5 ${
              variant === "full" ? "right-0 w-full" : "w-72 max-w-[90vw]"
            }`}
          >
            {/* Search Input Bar */}
            <div className="p-3 border-b border-[#4D8DBA]/35 bg-[#086288]">
              <div className="relative flex items-center bg-[#053b53] rounded-xl px-3 py-2 border border-[#4D8DBA]/50 focus-within:border-[#97D7FF] transition">
                <Search className="w-4 h-4 text-[#4D8DBA] mr-2.5 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country or code..."
                  className="w-full bg-transparent text-xs text-white placeholder-slate-300 outline-none"
                />
              </div>
            </div>

            {/* List of Countries */}
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
              {filteredCountries.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-300">
                  <Globe className="w-5 h-5 mx-auto mb-1 text-[#4D8DBA] opacity-60" />
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
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition ${
                        isSelected
                          ? "bg-[#97D7FF]/25 text-[#FFEFC4] font-bold"
                          : "text-slate-200 hover:bg-[#4D8DBA]/30 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className="inline-flex items-center justify-center w-6 h-4 overflow-hidden rounded-[3px] border border-white/20 shadow-xs bg-[#053b53] shrink-0 select-none">
                          <img
                            src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                            alt={country.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </span>
                        <span className="truncate">{country.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2 font-mono text-[11px] text-[#97D7FF]">
                        <span>{country.dial_code}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#FFEFC4]" />}
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
