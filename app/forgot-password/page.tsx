// client/app/forgot-password/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  Loader2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Key,
  Lock,
  Sparkles,
  Shield,
  ArrowLeft,
  Eye,
  EyeOff,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ✅ Auto-focus first OTP input
  useEffect(() => {
    if (step === "otp" && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  // ✅ Countdown timer for resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!canResend && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [canResend, timer]);

  // ✅ Clear messages after delay
  useEffect(() => {
    if (error || successMsg) {
      const timer = setTimeout(() => {
        setError("");
        setSuccessMsg("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMsg]);

  // ✅ OTP handlers
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      const fullOtp = otp.join("");
      if (fullOtp.length === 6) {
        handleVerifyOtp();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  // ✅ Step 1: Request OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await api.post("/auth/forgot-password", { email });
      setSuccessMsg("OTP sent to your email! Please check your inbox.");
      setStep("otp");
      setTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await api.post("/auth/verify-reset-otp", {
        email,
        otp: fullOtp,
      });
      setResetToken(res.data.resetToken);
      setSuccessMsg("OTP verified! Please set your new password.");
      setStep("reset");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await api.post("/auth/reset-password", {
        email,
        newPassword,
        resetToken,
      });
      setSuccessMsg("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await api.post("/auth/resend-otp", { email });
      setSuccessMsg("New OTP sent to your email!");
      setTimer(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const otpString = otp.join("");

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md space-y-6 sm:space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-slate-700">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 text-amber-400 mb-2 sm:mb-3 relative group">
            <Key className="h-7 w-7 sm:h-8 sm:w-8 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900 flex items-center justify-center">
              <Sparkles className="h-2.5 w-2.5 text-slate-900" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {step === "email" && "Forgot Password"}
            {step === "otp" && "Verify OTP"}
            {step === "reset" && "Reset Password"}
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            {step === "email" &&
              "Enter your email address and we'll send you a verification code"}
            {step === "otp" &&
              `We sent a 6-digit code to ${email || "your email"}`}
            {step === "reset" && "Enter your new password"}
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

        {/* Step 1: Email Form */}
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-100 placeholder-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/30 transition font-mono"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="relative w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-2.5 sm:py-3.5 font-semibold text-sm sm:text-base text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed overflow-hidden group"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Send OTP</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-slate-200 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Login</span>
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: OTP Form */}
        {step === "otp" && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                Verification Code (6-digit OTP)
              </label>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl border bg-slate-950 text-center text-lg sm:text-2xl font-bold font-mono text-amber-400 focus:outline-none focus:ring-2 transition ${
                      digit
                        ? "border-amber-500 ring-1 ring-amber-500/30"
                        : "border-slate-800 focus:border-amber-500"
                    }`}
                    disabled={loading}
                  />
                ))}
              </div>
              <p className="text-center text-[10px] text-slate-500">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otpString.length !== 6}
              className="relative w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-2.5 sm:py-3.5 font-semibold text-sm sm:text-base text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed overflow-hidden group"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Verify OTP</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between">
              <button
                onClick={handleResendOtp}
                disabled={loading || !canResend}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1.5"
              >
                {!canResend ? (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    <span>Resend in {timer}s</span>
                  </>
                ) : (
                  <span>Didn't receive code? Resend</span>
                )}
              </button>

              <button
                onClick={() => setStep("email")}
                className="text-xs text-slate-400 hover:text-slate-200 transition"
              >
                Change Email
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Reset Password */}
        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-100 placeholder-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/30 transition pr-12"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition p-1"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-slate-500" />
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-100 placeholder-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/30 transition pr-12"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition p-1"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                loading ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              }
              className="relative w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-2.5 sm:py-3.5 font-semibold text-sm sm:text-base text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed overflow-hidden group"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Reset Password</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </button>
          </form>
        )}

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
              Secure reset
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
