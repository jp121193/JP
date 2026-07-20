import { useAuth } from "@/context/AuthContext";
import { Hourglass, ArrowClockwise, SignOut } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { LanguageSwitch } from "@/components/LanguageSwitch";

export default function PendingApprovalPage() {
  const { user, logout, refresh } = useAuth();
  const { t } = useT();
  const handleRefresh = async () => {
    await refresh();
    toast.info(t("pending.refresh.toast"));
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-12 relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitch />
      </div>
      <div
        data-testid="pending-approval-card"
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-10 text-left"
      >
        <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-6">
          <Hourglass size={26} weight="duotone" className="text-blue-600" />
        </div>
        <div className="label-eyebrow text-blue-600 mb-2">{t("pending.eyebrow")}</div>
        <h2 className="font-display font-black text-3xl text-slate-900 mb-4">
          {t("pending.title", { name: user?.name?.split(" ")[0] || "friend" })}
        </h2>
        <p className="text-slate-600 leading-relaxed">{t("pending.body")}</p>
        <div className="mt-6 border-t border-slate-200 pt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="label-eyebrow">{t("pending.mobile")}</span>
            <span className="font-mono-jp text-slate-900">{user?.mobile}</span>
          </div>
          <div className="flex justify-between">
            <span className="label-eyebrow">{t("pending.status")}</span>
            <span className="text-amber-600 font-semibold">
              {t("pending.status.value")}
            </span>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            data-testid="pending-refresh-btn"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-slate-900 text-white font-semibold text-sm hover:bg-blue-600 transition-colors"
          >
            <ArrowClockwise size={16} weight="bold" />
            {t("pending.refresh")}
          </button>
          <button
            data-testid="pending-logout-btn"
            onClick={logout}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
          >
            <SignOut size={16} weight="bold" />
            {t("pending.signout")}
          </button>
        </div>
      </div>
    </div>
  );
}
