// client/app/register/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Check,
  X,
  Sparkles,
  Shield,
  Key,
} from "lucide-react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  // ✅ جميع الـ Hooks في الأعلى
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  // ✅ التحقق من حالة المستخدم (نفس الـ Header)
  const checkAuth = async () => {
    try {
      const res = await api.get("/auth/me", { withCredentials: true });
      if (res.data?.user) {
        setSuccessMsg("You are already logged in. Redirecting...");
        setTimeout(() => {
          // ✅ التحقق إذا كان المستخدم أدمن يروح للـ Admin Dashboard
          if (res.data.user.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/history");
          }
        }, 1500);
        return;
      }
    } catch {
      // المستخدم غير مسجل دخول، يكمل في الصفحة
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // ✅ حساب قوة كلمة المرور
  useEffect(() => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 10) strength += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  }, [password]);

  // ✅ دوال التحقق
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isNameValid = name === "" || name.length >= 2;
  const isEmailValid = email === "" || validateEmail(email);
  const isPasswordValid = password === "" || password.length >= 6;
  const doPasswordsMatch =
    password === confirmPassword || confirmPassword === "";

  const canSubmit =
    name &&
    email &&
    password &&
    confirmPassword &&
    isNameValid &&
    isEmailValid &&
    isPasswordValid &&
    doPasswordsMatch &&
    !loading;

  // ✅ دالة التسجيل
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      setSuccessMsg("Account created! Redirecting to verification page...");

      setTimeout(() => {
        if (res.data?.requiresVerification || res.data?.email) {
          router.push(
            `/verify?email=${encodeURIComponent(res.data.email || email)}`,
          );
        } else {
          router.push("/login");
        }
      }, 1000);
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(
        Array.isArray(message)
          ? message.join(", ")
          : message || "Registration failed",
      );
      setLoading(false);
    }
  };

  const getPasswordStrengthLabel = (strength: number) => {
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const colors = [
      "bg-rose-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-sky-500",
      "bg-emerald-500",
    ];
    return { label: labels[strength] || "", color: colors[strength] || "" };
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canSubmit) {
      handleSubmit(e as any);
    }
  };

  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  // ✅ شاشة التحميل أثناء التحقق
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
            Create Account
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Start monitoring your website security posture
          </p>
        </div>

        {/* رسائل الخطأ والنجاح */}
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

        {/* النموذج */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-5"
          noValidate
        >
          {/* الاسم الكامل */}
          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-2"
            >
              <User className="h-3.5 w-3.5 text-slate-500" />
              Full Name
            </label>
            <div className="relative">
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setTouched({ ...touched, name: true });
                }}
                onBlur={() => setTouched({ ...touched, name: true })}
                onKeyDown={handleKeyDown}
                placeholder="Islam Hadaya"
                className={`w-full rounded-xl border bg-slate-950 px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-100 placeholder-slate-600 focus:outline-none transition-all duration-200 ${
                  touched.name && !isNameValid && name
                    ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30"
                    : touched.name && isNameValid && name
                      ? "border-emerald-500 focus:border-emerald-500 ring-1 ring-emerald-500/30"
                      : "border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30"
                }`}
              />
              {touched.name && name && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isNameValid ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <X className="h-4 w-4 text-rose-400" />
                  )}
                </div>
              )}
            </div>
            {touched.name && !isNameValid && name && (
              <p className="text-[10px] sm:text-xs text-rose-400 flex items-center gap-1 animate-slide-down">
                <AlertCircle className="h-3 w-3" />
                Name must be at least 2 characters
              </p>
            )}
          </div>

          {/* البريد الإلكتروني */}
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

          {/* كلمة المرور */}
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
                minLength={6}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setTouched({ ...touched, password: true });
                }}
                onBlur={() => setTouched({ ...touched, password: true })}
                onKeyDown={handleKeyDown}
                placeholder="At least 6 characters"
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

            {/* مؤشر قوة كلمة المرور */}
            {password && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${strengthInfo.color}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    {strengthInfo.label}
                  </span>
                </div>
                {touched.password && !isPasswordValid && password && (
                  <p className="text-[10px] sm:text-xs text-rose-400 flex items-center gap-1 animate-slide-down">
                    <AlertCircle className="h-3 w-3" />
                    Password must be at least 6 characters
                  </p>
                )}
              </div>
            )}
          </div>

          {/* تأكيد كلمة المرور */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-2"
            >
              <Key className="h-3.5 w-3.5 text-slate-500" />
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setTouched({ ...touched, confirmPassword: true });
                }}
                onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                onKeyDown={handleKeyDown}
                placeholder="Confirm your password"
                className={`w-full rounded-xl border bg-slate-950 px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-100 placeholder-slate-600 focus:outline-none transition-all duration-200 pr-12 ${
                  touched.confirmPassword &&
                  confirmPassword &&
                  !doPasswordsMatch
                    ? "border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30"
                    : touched.confirmPassword &&
                        confirmPassword &&
                        doPasswordsMatch
                      ? "border-emerald-500 focus:border-emerald-500 ring-1 ring-emerald-500/30"
                      : "border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition p-1"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {touched.confirmPassword &&
              confirmPassword &&
              !doPasswordsMatch && (
                <p className="text-[10px] sm:text-xs text-rose-400 flex items-center gap-1 animate-slide-down">
                  <AlertCircle className="h-3 w-3" />
                  Passwords do not match
                </p>
              )}
          </div>

          {/* زر التسجيل */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="relative w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 py-2.5 sm:py-3.5 font-semibold text-sm sm:text-base text-white shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed overflow-hidden group"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Create Account</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </>
            )}
          </button>
        </form>

        {/* الفاصل */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-slate-900/60 text-slate-500">
              Already a member?
            </span>
          </div>
        </div>

        {/* رابط تسجيل الدخول */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center">
          <span className="text-xs sm:text-sm text-slate-500">
            Already have an account?
          </span>
          <Link
            href="/login"
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-sky-400 hover:text-sky-300 transition"
          >
            Sign in here
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        {/* Trust Badge */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
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
              Secure registration
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
