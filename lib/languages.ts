export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction?: "ltr" | "rtl";
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧", direction: "ltr" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰", direction: "rtl" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", direction: "rtl" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", direction: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", direction: "ltr" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", direction: "ltr" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷", direction: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", direction: "ltr" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳", direction: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷", direction: "ltr" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", direction: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", direction: "ltr" },
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷", direction: "rtl" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩", direction: "ltr" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩", direction: "ltr" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹", direction: "ltr" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱", direction: "ltr" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", direction: "ltr" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾", direction: "ltr" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳", direction: "ltr" },
];

export const DEFAULT_LANGUAGE = LANGUAGES[0]; // English

// Localized strings for the onboarding flow
export const TRANSLATIONS: Record<string, {
  welcome: string;
  selectLanguage: string;
  chooseCountry: string;
  enterPhone: string;
  next: string;
  verifyPhone: string;
  enterOtp: string;
  resendCode: string;
  profileInfo: string;
  typeName: string;
  about: string;
  finishSetup: string;
  welcomeBack: string;
}> = {
  en: {
    welcome: "Welcome to Six9Chat",
    selectLanguage: "Choose your language to get started",
    chooseCountry: "Choose your country",
    enterPhone: "Enter your phone number",
    next: "Next",
    verifyPhone: "Verify your phone number",
    enterOtp: "Enter 6-digit verification code",
    resendCode: "Resend Code",
    profileInfo: "Profile Info",
    typeName: "Type your name",
    about: "About",
    finishSetup: "Finish Setup",
    welcomeBack: "Welcome back!",
  },
  ur: {
    welcome: "سکس نائن چیٹ میں خوش آمدید",
    selectLanguage: "شروع کرنے کے لیے اپنی زبان منتخب کریں",
    chooseCountry: "اپنا ملک منتخب کریں",
    enterPhone: "اپنا فون نمبر درج کریں",
    next: "اگلا",
    verifyPhone: "اپنے فون نمبر کی تصدیق کریں",
    enterOtp: "6 ہندسوں کا کوڈ درج کریں",
    resendCode: "کوڈ دوبارہ بھیجیں",
    profileInfo: "پروفائل کی معلومات",
    typeName: "اپنا نام لکھیں",
    about: "کے بارے میں",
    finishSetup: "سیٹ اپ مکمل کریں",
    welcomeBack: "دوبارہ خوش آمدید!",
  },
  ar: {
    welcome: "مرحباً بك في Six9Chat",
    selectLanguage: "اختر لغتك للبدء",
    chooseCountry: "اختر دولتك",
    enterPhone: "أدخل رقم هاتفك",
    next: "التالي",
    verifyPhone: "تأكيد رقم هاتفك",
    enterOtp: "أدخل رمز التحقق المكون من 6 أرقام",
    resendCode: "إعادة إرسال الرمز",
    profileInfo: "معلومات الملف الشخصي",
    typeName: "اكتب اسمك",
    about: "حول",
    finishSetup: "إنهاء الإعداد",
    welcomeBack: "مرحباً بعودتك!",
  },
  es: {
    welcome: "Bienvenido a Six9Chat",
    selectLanguage: "Elige tu idioma para comenzar",
    chooseCountry: "Elige tu país",
    enterPhone: "Ingresa tu número de teléfono",
    next: "Siguiente",
    verifyPhone: "Verifica tu número de teléfono",
    enterOtp: "Ingresa el código de 6 dígitos",
    resendCode: "Reenviar código",
    profileInfo: "Información de perfil",
    typeName: "Escribe tu nombre",
    about: "Info",
    finishSetup: "Finalizar configuración",
    welcomeBack: "¡Bienvenido de nuevo!",
  },
  fr: {
    welcome: "Bienvenue sur Six9Chat",
    selectLanguage: "Choisissez votre langue pour commencer",
    chooseCountry: "Choisissez votre pays",
    enterPhone: "Entrez votre numéro de téléphone",
    next: "Suivant",
    verifyPhone: "Vérifiez votre numéro",
    enterOtp: "Entrez le code à 6 chiffres",
    resendCode: "Renvoyer le code",
    profileInfo: "Infos du profil",
    typeName: "Tapez votre nom",
    about: "Actu",
    finishSetup: "Terminer la configuration",
    welcomeBack: "Bon retour parmi nous !",
  },
  hi: {
    welcome: "Six9Chat में आपका स्वागत है",
    selectLanguage: "शुरू करने के लिए अपनी भाषा चुनें",
    chooseCountry: "अपना देश चुनें",
    enterPhone: "अपना फ़ोन नंबर दर्ज करें",
    next: "आगे बढ़ें",
    verifyPhone: "अपना फ़ोन नंबर सत्यापित करें",
    enterOtp: "6-अंकों का सत्यापन कोड दर्ज करें",
    resendCode: "कोड दोबारा भेजें",
    profileInfo: "प्रोफ़ाइल जानकारी",
    typeName: "अपना नाम लिखें",
    about: "के बारे में",
    finishSetup: "सेटअप पूरा करें",
    welcomeBack: "वापसी पर स्वागत है!",
  },
  tr: {
    welcome: "Six9Chat'e Hoş Geldiniz",
    selectLanguage: "Başlamak için dilinizi seçin",
    chooseCountry: "Ülkenizi seçin",
    enterPhone: "Telefon numaranızı girin",
    next: "İleri",
    verifyPhone: "Telefon numaranızı doğrulayın",
    enterOtp: "6 haneli doğrulama kodunu girin",
    resendCode: "Kodu Yeniden Gönder",
    profileInfo: "Profil Bilgisi",
    typeName: "Adınızı yazın",
    about: "Hakkında",
    finishSetup: "Kurulumu Tamamla",
    welcomeBack: "Tekrar hoş geldiniz!",
  },
  de: {
    welcome: "Willkommen bei Six9Chat",
    selectLanguage: "Wählen Sie Ihre Sprache",
    chooseCountry: "Wählen Sie Ihr Land",
    enterPhone: "Geben Sie Ihre Telefonnummer ein",
    next: "Weiter",
    verifyPhone: "Telefonnummer bestätigen",
    enterOtp: "6-stelligen Code eingeben",
    resendCode: "Code erneut senden",
    profileInfo: "Profil-Info",
    typeName: "Geben Sie Ihren Namen ein",
    about: "Info",
    finishSetup: "Einrichtung abschließen",
    welcomeBack: "Willkommen zurück!",
  },
  zh: {
    welcome: "欢迎使用 Six9Chat",
    selectLanguage: "选择您的语言以开始",
    chooseCountry: "选择您的国家",
    enterPhone: "输入您的手机号码",
    next: "下一步",
    verifyPhone: "验证您的手机号码",
    enterOtp: "输入 6 位验证码",
    resendCode: "重新发送验证码",
    profileInfo: "个人资料信息",
    typeName: "输入您的姓名",
    about: "个性签名",
    finishSetup: "完成设置",
    welcomeBack: "欢迎回来！",
  },
};
