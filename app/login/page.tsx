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
  Sparkles,
  Shield,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await api.post("/auth/login", { email, password });

      if (res.data?.requiresVerification) {
        setSuccessMsg(
          "Account requires verification. Redirecting to OTP page...",
        );
        setTimeout(() => {
          router.push(
            `/verify?email=${encodeURIComponent(res.data.email || email)}`,
          );
        }, 1200);
        return;
      }

      setSuccessMsg("Signed in successfully! Redirecting...");
      setTimeout(() => {
        router.push("/history");
      }, 1000);
    } catch (err: any) {
      // ✅ استقبال رسالة الخطأ من السيرفر
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
          <Loader2 className="h-8 w-8 text-sky-400 animate-spin" />
          <p className="text-sm text-slate-400">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md space-y-6 sm:space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-slate-700">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/20 text-sky-400 mb-2 sm:mb-3 relative group">
            <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900 flex items-center justify-center">
              <Sparkles className="h-2.5 w-2.5 text-slate-900" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Sign in to access your saved security scans
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 sm:p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs sm:text-sm font-medium text-rose-400 animate-slide-down">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError("")}
              className="text-rose-400/60 hover:text-rose-400 transition p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2.5 p-3 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-sm font-medium text-emerald-400 animate-slide-down">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="flex-1">{successMsg}</span>
            <button
              onClick={() => setSuccessMsg("")}
              className="text-emerald-400/60 hover:text-emerald-400 transition p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-5"
          noValidate
        >
          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-2"
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
                className={`w-full rounded-xl border bg-slate-950 px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-100 placeholder-slate-600 focus:outline-none transition-all duration-200 ${
                  touched.email && !isEmailValid && email
                    ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30"
                    : touched.email && isEmailValid && email
                      ? "border-emerald-500 focus:border-emerald-500 ring-1 ring-emerald-500/30"
                      : "border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30"
                }`}
              />
              {touched.email && email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isEmailValid ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <X className="h-4 w-4 text-rose-400" />
                  )}
                </div>
              )}
            </div>
            {touched.email && !isEmailValid && email && (
              <p className="text-[10px] sm:text-xs text-rose-400 flex items-center gap-1 animate-slide-down">
                <AlertCircle className="h-3 w-3" />
                Please enter a valid email address
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-2"
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
                className={`w-full rounded-xl border bg-slate-950 px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-100 placeholder-slate-600 focus:outline-none transition-all duration-200 pr-12 ${
                  touched.password && !isPasswordValid && password
                    ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30"
                    : touched.password && isPasswordValid && password
                      ? "border-emerald-500 focus:border-emerald-500 ring-1 ring-emerald-500/30"
                      : "border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30"
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
              <p className="text-[10px] sm:text-xs text-rose-400 flex items-center gap-1 animate-slide-down">
                <AlertCircle className="h-3 w-3" />
                Password must be at least 6 characters
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-slate-400 group-hover:text-slate-300 transition">
                Remember me
              </span>
            </label>
            <Link
              href="/forgot-password"
              className="text-xs sm:text-sm font-medium text-sky-400 hover:text-sky-300 hover:underline transition text-left sm:text-right"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="relative w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 py-2.5 sm:py-3.5 font-semibold text-sm sm:text-base text-white shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed overflow-hidden group"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-slate-900/60 text-slate-500">
              New to ScanLens?
            </span>
          </div>
        </div>

        {/* Register Link */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center">
          <span className="text-xs sm:text-sm text-slate-500">
            Don&apos;t have an account?
          </span>
          <Link
            href="/register"
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-sky-400 hover:text-sky-300 transition"
          >
            Create one for free
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        {/* Trust Badge */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] sm:text-xs text-slate-500">
              256-bit SSL
            </span>
          </div>
          <div className="w-px h-4 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <Check className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] sm:text-xs text-slate-500">
              Secure login
            </span>
          </div>
          <div className="w-px h-4 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] sm:text-xs text-slate-500">
              Privacy protected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
