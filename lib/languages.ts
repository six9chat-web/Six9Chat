export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  countryCode?: string;
  direction?: "ltr" | "rtl";
}

/**
 * Extracts 2-letter ISO country code from regional indicator flag emoji pairs (e.g. 🇬🇧 -> gb, 🇵🇰 -> pk)
 */
export function getCountryCodeFromFlag(flagEmoji: string): string {
  if (!flagEmoji) return "";
  const codePoints = Array.from(flagEmoji).map((c) => c.codePointAt(0) || 0);
  if (codePoints.length >= 2 && codePoints[0] >= 0x1F1E6 && codePoints[0] <= 0x1F1FF) {
    const first = String.fromCharCode(codePoints[0] - 0x1F1E6 + 65);
    const second = String.fromCharCode(codePoints[1] - 0x1F1E6 + 65);
    return `${first}${second}`.toLowerCase();
  }
  return "";
}

export const LANGUAGES: Language[] = [
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans", flag: "🇿🇦", direction: "ltr" },
  { code: "sq", name: "Albanian", nativeName: "Shqip", flag: "🇦🇱", direction: "ltr" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ", flag: "🇪🇹", direction: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", direction: "rtl" },
  { code: "hy", name: "Armenian", nativeName: "Հայերեն", flag: "🇦🇲", direction: "ltr" },
  { code: "az", name: "Azerbaijani", nativeName: "Azərbaycan dili", flag: "🇦🇿", direction: "ltr" },
  { code: "eu", name: "Basque", nativeName: "Euskara", flag: "🇪🇸", direction: "ltr" },
  { code: "be", name: "Belarusian", nativeName: "Беларуская", flag: "🇧🇾", direction: "ltr" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩", direction: "ltr" },
  { code: "bs", name: "Bosnian", nativeName: "Bosanski", flag: "🇧🇦", direction: "ltr" },
  { code: "bg", name: "Bulgarian", nativeName: "Български", flag: "🇧🇬", direction: "ltr" },
  { code: "my", name: "Burmese", nativeName: "မြန်မာစာ", flag: "🇲🇲", direction: "ltr" },
  { code: "ca", name: "Catalan", nativeName: "Català", flag: "🇪🇸", direction: "ltr" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文", flag: "🇨🇳", direction: "ltr" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文", flag: "🇹🇼", direction: "ltr" },
  { code: "hr", name: "Croatian", nativeName: "Hrvatski", flag: "🇭🇷", direction: "ltr" },
  { code: "cs", name: "Czech", nativeName: "Čeština", flag: "🇨🇿", direction: "ltr" },
  { code: "da", name: "Danish", nativeName: "Dansk", flag: "🇩🇰", direction: "ltr" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱", direction: "ltr" },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧", direction: "ltr" },
  { code: "et", name: "Estonian", nativeName: "Eesti", flag: "🇪🇪", direction: "ltr" },
  { code: "fil", name: "Filipino", nativeName: "Filipino", flag: "🇵🇭", direction: "ltr" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", flag: "🇫🇮", direction: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", direction: "ltr" },
  { code: "gl", name: "Galician", nativeName: "Galego", flag: "🇪🇸", direction: "ltr" },
  { code: "ka", name: "Georgian", nativeName: "ქართული", flag: "🇬🇪", direction: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", direction: "ltr" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷", direction: "ltr" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳", direction: "ltr" },
  { code: "he", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱", direction: "rtl" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", direction: "ltr" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", flag: "🇭🇺", direction: "ltr" },
  { code: "is", name: "Icelandic", nativeName: "Íslenska", flag: "🇮🇸", direction: "ltr" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩", direction: "ltr" },
  { code: "ga", name: "Irish", nativeName: "Gaeilge", flag: "🇮🇪", direction: "ltr" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹", direction: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", direction: "ltr" },
  { code: "jv", name: "Javanese", nativeName: "Basa Jawa", flag: "🇮🇩", direction: "ltr" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳", direction: "ltr" },
  { code: "kk", name: "Kazakh", nativeName: "Қазақ тілі", flag: "🇰🇿", direction: "ltr" },
  { code: "km", name: "Khmer", nativeName: "ភាសាខ្មែរ", flag: "🇰🇭", direction: "ltr" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", direction: "ltr" },
  { code: "ckb", name: "Kurdish (Sorani)", nativeName: "کوردی", flag: "🇮🇶", direction: "rtl" },
  { code: "ky", name: "Kyrgyz", nativeName: "Кыргызча", flag: "🇰🇬", direction: "ltr" },
  { code: "lo", name: "Lao", nativeName: "ພາສາລາວ", flag: "🇱🇦", direction: "ltr" },
  { code: "lv", name: "Latvian", nativeName: "Latviešu", flag: "🇱🇻", direction: "ltr" },
  { code: "lt", name: "Lithuanian", nativeName: "Lietuvių", flag: "🇱🇹", direction: "ltr" },
  { code: "mk", name: "Macedonian", nativeName: "Македонски", flag: "🇲🇰", direction: "ltr" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾", direction: "ltr" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳", direction: "ltr" },
  { code: "mt", name: "Maltese", nativeName: "Malti", flag: "🇲🇹", direction: "ltr" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳", direction: "ltr" },
  { code: "mn", name: "Mongolian", nativeName: "Монгол хэл", flag: "🇲🇳", direction: "ltr" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", flag: "🇳🇵", direction: "ltr" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴", direction: "ltr" },
  { code: "ps", name: "Pashto", nativeName: "پښتو", flag: "🇦🇫", direction: "rtl" },
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷", direction: "rtl" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱", direction: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷", direction: "ltr" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ / پنجابی", flag: "🇵🇰", direction: "ltr" },
  { code: "ro", name: "Romanian", nativeName: "Română", flag: "🇷🇴", direction: "ltr" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", direction: "ltr" },
  { code: "sr", name: "Serbian", nativeName: "Српски", flag: "🇷🇸", direction: "ltr" },
  { code: "sd", name: "Sindhi", nativeName: "سنڌي", flag: "🇵🇰", direction: "rtl" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල", flag: "🇱🇰", direction: "ltr" },
  { code: "sk", name: "Slovak", nativeName: "Slovenčina", flag: "🇸🇰", direction: "ltr" },
  { code: "sl", name: "Slovenian", nativeName: "Slovenščina", flag: "🇸🇮", direction: "ltr" },
  { code: "so", name: "Somali", nativeName: "Soomaali", flag: "🇸🇴", direction: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", direction: "ltr" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", flag: "🇰🇪", direction: "ltr" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪", direction: "ltr" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳", direction: "ltr" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳", direction: "ltr" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭", direction: "ltr" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷", direction: "ltr" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦", direction: "ltr" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰", direction: "rtl" },
  { code: "uz", name: "Uzbek", nativeName: "Oʻzbekcha", flag: "🇺🇿", direction: "ltr" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳", direction: "ltr" },
  { code: "cy", name: "Welsh", nativeName: "Cymraeg", flag: "🇬🇧", direction: "ltr" },
  { code: "zu", name: "Zulu", nativeName: "isiZulu", flag: "🇿🇦", direction: "ltr" },
];

export const DEFAULT_LANGUAGE: Language =
  LANGUAGES.find((lang) => lang.code === "en") || LANGUAGES[0];

export type TranslationKey =
  | "welcome"
  | "welcomeBack"
  | "signIn"
  | "signUp"
  | "createAccount"
  | "signInSubtitle"
  | "signUpSubtitle"
  | "username"
  | "usernamePlaceholder"
  | "passcode"
  | "passcodePlaceholder"
  | "fullName"
  | "fullNamePlaceholder"
  | "email"
  | "emailPlaceholder"
  | "continue"
  | "needAccount"
  | "alreadyHaveAccount"
  | "all"
  | "unread"
  | "pinned"
  | "groups"
  | "communities"
  | "searchNameOrUsername"
  | "newChat"
  | "newGroup"
  | "createGroupDesc"
  | "contactsOnSix9Chat"
  | "noActiveChats"
  | "noActiveChatsDesc"
  | "noMatchingContacts"
  | "noMatchingContactsDesc"
  | "clickForContactInfo"
  | "typing"
  | "online"
  | "offline"
  | "onlineNow"
  | "typeMessage"
  | "send"
  | "videoCall"
  | "voiceCall"
  | "searchInChat"
  | "chatRequests"
  | "noPendingRequests"
  | "noPendingRequestsDesc"
  | "accept"
  | "decline"
  | "pending"
  | "request"
  | "requested"
  | "chat"
  | "delete"
  | "remove"
  | "settings"
  | "profile"
  | "profileSettings"
  | "signOut"
  | "saveChanges"
  | "statusAbout"
  | "language"
  | "selectLanguage"
  | "chooseCountry"
  | "enterPhone"
  | "next"
  | "verifyPhone"
  | "enterOtp"
  | "resendCode"
  | "profileInfo"
  | "typeName"
  | "about"
  | "finishSetup"
  | "searchUsers"
  | "searching"
  | "noUsersFound";

import { ALL_TRANSLATIONS } from "./allTranslations";

export const TRANSLATIONS: Record<string, Record<string, string>> = ALL_TRANSLATIONS;

