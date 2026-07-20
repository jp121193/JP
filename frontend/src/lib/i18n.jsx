import { createContext, useContext, useEffect, useState } from "react";

const dict = {
  en: {
    "brand.subtitle": "Logistics & Ceramics Directory",
    "header.admin": "Admin",
    "header.logout": "Logout",

    "login.eyebrow": "Sign in",
    "login.title": "Welcome back.",
    "login.subtitle": "Enter the mobile number registered with JP.",
    "login.mobile": "Mobile number",
    "login.password": "Password",
    "login.mobile.placeholder": "9999999999",
    "login.password.placeholder": "Your password",
    "login.submit": "Sign in",
    "login.signing": "Signing in...",
    "login.welcome": "Welcome back, {name}",
    "login.new": "New here?",
    "login.request": "Request access",
    "login.hero.eyebrow": "Logistics · Ceramics · Directory",
    "login.hero.title": "Every yard.\nEvery factory.\nOne directory.",
    "login.hero.copy": "Verified Morvi ceramic manufacturers and empty container yards at Mundra & Kandla, built for logistics professionals on the ground.",
    "login.hero.footer": "v1.0 · access by invite only",

    "register.eyebrow": "Signup",
    "register.title": "Create your account",
    "register.subtitle": "After signup, an admin will review and grant you access. Payment is collected offline.",
    "register.name": "Full name",
    "register.name.placeholder": "Rakesh Patel",
    "register.mobile.placeholder": "10-digit mobile number",
    "register.password.placeholder": "Minimum 6 characters",
    "register.submit": "Create account",
    "register.creating": "Creating...",
    "register.success": "Account created. Waiting for admin approval.",
    "register.have": "Already have an account?",
    "register.signin": "Sign in",
    "register.brand": "JP · Request Access",

    "pending.eyebrow": "Pending approval",
    "pending.title": "Hang tight, {name}.",
    "pending.body": "Your account has been created and is awaiting review by the JP admin. Access is granted manually after your one-time payment is confirmed offline.",
    "pending.mobile": "Mobile",
    "pending.status": "Status",
    "pending.status.value": "Pending",
    "pending.refresh": "Check again",
    "pending.refresh.toast": "Status refreshed",
    "pending.signout": "Sign out",

    "dashboard.eyebrow": "Directory",
    "dashboard.title": "Morvi ceramics & container yards, in one operator's directory.",
    "dashboard.subtitle": "Curated for logistics teams working the Kutch corridor. Tap any pin to open on Google Maps.",
    "dashboard.tab.ceramics": "Morvi Ceramics",
    "dashboard.tab.yards": "Container Yards",
    "dashboard.search.ceramics": "Search company or category...",
    "dashboard.search.yards": "Search yard name or port (Mundra / Kandla)...",
    "dashboard.search.clear": "Clear",
    "dashboard.section.ceramics": "Ceramic manufacturers · Morvi",
    "dashboard.section.yards": "Empty container yards",
    "dashboard.results": "{n} result",
    "dashboard.results.plural": "{n} results",
    "dashboard.loading": "loading...",
    "dashboard.empty": "No matches",
    "dashboard.location": "Morvi, Gujarat",
    "dashboard.yardType": "Empty container yard",
    "dashboard.port": "Port · {port}",
    "dashboard.whatsapp": "WhatsApp",
    "dashboard.maps": "Open in Maps",
    "dashboard.footer": "JP · Directory v1.0 · signed in as {name}",

    "admin.eyebrow": "Admin console",
    "admin.title": "Manage JP.",
    "admin.back": "Back to directory",
    "admin.section.users": "Users",
    "admin.section.ceramics": "Ceramics",
    "admin.section.yards": "Yards",
    "admin.loading": "Loading",
    "admin.selected": "{n} selected",
    "admin.deleteSelected": "Delete selected",
    "admin.clearSelection": "Clear",
    "admin.approve": "Approve",
    "admin.revoke": "Revoke",
    "admin.add.ceramic": "Add ceramic",
    "admin.add.yard": "Add yard",
    "admin.template": "Template",
    "admin.import": "Import CSV",
    "admin.import.busy": "Uploading...",
    "admin.edit": "Edit",
    "admin.status.approved": "approved",
    "admin.status.pending": "pending",
    "admin.role.admin": "admin",
    "admin.device.bound": "Device bound",
    "admin.device.unbound": "No device",
    "admin.resetDevice": "Reset device",
    "form.name.ceramic": "Company name",
    "form.name.yard": "Yard name",
    "form.category": "Category (e.g. Vitrified Tiles)",
    "form.phone.ceramic": "WhatsApp number (e.g. +919825012345)",
    "form.phone.yard": "WhatsApp number (e.g. +912836200001)",
    "form.mapUrl": "Google Maps URL",
    "form.save": "Save",
    "form.cancel": "Cancel",

    "confirm.eyebrow": "Confirm",
    "confirm.deleteUser.title": "Delete user?",
    "confirm.deleteUser.body": "Remove {name} permanently. They will lose access immediately.",
    "confirm.deleteCeramic.title": "Delete ceramic entry?",
    "confirm.deleteCeramic.body": "\"{name}\" will be removed from the directory.",
    "confirm.deleteYard.title": "Delete yard entry?",
    "confirm.deleteYard.body": "\"{name}\" will be removed from the directory.",
    "confirm.bulkDelete.title": "Delete {n} item(s)?",
    "confirm.bulkDelete.body": "This action cannot be undone.",
    "confirm.cancel": "Cancel",
    "confirm.delete": "Delete",

    "toast.userDeleted": "User deleted",
    "toast.deleted": "Deleted",
    "toast.userApproved": "User approved",
    "toast.accessRevoked": "Access revoked",
    "toast.deviceReset": "Device reset — user can now sign in from a new device",
    "toast.ceramicAdded": "Ceramic added",
    "toast.ceramicUpdated": "Ceramic updated",
    "toast.yardAdded": "Yard added",
    "toast.yardUpdated": "Yard updated",
    "toast.imported": "Imported {n} row",
    "toast.imported.plural": "Imported {n} rows",
    "toast.importSkipped": "{n} row(s) skipped. First: {first}",
    "toast.importEmpty": "Nothing to import",
    "toast.csvOnly": "Please choose a .csv file",
    "toast.bulkDeleted": "{n} item(s) deleted",
    "toast.bulkPartial": "{ok} deleted, {fail} failed",

    "lang.label": "Language",
    "lang.en": "EN",
    "lang.hi": "हिं",
  },

  hi: {
    "brand.subtitle": "लॉजिस्टिक्स एवं सेरामिक डायरेक्ट्री",
    "header.admin": "एडमिन",
    "header.logout": "लॉगआउट",

    "login.eyebrow": "साइन इन",
    "login.title": "वापस स्वागत है।",
    "login.subtitle": "JP में पंजीकृत मोबाइल नंबर दर्ज करें।",
    "login.mobile": "मोबाइल नंबर",
    "login.password": "पासवर्ड",
    "login.mobile.placeholder": "9999999999",
    "login.password.placeholder": "आपका पासवर्ड",
    "login.submit": "साइन इन करें",
    "login.signing": "साइन इन हो रहा है...",
    "login.welcome": "वापस स्वागत है, {name}",
    "login.new": "नए हैं?",
    "login.request": "एक्सेस का अनुरोध करें",
    "login.hero.eyebrow": "लॉजिस्टिक्स · सेरामिक · डायरेक्ट्री",
    "login.hero.title": "हर यार्ड.\nहर फैक्ट्री.\nएक डायरेक्ट्री.",
    "login.hero.copy": "मोरबी के प्रमाणित सेरामिक निर्माता और मुंद्रा एवं कांडला के खाली कंटेनर यार्ड, ज़मीनी लॉजिस्टिक्स पेशेवरों के लिए बनाया गया।",
    "login.hero.footer": "v1.0 · केवल आमंत्रण से एक्सेस",

    "register.eyebrow": "साइनअप",
    "register.title": "अपना खाता बनाएं",
    "register.subtitle": "साइनअप के बाद, एडमिन आपकी समीक्षा करेगा और एक्सेस देगा। भुगतान ऑफ़लाइन लिया जाता है।",
    "register.name": "पूरा नाम",
    "register.name.placeholder": "राकेश पटेल",
    "register.mobile.placeholder": "10-अंकों का मोबाइल नंबर",
    "register.password.placeholder": "न्यूनतम 6 अक्षर",
    "register.submit": "खाता बनाएं",
    "register.creating": "बनाया जा रहा है...",
    "register.success": "खाता बना। एडमिन की मंज़ूरी का इंतज़ार है।",
    "register.have": "पहले से खाता है?",
    "register.signin": "साइन इन",
    "register.brand": "JP · एक्सेस का अनुरोध",

    "pending.eyebrow": "मंज़ूरी बाकी है",
    "pending.title": "थोड़ा रुकें, {name}.",
    "pending.body": "आपका खाता बन चुका है और JP एडमिन की समीक्षा का इंतज़ार कर रहा है। एक बार भुगतान ऑफ़लाइन कन्फ़र्म होने पर एक्सेस मैन्युअली दिया जाता है।",
    "pending.mobile": "मोबाइल",
    "pending.status": "स्थिति",
    "pending.status.value": "बाकी",
    "pending.refresh": "फिर से जाँचें",
    "pending.refresh.toast": "स्थिति रिफ़्रेश हुई",
    "pending.signout": "साइन आउट",

    "dashboard.eyebrow": "डायरेक्ट्री",
    "dashboard.title": "मोरबी सेरामिक और कंटेनर यार्ड, एक ही डायरेक्ट्री में।",
    "dashboard.subtitle": "कच्छ कॉरिडोर पर काम करने वाली लॉजिस्टिक्स टीमों के लिए। किसी भी पिन को टैप करके गूगल मैप्स पर खोलें।",
    "dashboard.tab.ceramics": "मोरबी सेरामिक",
    "dashboard.tab.yards": "कंटेनर यार्ड",
    "dashboard.search.ceramics": "कंपनी या श्रेणी खोजें...",
    "dashboard.search.yards": "यार्ड या पोर्ट (मुंद्रा / कांडला) खोजें...",
    "dashboard.search.clear": "साफ़ करें",
    "dashboard.section.ceramics": "सेरामिक निर्माता · मोरबी",
    "dashboard.section.yards": "खाली कंटेनर यार्ड",
    "dashboard.results": "{n} परिणाम",
    "dashboard.results.plural": "{n} परिणाम",
    "dashboard.loading": "लोड हो रहा है...",
    "dashboard.empty": "कोई मिलान नहीं",
    "dashboard.location": "मोरबी, गुजरात",
    "dashboard.yardType": "खाली कंटेनर यार्ड",
    "dashboard.port": "पोर्ट · {port}",
    "dashboard.whatsapp": "व्हाट्सएप",
    "dashboard.maps": "मैप्स में खोलें",
    "dashboard.footer": "JP · डायरेक्ट्री v1.0 · {name} के रूप में साइन इन",

    "admin.eyebrow": "एडमिन कंसोल",
    "admin.title": "JP का प्रबंधन।",
    "admin.back": "डायरेक्ट्री पर वापस",
    "admin.section.users": "उपयोगकर्ता",
    "admin.section.ceramics": "सेरामिक",
    "admin.section.yards": "यार्ड",
    "admin.loading": "लोड हो रहा है",
    "admin.selected": "{n} चयनित",
    "admin.deleteSelected": "चयनित हटाएँ",
    "admin.clearSelection": "साफ़",
    "admin.approve": "मंज़ूरी दें",
    "admin.revoke": "रद्द करें",
    "admin.add.ceramic": "सेरामिक जोड़ें",
    "admin.add.yard": "यार्ड जोड़ें",
    "admin.template": "टेम्प्लेट",
    "admin.import": "CSV आयात",
    "admin.import.busy": "अपलोड हो रहा है...",
    "admin.edit": "संपादित करें",
    "admin.status.approved": "मंज़ूर",
    "admin.status.pending": "बाकी",
    "admin.role.admin": "एडमिन",
    "admin.device.bound": "डिवाइस बंधा",
    "admin.device.unbound": "कोई डिवाइस नहीं",
    "admin.resetDevice": "डिवाइस रीसेट",
    "form.name.ceramic": "कंपनी का नाम",
    "form.name.yard": "यार्ड का नाम",
    "form.category": "श्रेणी (जैसे विट्रीफाइड टाइल्स)",
    "form.phone.ceramic": "व्हाट्सएप नंबर (जैसे +919825012345)",
    "form.phone.yard": "व्हाट्सएप नंबर (जैसे +912836200001)",
    "form.mapUrl": "गूगल मैप्स URL",
    "form.save": "सहेजें",
    "form.cancel": "रद्द करें",

    "confirm.eyebrow": "पुष्टि करें",
    "confirm.deleteUser.title": "उपयोगकर्ता हटाएँ?",
    "confirm.deleteUser.body": "{name} को स्थायी रूप से हटाएँ। उनकी एक्सेस तुरंत समाप्त हो जाएगी।",
    "confirm.deleteCeramic.title": "सेरामिक प्रविष्टि हटाएँ?",
    "confirm.deleteCeramic.body": "\"{name}\" को डायरेक्ट्री से हटा दिया जाएगा।",
    "confirm.deleteYard.title": "यार्ड प्रविष्टि हटाएँ?",
    "confirm.deleteYard.body": "\"{name}\" को डायरेक्ट्री से हटा दिया जाएगा।",
    "confirm.bulkDelete.title": "{n} आइटम हटाएँ?",
    "confirm.bulkDelete.body": "यह क्रिया पूर्ववत नहीं की जा सकती।",
    "confirm.cancel": "रद्द करें",
    "confirm.delete": "हटाएँ",

    "toast.userDeleted": "उपयोगकर्ता हटा दिया गया",
    "toast.deleted": "हटा दिया गया",
    "toast.userApproved": "उपयोगकर्ता मंज़ूर",
    "toast.accessRevoked": "एक्सेस रद्द",
    "toast.deviceReset": "डिवाइस रीसेट — उपयोगकर्ता अब नए डिवाइस से साइन इन कर सकता है",
    "toast.ceramicAdded": "सेरामिक जोड़ा गया",
    "toast.ceramicUpdated": "सेरामिक अपडेट हुआ",
    "toast.yardAdded": "यार्ड जोड़ा गया",
    "toast.yardUpdated": "यार्ड अपडेट हुआ",
    "toast.imported": "{n} पंक्ति आयात हुई",
    "toast.imported.plural": "{n} पंक्तियाँ आयात हुईं",
    "toast.importSkipped": "{n} पंक्ति छूटी। पहली: {first}",
    "toast.importEmpty": "आयात करने के लिए कुछ नहीं",
    "toast.csvOnly": "कृपया .csv फ़ाइल चुनें",
    "toast.bulkDeleted": "{n} आइटम हटाए गए",
    "toast.bulkPartial": "{ok} हटाए गए, {fail} विफल",

    "lang.label": "भाषा",
    "lang.en": "EN",
    "lang.hi": "हिं",
  },
};

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

const I18nContext = createContext({ lang: "en", t: (k) => k, setLang: () => {} });

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem("jp_lang") === "hi" ? "hi" : "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const setLang = (l) => {
    setLangState(l);
    try {
      localStorage.setItem("jp_lang", l);
    } catch {
      /* Safari private mode: silently skip persistence, state still updates. */
    }
  };

  const t = (key, vars) => {
    const entry = dict[lang]?.[key] ?? dict.en[key] ?? key;
    return interpolate(entry, vars);
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
  );
}

export function useT() {
  return useContext(I18nContext);
}
