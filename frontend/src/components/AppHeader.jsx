import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Buildings, SignOut, ShieldCheck, User } from "@phosphor-icons/react";
import { useT } from "@/lib/i18n";
import { LanguageSwitch } from "@/components/LanguageSwitch";

export function AppHeader() {
  const { user, logout } = useAuth();
  const { t } = useT();
  const nav = useNavigate();
  const handleLogout = async () => {
    await logout();
    nav("/login");
  };
  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-40 bg-white border-b border-slate-200"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          to="/"
          data-testid="brand-link"
          className="flex items-center gap-2 font-display font-black text-lg text-slate-900"
        >
          <Buildings size={22} weight="duotone" className="text-blue-600" />
          <span>JP</span>
          <span className="hidden sm:inline text-xs font-normal text-slate-500 ml-2 label-eyebrow">
            {t("brand.subtitle")}
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <LanguageSwitch />
          {user?.role === "admin" && (
            <Link
              to="/admin"
              data-testid="header-admin-link"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-900 hover:text-white transition-colors"
            >
              <ShieldCheck size={16} weight="bold" />
              {t("header.admin")}
            </Link>
          )}
          <div
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 mx-1"
            data-testid="header-user-info"
          >
            <User size={14} weight="bold" />
            {user?.name} · {user?.mobile}
          </div>
          <button
            data-testid="header-logout-btn"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <SignOut size={16} weight="bold" />
            {t("header.logout")}
          </button>
        </nav>
      </div>
    </header>
  );
}
