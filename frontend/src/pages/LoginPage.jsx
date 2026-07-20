import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Buildings, Phone, LockKey, ArrowRight } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { LanguageSwitch } from "@/components/LanguageSwitch";

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const { t } = useT();
  const nav = useNavigate();
  const loc = useLocation();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(mobile.trim(), password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      toast.error(res.error);
      return;
    }
    toast.success(t("login.welcome", { name: res.user.name }));
    const dest = loc.state?.from?.pathname || "/";
    nav(dest, { replace: true });
  };

  return (
    <div className="min-h-screen flex relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitch />
      </div>
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative z-10 p-12 flex flex-col justify-between w-full">
          <div className="flex items-center gap-2 font-display font-black text-2xl">
            <Buildings size={28} weight="duotone" className="text-blue-400" />
            <span>JP</span>
          </div>
          <div>
            <div className="label-eyebrow text-blue-300 mb-4">
              {t("login.hero.eyebrow")}
            </div>
            <h1 className="font-display font-black text-5xl leading-[1.05] mb-6 whitespace-pre-line">
              {t("login.hero.title")}
            </h1>
            <p className="text-slate-300 max-w-md">{t("login.hero.copy")}</p>
          </div>
          <div className="text-xs text-slate-400 font-mono-jp">
            {t("login.hero.footer")}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="label-eyebrow text-blue-600 mb-2">{t("login.eyebrow")}</div>
            <h2 className="font-display font-black text-3xl text-slate-900">
              {t("login.title")}
            </h2>
            <p className="text-sm text-slate-500 mt-2">{t("login.subtitle")}</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5" data-testid="login-form">
            <div>
              <label className="label-eyebrow block mb-2">{t("login.mobile")}</label>
              <div className="flex items-center border-b-2 border-slate-200 focus-within:border-slate-900 transition-colors">
                <Phone size={18} weight="bold" className="text-slate-400 mr-2" />
                <input
                  data-testid="login-mobile-input"
                  type="tel"
                  inputMode="numeric"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder={t("login.mobile.placeholder")}
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
                  data-testid="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.password.placeholder")}
                  required
                  className="w-full py-3 bg-transparent outline-none text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>

            {error && (
              <div
                data-testid="login-error"
                className="text-xs text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded-md"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              data-testid="login-submit-btn"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-slate-900 text-white font-semibold text-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? t("login.signing") : t("login.submit")}
              <ArrowRight size={16} weight="bold" />
            </button>
          </form>

          <div className="mt-6 text-sm text-slate-600">
            {t("login.new")}{" "}
            <Link
              to="/register"
              data-testid="go-to-register-link"
              className="text-blue-600 font-semibold hover:underline"
            >
              {t("login.request")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
