"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Loader2,
  ShieldCheck,
  Zap,
  Cpu,
  TrendingUp,
  Globe,
  BarChart3,
  Code2,
  Crown,
  Gem,
  AlertTriangle,
  Calendar,
  Timer,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import UpgradeModal from "@/components/layout/UpgradeModal";

import {
  PlanType,
  PLAN_FEATURES,
  PLANS,
  getPlanFeatures,
  getPlan,
  hasMinPlan,
  hasFeature,
  checkUserCapability,
} from "@/lib/plans.config";

// ✅ إعدادات بسيطة للعرض
const PLAN_CONFIG = {
  free: {
    label: "Free",
    icon: ShieldCheck,
    color: "text-slate-400",
    borderColor: "border-slate-700",
    bgColor: "bg-slate-900/50",
    badge: "Starter",
    badgeColor: "text-slate-400 bg-slate-800/50",
  },
  pro: {
    label: "Pro",
    icon: Crown,
    color: "text-sky-400",
    borderColor: "border-sky-500/30",
    bgColor: "bg-sky-950/30",
    badge: "Professional",
    badgeColor: "text-sky-400 bg-sky-500/20",
  },
  extra: {
    label: "Extra",
    icon: Gem,
    color: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-950/30",
    badge: "Elite",
    badgeColor: "text-purple-400 bg-purple-500/20",
  },
};

// ✅ دوال حساب النافذة (24 ساعة متجددة)
const getNextResetTimestamp = (now = new Date()) => {
  const nextReset = new Date(now);
  nextReset.setHours(24, 0, 0, 0);
  return nextReset.getTime();
};

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPlan, setUserPlan] = useState<PlanType>("free");
  const [scanCount, setScanCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [subscription, setSubscription] = useState<{
    expiresAt: string | null;
    isExpiring: boolean;
    daysRemaining: number;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // ✅ حالة نافذة الاستخدام (24 ساعة متجددة)
  const [usageWindow, setUsageWindow] = useState<{
    windowEnd: number | null;
    scansToday: number;
    remainingScans: number | null;
  } | null>(null);
  const [windowCountdown, setWindowCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState<string>("user");

  // ✅ جلب حالة المستخدم
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await api.get("/auth/me", { withCredentials: true });
        if (res.data?.user) {
          const userData = res.data.user;
          setUser(userData);
          setIsLoggedIn(true);
          setUserPlan(userData.plan || "free");
          setScanCount(userData.scanCount || 0);
          setRole(userData.role || "user");

          if (userData.subscription) {
            const expiresAt = userData.subscription.expiresAt;
            if (expiresAt) {
              const expiryDate = new Date(expiresAt);
              const now = new Date();
              const daysRemaining = Math.ceil(
                (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
              );
              setSubscription({
                expiresAt,
                isExpiring: daysRemaining <= 7 && daysRemaining > 0,
                daysRemaining,
              });
            }
          }
        }
      } catch {
        setIsLoggedIn(false);
        setUserPlan("free");
        setRole("user");
      }
    };
    checkSession();
  }, []);

  // ✅ جلب نافذة الاستخدام (24 ساعة متجددة)
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchUsageWindow = async () => {
      try {
        const res = await api.get("/scans/usage-window", {
          withCredentials: true,
        });
        if (res.data?.windowEnd) {
          setUsageWindow({
            windowEnd: new Date(res.data.windowEnd).getTime(),
            scansToday: res.data.scansToday || 0,
            remainingScans: res.data.remainingScans ?? null,
          });
        }
      } catch (err) {
        console.error("Failed to fetch usage window:", err);
      }
    };

    fetchUsageWindow();
  }, [isLoggedIn]);

  // ✅ عداد نافذة الاستخدام (24 ساعة متجددة)
  useEffect(() => {
    if (!usageWindow?.windowEnd) return;

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, usageWindow.windowEnd! - now);
      const totalSeconds = Math.ceil(remaining / 1000);

      if (totalSeconds <= 0) {
        // ✅ عند انتهاء النافذة، أعد جلبها
        if (isLoggedIn) {
          api
            .get("/scans/usage-window", { withCredentials: true })
            .then((res) => {
              if (res.data?.windowEnd) {
                setUsageWindow({
                  windowEnd: new Date(res.data.windowEnd).getTime(),
                  scansToday: res.data.scansToday || 0,
                  remainingScans: res.data.remainingScans ?? null,
                });
              }
            })
            .catch(console.error);
        }
        return;
      }

      setWindowCountdown({
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [usageWindow?.windowEnd, isLoggedIn]);

  // ✅ عداد تنازلي لانتهاء الاشتراك
  useEffect(() => {
    if (!subscription?.expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiryDate = new Date(subscription.expiresAt!);
      const diff = expiryDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft(null);
        setSubscription((prev) => ({ ...prev!, isExpiring: false }));
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [subscription?.expiresAt]);

  // ✅ Focus input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // ✅ معالج الفحص
  const handleScan = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!url.trim()) return;

      setIsSubmitting(true);

      let formattedUrl = url.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }

      router.push(`/scan?url=${encodeURIComponent(formattedUrl)}`);
    },
    [url, router],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && url.trim()) {
      handleScan(e as any);
    }
  };

  const planInfo =
    PLAN_CONFIG[userPlan as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.free;
  const PlanIcon = planInfo.icon;

  const features = getPlanFeatures(userPlan);
  const plan = getPlan(userPlan);

  // ✅ إحصائيات واقعية
  const stats = [
    {
      label: "Security Checks",
      value: "150+",
      icon: ShieldCheck,
    },
    {
      label: "Avg Response",
      value: "< 3s",
      icon: Zap,
    },
    {
      label: "AI Engine",
      value: "Gemini 1.5",
      icon: Cpu,
    },
    {
      label: "Scan Type",
      value: "Non-Invasive",
      icon: ShieldAlert,
    },
  ];

  // ✅ مميزات واقعية بدون ألوان صارخة
  const featuresList = [
    {
      icon: CheckCircle2,
      title: "Deterministic Rules",
      description:
        "Analyzes security headers, cookie flags (Secure, HttpOnly), HTTPS redirection, and TLS configurations strictly.",
    },
    {
      icon: TrendingUp,
      title: "Historical Comparison",
      description:
        "Track posture improvements over time. Compare scans side-by-side to detect regression or newly fixed findings.",
    },
    {
      icon: Lock,
      title: "AI Remediation",
      description:
        "Get clear explanations of security findings with code snippets tailored for NestJS, Express, Laravel, or Nginx.",
    },
    {
      icon: Globe,
      title: "Multi-Protocol Support",
      description:
        "Scan HTTP/HTTPS websites with support for various web servers, frameworks, and cloud platforms.",
    },
    {
      icon: BarChart3,
      title: "Detailed Analytics",
      description:
        "Comprehensive reports with actionable insights, including score breakdowns and improvement suggestions.",
    },
    {
      icon: Code2,
      title: "Developer Friendly",
      description:
        "Clean, well-documented API with exportable reports in CSV and PDF formats for easy integration.",
    },
  ];

  // ✅ شهادات واقعية
  const testimonials = [
    {
      name: "Ahmed Mohamed",
      role: "CTO, TechCorp",
      quote:
        "ScanLens helped us identify critical security gaps in our infrastructure within seconds. The AI remediation suggestions are a game-changer.",
      avatar: "A",
    },
    {
      name: "Sara Ali",
      role: "DevOps Engineer",
      quote:
        "The historical comparison feature is brilliant. We can track our security posture improvement across multiple deployments.",
      avatar: "S",
    },
    {
      name: "Khaled Hassan",
      role: "Security Lead",
      quote:
        "Best security scanning tool I've used. The detailed reports with actionable insights save us hours of manual analysis.",
      avatar: "K",
    },
  ];

  // ✅ عرض تحذير انتهاء الاشتراك
  const renderSubscriptionWarning = () => {
    if (!isLoggedIn || role === "admin") return null;
    if (!subscription?.isExpiring || !subscription?.expiresAt) return null;

    const isExpired = subscription.daysRemaining <= 0;
    const isCritical = subscription.daysRemaining <= 3;

    if (isExpired) {
      return (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-300">
                  Subscription Expired
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your {planInfo.label} plan has expired. Renew to regain access
                  to premium features.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Renew Subscription
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`p-4 rounded-xl border mb-6 ${
          isCritical
            ? "bg-amber-950/30 border-amber-900/50"
            : "bg-slate-900/50 border-slate-800"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Calendar
              className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                isCritical ? "text-amber-400" : "text-slate-400"
              }`}
            />
            <div>
              <p className="text-sm font-semibold text-white">
                {isCritical
                  ? "Subscription Expiring Soon"
                  : "Subscription Renewal"}
                <span
                  className={`ml-2 text-xs ${
                    isCritical ? "text-amber-400" : "text-slate-400"
                  }`}
                >
                  {subscription.daysRemaining} days remaining
                </span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Your {planInfo.label} plan will expire in{" "}
                {subscription.daysRemaining} days. Renew to avoid interruption.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {timeLeft && (
              <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                <Timer className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-mono text-slate-300">
                  {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
                </span>
              </div>
            )}
            <button
              onClick={() => setShowUpgradeModal(true)}
              className={`px-4 py-2 rounded-lg text-white text-xs font-semibold transition-colors whitespace-nowrap ${
                isCritical
                  ? "bg-amber-600 hover:bg-amber-500"
                  : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              Renew
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ✅ رسالة ترحيب حسب الصلاحية والخطة
  const getWelcomeMessage = () => {
    if (!isLoggedIn) return null;

    if (role === "admin") {
      return (
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">
                Admin Access
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Full Control
                </span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                You have full administrative privileges.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            Admin Panel →
          </button>
        </div>
      );
    }

    const planMessages = {
      free: {
        title: "Free Plan",
        message: "Upgrade to unlock premium features.",
        action: "View Plans",
      },
      pro: {
        title: "Pro Plan",
        message: "Access advanced features and priority support.",
        action: "View Plans",
      },
      extra: {
        title: "Extra Plan",
        message: "Unlimited access to all premium features.",
        action: "Manage",
      },
    };

    const msg =
      planMessages[userPlan as keyof typeof planMessages] || planMessages.free;

    return (
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PlanIcon className={`h-5 w-5 ${planInfo.color} flex-shrink-0`} />
          <div>
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              {msg.title}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${planInfo.badgeColor}`}
              >
                {planInfo.badge}
              </span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{msg.message}</p>
          </div>
        </div>
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
        >
          {msg.action}
        </button>
      </div>
    );
  };

  return (
    <div className="relative pt-12 sm:pt-20 pb-16 sm:pb-24">
      {/* ✅ خلفية بسيطة — بدون جزيئات متحركة */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(56,189,248,0.06),transparent)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-6xl">
        {/* ✅ تحذير انتهاء الاشتراك */}
        {renderSubscriptionWarning()}

        {/* ✅ رسالة ترحيب */}
        {getWelcomeMessage()}

        {/* Hero Title */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Security scanning platform — v2.0
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            Know how secure your website{" "}
            <span className="text-sky-400">really is.</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Scan HTTP headers, SSL/TLS setups, cookies, and configuration rules
            in seconds. Get AI-guided fixes tailored for your backend stack.
          </p>
        </div>

        {/* Scan Input Form */}
        <div className="max-w-2xl mx-auto mt-10">
          <form
            onSubmit={handleScan}
            className="flex flex-col sm:flex-row gap-2 p-2 bg-slate-900/80 border border-slate-800 focus-within:border-slate-700 rounded-xl transition-colors"
          >
            <div className="relative flex-1 flex items-center">
              <Globe className="absolute left-4 h-4 w-4 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                placeholder="example.com or https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                className="w-full bg-transparent pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-50 font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !url.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <span>Scan Website</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* ✅ Subtext مع نافذة 24 ساعة */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 mt-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              No registration required
            </span>
            <span>•</span>
            {isLoggedIn ? (
              <>
                <span className="flex items-center gap-1.5">
                  <PlanIcon className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-slate-400">{planInfo.label} Plan</span>
                </span>
                {/* ✅ نافذة 24 ساعة متجددة */}
                {usageWindow && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <RefreshCw className="h-3 w-3 text-slate-500" />
                      Renews in{" "}
                      <span className="font-mono text-slate-300">
                        {String(windowCountdown.hours).padStart(2, "0")}:
                        {String(windowCountdown.minutes).padStart(2, "0")}:
                        {String(windowCountdown.seconds).padStart(2, "0")}
                      </span>
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-slate-500" />2 free guest
                scans
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mt-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-center"
              >
                <Icon className="h-4 w-4 text-slate-400 mx-auto mb-2" />
                <p className="text-lg font-semibold text-white">{stat.value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Features */}
        <div className="max-w-5xl mx-auto mt-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Comprehensive Security Analysis
            </h2>
            <p className="text-sm text-slate-400">
              Everything you need to secure your web applications
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuresList.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700 transition-colors space-y-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-sky-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Testimonials */}
        <div className="max-w-5xl mx-auto mt-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Trusted by Developers
            </h2>
            <p className="text-sm text-slate-400">
              Join thousands of developers securing their applications
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/60"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {testimonial.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "{testimonial.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA — بسيط وجدي */}
        <div className="max-w-3xl mx-auto mt-20">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">
              {userPlan === "extra"
                ? "You're Already an Elite Member"
                : userPlan === "pro"
                  ? "Upgrade to Extra for Unlimited Power"
                  : "Ready to secure your website?"}
            </h3>
            <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
              {userPlan === "extra"
                ? "Enjoy unlimited scans, priority support, and all premium features."
                : userPlan === "pro"
                  ? "Get unlimited scans, advanced AI fixes, and white-label reports."
                  : "Start scanning now and get actionable insights in seconds. No credit card required."}
            </p>
            {!isLoggedIn ? (
              <button
                onClick={() => router.push("/login")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-colors"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : userPlan === "extra" ? (
              <button
                onClick={() => router.push("/settings")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors"
              >
                <span>Manage Settings</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-colors"
              >
                <Crown className="h-4 w-4" />
                <span>View Plans</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={userPlan}
        userEmail={user?.email}
        onUpgradeSuccess={(plan: PlanType) => {
          setUserPlan(plan);
          setUser({ ...user, plan });
          setIsLoggedIn(true);
          setSubscription(null);
          setTimeLeft(null);
        }}
      />
    </div>
  );
}
