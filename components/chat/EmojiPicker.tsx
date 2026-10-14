"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  X,
  Smile,
  User,
  PawPrint,
  Utensils,
  Trophy,
  Plane,
  Lightbulb,
  Heart,
  Flag,
} from "lucide-react";

export interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "smileys",
    name: "Smileys & Emotion",
    icon: Smile,
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "🥹",
      "☺️", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘",
      "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐",
      "🤓", "😎", "🥸", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟",
      "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭",
      "😮‍💨", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱",
      "😨", "😰", "😥", "😓", "🫣", "🤗", "🫡", "🤔", "🫢", "🤫",
      "🤥", "😶", "😶‍🌫️", "😐", "😑", "😬", "🫨", "🫠", "🙄", "😯",
      "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "😵‍💫",
      "🫥", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑",
      "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️",
      "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽"
    ],
  },
  {
    id: "people",
    name: "People & Gestures",
    icon: User,
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "🫵",
      "🫱‍🫲", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙",
      "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊",
      "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️",
      "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃",
      "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄", "🫦",
      "👶", "🧒", "👦", "👧", "🧑", "👱", "👨", "🧔", "👩", "🧓",
      "👴", "👵", "🙍", "🙎", "🙅", "🙆", "💁", "🙋", "🧏", "🙇",
      "🤦", "🤷", "👮", "🕵️", "💂", "🥷", "👷", "🤴", "👸", "👳",
      "👲", "🧕", "🤵", "👰", "🤰", "🤱", "👼", "🎅", "🤶", "🦸",
      "🦹", "🧙", "🧚", "🧛", "🧜", "🧝", "🧞", "🧟", "🧌", "💆"
    ],
  },
  {
    id: "animals",
    name: "Animals & Nature",
    icon: PawPrint,
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨",
      "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊",
      "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉",
      "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌",
      "🐞", "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷️", "🕸️", "🦂",
      "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀",
      "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐆", "🐅",
      "🐃", "🐂", "🐄", "🦭", "🐪", "🐫", "🦙", "🦒", "🐘", "🦣",
      "🦏", "🦛", "🐎", "🐖", "🐏", "🐑", "🐐", "🦌", "🐕", "🐩",
      "🦮", "🐕‍🦺", "🐈", "🐈‍⬛", "🪶", "🐓", "🦃", "🦤", "🦚", "🦜",
      "🦢", "🦩", "🕊️", "🐇", "🦝", "🦨", "🦡", "🦫", "🦦", "🦥",
      "🌸", "💮", "🪷", "🏵️", "🌹", "🥀", "🌺", "🌻", "🌼", "🌷",
      "🌱", "🪴", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "☘️", "🍀"
    ],
  },
  {
    id: "food",
    name: "Food & Drink",
    icon: Utensils,
    emojis: [
      "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐",
      "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑",
      "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅",
      "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳",
      "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔",
      "🍟", "🍕", "🫓", "🥪", "🥙", "🧆", "🌮", "🌯", "🫔", "🥗",
      "🥘", "🫕", "🥫", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟",
      "🦪", "🍤", "🍙", "🍚", "🍘", "🍥", "🥠", "🥮", "🍢", "🍡",
      "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬",
      "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯", "🥛", "🍼", "🫖",
      "☕", "🍵", "🧃", "🥤", "🧋", "🍶", "🍺", "🍻", "🥂", "🍷"
    ],
  },
  {
    id: "activities",
    name: "Activities & Sports",
    icon: Trophy,
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱",
      "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳",
      "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷",
      "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸", "⛹️",
      "🤺", "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🤽", "🚣", "🧗",
      "🚵", "🚴", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎗️",
      "🎫", "🎟️", "🎪", "🤹", "🎭", "🩰", "🎨", "🎬", "🎤", "🎧",
      "🎼", "🎹", "🥁", "🪘", "🎷", "🎺", "🪗", "🎸", "🪕", "🎻",
      "🎲", "♟️", "🎯", "🎳", "🎮", "🎰", "🧩"
    ],
  },
  {
    id: "travel",
    name: "Travel & Places",
    icon: Plane,
    emojis: [
      "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐",
      "🛻", "🚚", "🚛", "🚜", "🛴", "🚲", "🛵", "🏍️", "🛺", "🚨",
      "🚔", "🚍", "🚘", "🚖", "🚡", "🚠", "🚟", "🚃", "🚋", "🚞",
      "🚝", "🚄", "🚅", "🚈", "🚂", "🚆", "🚇", "🚊", "🚉", "✈️",
      "🛫", "🛬", "💺", "🛰️", "🚀", "🛸", "🚁", "🛶", "⛵", "🚤",
      "🛳️", "⛴️", "🚢", "⚓", "🛟", "⛽", "🚧", "🚦", "🚥", "🗺️",
      "🗿", "🗽", "🗼", "🏰", "🏯", "🏟️", "🎡", "🎢", "⛲", "⛱️",
      "🏖️", "🏝️", "🏜️", "🌋", "⛰️", "🏔️", "🏕️", "⛺", "🛖", "🏠",
      "🏡", "🏢", "🏣", "🏤", "🏥", "🏦", "🏨", "🏪", "🏫", "🏛️"
    ],
  },
  {
    id: "objects",
    name: "Objects & Tools",
    icon: Lightbulb,
    emojis: [
      "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🕹️", "💽",
      "💾", "💿", "📀", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞",
      "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "⏱️", "⏲️",
      "⏰", "🕰️", "⌛", "⏳", "📡", "🔋", "🪫", "🔌", "💡", "🔦",
      "🕯️", "🪔", "🧯", "💸", "💵", "💴", "💶", "💷", "🪙", "💰",
      "💳", "💎", "⚖️", "🪜", "🧰", "🔧", "🔨", "⚒️", "🛠️", "⛏️",
      "🔩", "⚙️", "🧱", "⛓️", "🧲", "💣", "🧨", "🪓", "🔪", "🗡️",
      "⚔️", "🛡️", "🔮", "📿", "🧿", "💈", "⚗️", "🔭", "🔬", "🩹",
      "🩺", "💊", "💉", "🩸", "🧬", "🧪", "🧹", "🧺", "🧻", "🚽",
      "🚿", "🛁", "🧼", "🪥", "🪒", "🔑", "🗝️", "🚪", "🪑", "🛏️",
      "🎁", "🎈", "🎏", "🎀", "🪄", "🎊", "🎉", "✉️", "📩", "📦"
    ],
  },
  {
    id: "symbols",
    name: "Symbols & Hearts",
    icon: Heart,
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝",
      "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️",
      "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎",
      "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "📴", "📳",
      "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️",
      "🈴", "🈵", "🈹", "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘",
      "❌", "⭕", "🛑", "⛔", "📛", "🚫", "💯", "💢", "♨️", "🚷",
      "❗️", "❕", "❓", "❔", "‼️", "⁉️", "🔅", "🔆", "⚠️", "🚸",
      "🔱", "⚜️", "🔰", "♻️", "✅", "🈯", "💹", "❇️", "✳️", "❎",
      "🌐", "💠", "💤", "🏧", "🚾", "♿", "🅿️", "🈳", "🚹", "🚺",
      "🚼", "🚻", "🚮", "📶", "🈁", "🆖", "🆗", "🆙", "🆒", "🆕"
    ],
  },
  {
    id: "flags",
    name: "Flags",
    icon: Flag,
    emojis: [
      "🏁", "🚩", "🎌", "🏴", "🏳️", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️", "🇺🇸", "🇬🇧",
      "🇨🇦", "🇦🇺", "🇩🇪", "🇫🇷", "🇯🇵", "🇰🇷", "🇮🇹", "🇪🇸", "🇧🇷", "🇮🇳",
      "🇵🇰", "🇨🇳", "🇷🇺", "🇲🇽", "🇸🇦", "🇦🇪", "🇹🇷", "🇿🇦", "🇳🇬", "🇪🇬",
      "🇮🇩", "🇲🇾", "🇸🇬", "🇻🇳", "🇵🇭", "🇹🇭", "🇳🇿", "🇮🇪", "🇨🇭", "🇸🇪",
      "🇳🇴", "🇩🇰", "🇫🇮", "🇳🇱", "🇧🇪", "🇦🇹", "🇵🇹", "🇬🇷", "🇵🇱", "🇺🇦",
      "🇦🇷", "🇨🇱", "🇨🇴", "🇵🇪", "🇶🇦", "🇰🇼", "🇧🇭", "🇴🇲", "🇯🇴", "🇱🇧"
    ],
  },
];

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelectEmoji, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>("smileys");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // All emojis flat list for search
  const allEmojis = useMemo(() => {
    return EMOJI_CATEGORIES.flatMap((c) => c.emojis);
  }, []);

  // Filtered emojis based on search or active tab
  const displayedEmojis = useMemo(() => {
    if (searchQuery.trim()) {
      return allEmojis.filter((e) => e.includes(searchQuery.trim()));
    }
    const cat = EMOJI_CATEGORIES.find((c) => c.id === activeCategory);
    return cat ? cat.emojis : EMOJI_CATEGORIES[0].emojis;
  }, [searchQuery, activeCategory, allEmojis]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-30"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-16 left-2 sm:left-4 z-40 w-[320px] sm:w-[360px] h-[380px] bg-[#053b53] border border-[#4D8DBA]/60 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 backdrop-blur-2xl select-none"
      >
        {/* Search Header */}
        <div className="p-3 pb-2 border-b border-[#4D8DBA]/35 bg-[#086288]/80 flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-[#97D7FF] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emoji..."
              className="w-full bg-[#032433] border border-[#4D8DBA]/40 rounded-full pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#97D7FF]"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-[#4D8DBA]/30 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Header Label */}
        <div className="px-3.5 py-1.5 bg-[#086288]/40 border-b border-[#4D8DBA]/20 flex items-center justify-between text-[11px] font-semibold text-[#FFEFC4]">
          <span>
            {searchQuery.trim()
              ? `Search Results (${displayedEmojis.length})`
              : EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.name || "Emojis"}
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            Click to insert
          </span>
        </div>

        {/* Emojis Grid */}
        <div className="flex-1 overflow-y-auto p-2.5 grid grid-cols-7 sm:grid-cols-8 gap-1.5 content-start scrollbar-thin">
          {displayedEmojis.length > 0 ? (
            displayedEmojis.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                type="button"
                onClick={() => onSelectEmoji(emoji)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl hover:bg-[#4D8DBA]/40 flex items-center justify-center text-xl hover:scale-125 transition-transform duration-100 cursor-pointer select-none active:scale-95"
                title={emoji}
              >
                {emoji}
              </button>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-xs text-slate-400">
              No emojis found
            </div>
          )}
        </div>

        {/* Category Tabs (WhatsApp Web Bottom Navigation) */}
        {!searchQuery && (
          <div className="px-2 py-1.5 bg-[#086288] border-t border-[#4D8DBA]/35 flex items-center justify-between shrink-0">
            {EMOJI_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`p-1.5 rounded-xl transition cursor-pointer ${
                    isActive
                      ? "bg-[#97D7FF] text-[#086288] shadow-md scale-105"
                      : "text-slate-300 hover:text-white hover:bg-[#4D8DBA]/30"
                  }`}
                  title={cat.name}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </>
  );
}
