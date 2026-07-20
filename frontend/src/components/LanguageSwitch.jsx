import { useT } from "@/lib/i18n";
import { Translate } from "@phosphor-icons/react";

export function LanguageSwitch({ className = "" }) {
  const { lang, setLang, t } = useT();

  const btn = (code, label) => {
    const active = lang === code;
    return (
      <button
        key={code}
        data-testid={`lang-switch-${code}`}
        onClick={() => setLang(code)}
        aria-pressed={active}
        className={`h-7 px-3 rounded-full text-xs font-semibold transition-colors ${
          active
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      data-testid="language-switch"
      className={`inline-flex items-center gap-1 p-1 rounded-full bg-slate-100 border border-slate-200 ${className}`}
      title={t("lang.label")}
    >
      <Translate size={14} weight="bold" className="text-slate-500 ml-1" />
      {btn("en", t("lang.en"))}
      {btn("hi", t("lang.hi"))}
    </div>
  );
}
