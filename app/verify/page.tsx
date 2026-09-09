// client/app/verify/page.tsx
"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  Mail,
  Lock,
  Clock,
  Sparkles,
  Check,
  X,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(true);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Countdown timer for resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!canResend && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      setTimer(60);
    }
    return () => clearInterval(interval);
  }, [canResend, timer]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Clear messages after delay
  useEffect(() => {
    if (error || successMsg) {
      const timer = setTimeout(() => {
        setError("");
        setSuccessMsg("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMsg]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      const fullCode = code.join("");
      if (fullCode.length === 6) {
        handleVerify(e as any);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setCode(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");

    if (!fullCode || fullCode.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!email) {
      setError("Email address is required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await api.post("/auth/verify-otp", {
        email,
        code: fullCode,
      });

      // ✅ التوكن سيتم حفظه تلقائياً في localStorage عن طريق الـ Interceptor

      setSuccessMsg("Account verified successfully! Redirecting...");
      setTimeout(() => {
        window.location.href = "/history";
      }, 1000);
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(
        Array.isArray(message)
          ? message.join(", ")
          : message || "Invalid verification code. Please try again.",
      );
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError("Email address is required to resend code.");
      return;
    }

    setResending(true);
    setError("");
    setSuccessMsg("");
    setCanResend(false);
    setTimer(60);

    try {
      await api.post("/auth/resend-otp", { email });
      setSuccessMsg("A new verification code has been sent to your email.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to resend verification code.",
      );
      setCanResend(true);
    } finally {
      setResending(false);
    }
  };

  const codeString = code.join("");

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md space-y-6 sm:space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-slate-700">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/20 text-sky-400 mb-2 sm:mb-3 relative group">
            <KeyRound className="h-7 w-7 sm:h-8 sm:w-8 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900 flex items-center justify-center">
              <Sparkles className="h-2.5 w-2.5 text-slate-900" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Verify Your Account
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            We sent a verification code to{" "}
            <span className="font-mono text-sky-400 font-semibold">
              {email || "your email"}
            </span>
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
        <form onSubmit={handleVerify} className="space-y-5" noValidate>
          {/* Email */}
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
            />
          </div>

          {/* OTP Code Inputs */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              Verification Code (6-digit OTP)
            </label>
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl border bg-slate-950 text-center text-lg sm:text-2xl font-bold font-mono text-sky-400 focus:outline-none focus:ring-2 transition ${
                    digit
                      ? "border-sky-500 ring-1 ring-sky-500/30"
                      : "border-slate-800 focus:border-sky-500"
                  }`}
                  disabled={loading}
                />
              ))}
            </div>
            <p className="text-center text-[10px] text-slate-500">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || codeString.length !== 6}
            className="relative w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 py-2.5 sm:py-3.5 font-semibold text-sm sm:text-base text-white shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed overflow-hidden group"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Verify Account</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </>
            )}
          </button>
        </form>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80 pt-4 text-xs">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resending || !canResend}
            className="text-sky-400 hover:text-sky-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
          >
            {resending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : !canResend ? (
              <Clock className="h-3.5 w-3.5" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            <span>
              {resending
                ? "Sending..."
                : !canResend
                  ? `Resend in ${timer}s`
                  : "Didn't receive code? Resend"}
            </span>
          </button>

          <Link
            href="/login"
            className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>

        {/* Trust Badge */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] sm:text-xs text-slate-500">
              Secure verification
            </span>
          </div>
          <div className="w-px h-4 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] sm:text-xs text-slate-500">
              Code expires in 10 min
            </span>
          </div>
          <div className="w-px h-4 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <Check className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] sm:text-xs text-slate-500">
              Email verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center text-slate-400 text-sm">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
            <span>Loading verification form...</span>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
