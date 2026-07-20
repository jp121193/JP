import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { UserPlus, Phone, LockKey, IdentificationBadge, ArrowRight } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function RegisterPage() {
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
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
    toast.success("Account created. Waiting for admin approval.");
    nav("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 font-display font-black text-lg text-slate-900 mb-6">
            <UserPlus size={22} weight="duotone" className="text-blue-600" />
            <span>JP · Request Access</span>
          </div>
          <div className="label-eyebrow text-blue-600 mb-2">Signup</div>
          <h2 className="font-display font-black text-3xl text-slate-900">
            Create your account
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            After signup, an admin will review and grant you access. Payment is collected offline.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5" data-testid="register-form">
          <div>
            <label className="label-eyebrow block mb-2">Full name</label>
            <div className="flex items-center border-b-2 border-slate-200 focus-within:border-slate-900 transition-colors">
              <IdentificationBadge size={18} weight="bold" className="text-slate-400 mr-2" />
              <input
                data-testid="register-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rakesh Patel"
                required
                className="w-full py-3 bg-transparent outline-none text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>
          <div>
            <label className="label-eyebrow block mb-2">Mobile number</label>
            <div className="flex items-center border-b-2 border-slate-200 focus-within:border-slate-900 transition-colors">
              <Phone size={18} weight="bold" className="text-slate-400 mr-2" />
              <input
                data-testid="register-mobile-input"
                type="tel"
                inputMode="numeric"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile number"
                required
                className="w-full py-3 bg-transparent outline-none text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>
          <div>
            <label className="label-eyebrow block mb-2">Password</label>
            <div className="flex items-center border-b-2 border-slate-200 focus-within:border-slate-900 transition-colors">
              <LockKey size={18} weight="bold" className="text-slate-400 mr-2" />
              <input
                data-testid="register-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
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
            {loading ? "Creating..." : "Create account"}
            <ArrowRight size={16} weight="bold" />
          </button>
        </form>

        <div className="mt-6 text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            to="/login"
            data-testid="go-to-login-link"
            className="text-blue-600 font-semibold hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
