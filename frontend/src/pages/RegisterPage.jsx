import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { UserPlus, Phone, LockKey, IdentificationBadge, ArrowRight } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { LanguageSwitch } from "@/components/LanguageSwitch";

export default function RegisterPage() {
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const { t } = useT();
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await register(mobile.trim(), name.trim(), password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      toast.error(res.error);
      return;
    }
    toast.success(t("register.success"));
    nav("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-12 relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitch />
      </div>
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 font-display font-black text-lg text-slate-900 mb-6">
            <UserPlus size={22} weight="duotone" className="text-blue-600" />
            <span>{t("register.brand")}</span>
          </div>
          <div className="label-eyebrow text-blue-600 mb-2">{t("register.eyebrow")}</div>
          <h2 className="font-display font-black text-3xl text-slate-900">
            {t("register.title")}
          </h2>
          <p className="text-sm text-slate-500 mt-2">{t("register.subtitle")}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5" data-testid="register-form">
          <div>
            <label className="label-eyebrow block mb-2">{t("register.name")}</label>
            <div className="flex items-center border-b-2 border-slate-200 focus-within:border-slate-900 transition-colors">
              <IdentificationBadge size={18} weight="bold" className="text-slate-400 mr-2" />
              <input
                data-testid="register-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("register.name.placeholder")}
                required
                className="w-full py-3 bg-transparent outline-none text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>
          <div>
            <label className="label-eyebrow block mb-2">{t("login.mobile")}</label>
            <div className="flex items-center border-b-2 border-slate-200 focus-within:border-slate-900 transition-colors">
              <Phone size={18} weight="bold" className="text-slate-400 mr-2" />
              <input
                data-testid="register-mobile-input"
                type="tel"
                inputMode="numeric"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder={t("register.mobile.placeholder")}
                required
                className="w-full py-3 bg-transparent outline-none text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>
          <div>
            <label className="label-eyebrow block mb-2">{t("login.password")}</label>
            <div className="flex items-center border-b-2 border-slate-200 focus-within:border-slate-900 transition-colors">
              <LockKey size={18} weight="bold" className="text-slate-400 mr-2" />
              <input
                data-testid="register-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("register.password.placeholder")}
                required
                minLength={6}
                className="w-full py-3 bg-transparent outline-none text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          {error && (
            <div
              data-testid="register-error"
              className="text-xs text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded-md"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            data-testid="register-submit-btn"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-slate-900 text-white font-semibold text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {loading ? t("register.creating") : t("register.submit")}
            <ArrowRight size={16} weight="bold" />
          </button>
        </form>

        <div className="mt-6 text-sm text-slate-600">
          {t("register.have")}{" "}
          <Link
            to="/login"
            data-testid="go-to-login-link"
            className="text-blue-600 font-semibold hover:underline"
          >
            {t("register.signin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
