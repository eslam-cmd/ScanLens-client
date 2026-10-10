// client/app/verify/page.tsx
"use client";

import { useState, useEffect, Suspense, useRef } from "react";
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
  Check,
  X,
  Loader2,
  Copy,
} from "lucide-react";
import { api } from "@/lib/api";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const emailParam = searchParams.get("email") || "";
  const devOtpParam = searchParams.get("devOtp") || "";

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(true);

  const [adminOtp, setAdminOtp] = useState<string | null>(devOtpParam || null);
  const [copiedCode, setCopiedCode] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
    if (devOtpParam) {
      setAdminOtp(devOtpParam);
      console.log("🔑 [ADMIN OTP from URL]:", devOtpParam);
    }
  }, [emailParam, devOtpParam]);

  // Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!canResend && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
      setTimer(60);
    }
    return () => clearInterval(interval);
  }, [canResend, timer]);

  // Auto-focus first input
  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, []);

  // Clear messages after delay
  useEffect(() => {
    if (error || successMsg) {
      const t = setTimeout(() => {
        setError("");
        setSuccessMsg("");
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [error, successMsg]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      const fullCode = code.join("");
      if (fullCode.length === 6) handleVerify(e as any);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      setCode(pastedData.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  // ✅ تعبئة الحقل تلقائياً
  const handleAutoFill = () => {
    if (adminOtp && adminOtp.length === 6) {
      setCode(adminOtp.split(""));
      inputRefs.current[5]?.focus();
      setSuccessMsg("Code auto-filled. Click Verify to continue.");
    }
  };

  // ✅ نسخ الرمز
  const handleCopyCode = async () => {
    if (!adminOtp) return;
    try {
      await navigator.clipboard.writeText(adminOtp);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
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

      setSuccessMsg("Account verified successfully! Redirecting...");
      const userRole = response.data?.user?.role;

      setTimeout(() => {
        if (userRole === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/history";
        }
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
      const res = await api.post("/auth/resend-otp", { email });
      setSuccessMsg("A new verification code has been sent to your email.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

      if (res.data?.devOtp) {
        setAdminOtp(res.data.devOtp);
        console.log("🔑 [NEW ADMIN OTP]:", res.data.devOtp);
      }
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
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 mb-4">
            <KeyRound className="h-6 w-6 text-sky-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-1.5">
            Verify your account
          </h2>
          <p className="text-sm text-slate-400">
            We sent a verification code to{" "}
            <span className="font-mono text-slate-300">
              {email || "your email"}
            </span>
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-5">
          {/* ✅ Admin Test Code */}
          {adminOtp && (
            <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                  Admin Test Code
                </span>
                <span className="text-[10px] text-amber-500/70">
                  For testing only
                </span>
              </div>

              {/* Code Display */}
              <div className="flex items-center justify-center gap-1.5 mb-3">
                {adminOtp.split("").map((digit, idx) => (
                  <span
                    key={idx}
                    className="w-9 h-11 flex items-center justify-center rounded-lg bg-slate-950 border border-amber-800/60 text-lg font-mono font-semibold text-amber-300"
                  >
                    {digit}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium py-2 transition-colors"
                >
                  Auto-fill Code
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Copy code"
                >
                  {copiedCode ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}

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
          <form onSubmit={handleVerify} className="space-y-4" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-slate-600 focus:outline-none transition-colors font-mono"
              />
            </div>

            {/* OTP Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                Verification Code
              </label>
              <div className="flex items-center justify-center gap-2">
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
                    className={`w-11 h-13 rounded-lg border bg-slate-950 text-center text-xl font-semibold font-mono text-slate-200 focus:outline-none transition-colors ${
                      digit
                        ? "border-slate-600"
                        : "border-slate-800 focus:border-slate-600"
                    }`}
                    disabled={loading}
                  />
                ))}
              </div>
              <p className="text-center text-xs text-slate-500 pt-1">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || codeString.length !== 6}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-500 py-2.5 font-medium text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verify Account</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-sm">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resending || !canResend}
              className="text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
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
                    : "Resend code"}
              </span>
            </button>
          </div>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to sign in</span>
          </Link>
        </div>

        {/* Trust Badge */}
        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-600">
          <Lock className="h-3 w-3" />
          <span>Code expires in 10 minutes</span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center text-slate-500 text-sm">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            <span>Loading...</span>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
