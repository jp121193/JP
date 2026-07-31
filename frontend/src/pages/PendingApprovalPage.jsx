import { useAuth } from "@/context/AuthContext";
import {
  Hourglass,
  ArrowClockwise,
  SignOut,
  PhoneCall,
  Copy,
  Check,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useState } from "react";

const SUPPORT_PHONE = "9033879075";
const UPI_ID = "jp121193-2@okhdfcbank";

export default function PendingApprovalPage() {
  const { user, logout, refresh } = useAuth();
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  const handleRefresh = async () => {
    await refresh();
    toast.info(t("pending.refresh.toast"));
  };

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("UPI ID copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitch />
      </div>

      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Card 1: Status */}
        <div
          data-testid="pending-approval-card"
          className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10"
        >
          <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-6">
            <Hourglass size={26} weight="duotone" className="text-blue-600" />
          </div>
          <div className="label-eyebrow text-blue-600 mb-2">
            {t("pending.eyebrow")}
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-slate-900 mb-4">
            {t("pending.title", { name: user?.name?.split(" ")[0] || "friend" })}
          </h2>
          <p className="text-slate-600 leading-relaxed">{t("pending.body")}</p>
          <div className="mt-6 border-t border-slate-200 pt-6 grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="label-eyebrow">{t("pending.mobile")}</div>
              <div className="font-mono-jp text-slate-900 mt-1">{user?.mobile}</div>
            </div>
            <div className="text-right">
              <div className="label-eyebrow">{t("pending.status")}</div>
              <div className="text-amber-600 font-semibold mt-1">
                {t("pending.status.value")}
              </div>
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

        {/* Card 2: Payment */}
        <div
          data-testid="pending-payment-card"
          className="bg-white border-2 border-blue-100 rounded-2xl p-8 sm:p-10"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <div className="label-eyebrow text-blue-600 mb-2">
                {t("pending.pay.eyebrow")}
              </div>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-slate-900">
                {t("pending.pay.title")}
              </h3>
            </div>
            <div
              data-testid="pending-payment-amount"
              className="inline-flex flex-col items-end"
            >
              <span className="label-eyebrow text-slate-500">
                {t("pending.pay.amount")}
              </span>
              <span className="font-display font-black text-3xl text-blue-600">
                {t("pending.pay.amount.value")}
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-6">{t("pending.pay.copy")}</p>

          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <div className="flex-shrink-0 rounded-2xl bg-slate-50 border border-slate-200 p-3">
              <img
                src="/payment-qr.jpg"
                alt="Payment QR"
                data-testid="pending-payment-qr"
                className="w-56 h-auto rounded-md"
                loading="lazy"
              />
            </div>
            <div className="flex-1 w-full space-y-4">
              <div>
                <div className="label-eyebrow text-slate-500 mb-1">
                  {t("pending.pay.upi")}
                </div>
                <button
                  data-testid="pending-upi-copy"
                  onClick={copyUpi}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
                >
                  <span className="font-mono-jp text-slate-900 text-sm truncate">
                    {UPI_ID}
                  </span>
                  {copied ? (
                    <Check size={16} weight="bold" className="text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Copy size={16} weight="bold" className="text-slate-500 flex-shrink-0" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 text-center sm:text-left">
                {t("pending.pay.scan")}
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Help / Call */}
        <div
          data-testid="pending-help-card"
          className="bg-slate-900 text-white rounded-2xl p-8 sm:p-10"
        >
          <div className="label-eyebrow text-blue-300 mb-2">
            {t("pending.help.title")}
          </div>
          <p className="text-slate-300 text-sm mb-5">{t("pending.help.copy")}</p>
          <a
            href={`tel:+91${SUPPORT_PHONE}`}
            data-testid="pending-call-link"
            className="inline-flex items-center gap-3 h-14 px-6 rounded-full bg-white text-slate-900 font-display font-black text-xl hover:bg-blue-600 hover:text-white transition-colors"
          >
            <PhoneCall size={22} weight="bold" />
            +91 {SUPPORT_PHONE}
          </a>
        </div>
      </div>
    </div>
  );
}
