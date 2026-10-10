// client/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Check,
  X,
  Copy,
} from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // ✅ حالة نسخ بيانات الأدمن
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const router = useRouter();

  const checkAuth = async () => {
    try {
      const res = await api.get("/auth/me", { withCredentials: true });
      if (res.data?.user) {
        setSuccessMsg("You are already logged in. Redirecting...");
        setTimeout(() => {
          if (res.data.user.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/history");
          }
        }, 1500);
        return;
      }
    } catch (error) {
      console.log("User not logged in, showing login page");
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isEmailValid = email === "" || validateEmail(email);
  const isPasswordValid = password === "" || password.length >= 6;
  const canSubmit =
    email && password && isEmailValid && isPasswordValid && !loading;

  // ✅ نسخ القيمة
  const handleCopy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // ✅ تعبئة بيانات الأدمن
  const handleFillAdminCredentials = () => {
    setEmail("hdayaaslam34@gmail.com");
    setPassword("123456");
    setTouched({ email: true, password: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await api.post("/auth/login", { email, password });

      console.log("🔍 [DEBUG] Login response:", res.data);

      if (res.data?.requiresVerification === true) {
        setSuccessMsg(
          "Account requires verification. Redirecting to OTP page...",
        );

        setTimeout(() => {
          const verifyUrl = res.data?.devOtp
            ? `/verify?email=${encodeURIComponent(res.data.email || email)}&devOtp=${res.data.devOtp}`
            : `/verify?email=${encodeURIComponent(res.data.email || email)}`;

          console.log("🚀 [REDIRECT URL]:", verifyUrl);
          router.push(verifyUrl);
        }, 1200);
        return;
      }

      if (res.data?.accessToken) {
        setSuccessMsg("Signed in successfully! Redirecting...");
        setTimeout(() => {
          if (res.data.user?.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/history");
          }
        }, 1000);
        return;
      }

      if (res.data?.message) {
        setSuccessMsg(res.data.message);
        setTimeout(() => {
          router.push("/history");
        }, 1000);
        return;
      }
    } catch (err: any) {
      console.error("❌ Login error:", err);
      const message = err.response?.data?.message;
      setError(
        Array.isArray(message)
          ? message.join(", ")
          : message || "Invalid email or password",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canSubmit) {
      handleSubmit(e as any);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 text-slate-500 animate-spin" />
          <p className="text-sm text-slate-500">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 mb-4">
            <ShieldCheck className="h-6 w-6 text-sky-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-1.5">
            Sign in
          </h2>
          <p className="text-sm text-slate-400">
            Access your saved security scans
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-5">
          {/* Messages */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-sm text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError("")}
                className="text-rose-400/60 hover:text-rose-400 transition p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="flex-1">{successMsg}</span>
              <button
                onClick={() => setSuccessMsg("")}
                className="text-emerald-400/60 hover:text-emerald-400 transition p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-300 flex items-center gap-2"
              >
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setTouched({ ...touched, email: true });
                  }}
                  onBlur={() => setTouched({ ...touched, email: true })}
                  onKeyDown={handleKeyDown}
                  placeholder="developer@example.com"
                  className={`w-full rounded-lg border bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors ${
                    touched.email && !isEmailValid && email
                      ? "border-rose-500 focus:border-rose-500"
                      : touched.email && isEmailValid && email
                        ? "border-emerald-500 focus:border-emerald-500"
                        : "border-slate-800 focus:border-slate-600"
                  }`}
                />
                {touched.email && email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isEmailValid ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <X className="h-4 w-4 text-rose-500" />
                    )}
                  </div>
                )}
              </div>
              {touched.email && !isEmailValid && email && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Please enter a valid email address
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-300 flex items-center gap-2"
              >
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setTouched({ ...touched, password: true });
                  }}
                  onBlur={() => setTouched({ ...touched, password: true })}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className={`w-full rounded-lg border bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors pr-12 ${
                    touched.password && !isPasswordValid && password
                      ? "border-rose-500 focus:border-rose-500"
                      : touched.password && isPasswordValid && password
                        ? "border-emerald-500 focus:border-emerald-500"
                        : "border-slate-800 focus:border-slate-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {touched.password && !isPasswordValid && password && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-slate-400 hover:text-slate-300 transition">
                  Remember me
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-slate-400 hover:text-slate-200 transition"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-500 py-2.5 font-medium text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* ✅ Admin Test Account — بسيط وجدي */}
          <div className="pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Admin Test Account
              </span>
              <span className="text-[10px] text-slate-600">
                For testing only
              </span>
            </div>

            <div className="space-y-2">
              {/* Email */}
              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="text-xs font-mono text-slate-300 truncate">
                    hdayaaslam34@gmail.com
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy("hdayaaslam34@gmail.com", "email")}
                  className="shrink-0 p-1 rounded text-slate-500 hover:text-slate-300 transition"
                  title="Copy"
                >
                  {copiedField === "email" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="text-xs font-mono text-slate-300 tracking-widest">
                    123456
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy("123456", "password")}
                  className="shrink-0 p-1 rounded text-slate-500 hover:text-slate-300 transition"
                  title="Copy"
                >
                  {copiedField === "password" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Auto-fill */}
              <button
                type="button"
                onClick={handleFillAdminCredentials}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium py-2 transition-colors"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                <span>Auto-fill Credentials</span>
              </button>
            </div>
          </div>
        </div>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <span className="text-sm text-slate-500">
            Don't have an account?{" "}
          </span>
          <Link
            href="/register"
            className="text-sm font-medium text-sky-400 hover:text-sky-300 transition"
          >
            Create one for free
          </Link>
        </div>

        {/* Trust Badge — مبسط */}
        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-600">
          <Lock className="h-3 w-3" />
          <span>Secure login · 256-bit SSL</span>
        </div>
      </div>
    </div>
  );
}