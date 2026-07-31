"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Lock,
  FileSearch,
  Sparkles,
  Loader2,
  ShieldCheck,
  Zap,
  Cpu,
  TrendingUp,
  Globe,
  Server,
  Award,
  Clock,
  Star,
  ChevronRight,
  BarChart3,
  Settings,
  Code2,
  Terminal,
  Users,
  Rocket,
  Flame,
  Crown,
  Gem,
  Diamond,
  Medal,
  Trophy,
  Sparkle,
  BadgeCheck,
  Infinity,
  AlertTriangle,
  Calendar,
  Timer,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import UpgradeModal from "@/components/layout/UpgradeModal";

// ✅ استيراد من الملف المركزي للخطط
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

// ✅ تعريف PLAN_CONFIG للعرض فقط
const PLAN_CONFIG = {
  free: {
    label: "Free",
    icon: ShieldCheck,
    color: "text-slate-400",
    borderColor: "border-slate-700",
    bgColor: "bg-slate-900/50",
    badge: "✨ Starter",
    badgeColor: "text-slate-400 bg-slate-800/50",
  },
  pro: {
    label: "Pro",
    icon: Crown,
    color: "text-sky-400",
    borderColor: "border-sky-500/30",
    bgColor: "bg-sky-950/30",
    badge: "⭐ Professional",
    badgeColor: "text-sky-400 bg-sky-500/20",
  },
  extra: {
    label: "Extra",
    icon: Gem,
    color: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-950/30",
    badge: "💎 Elite",
    badgeColor: "text-purple-400 bg-purple-500/20",
  },
};

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPlan, setUserPlan] = useState<PlanType>("free");
  const [scanCount, setScanCount] = useState(0);
  const [animatedStats, setAnimatedStats] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [expiringSoon, setExpiringSoon] = useState<any[]>([]);
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
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState<string>("user");

  // ✅ جلب حالة المستخدم مع الصلاحيات والخطة والاشتراك
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

          // ✅ جلب معلومات الاشتراك
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
  useEffect(() => {
    const fetchExpiring = async () => {
      if (!isLoggedIn) return;
      try {
        const res = await api.get("/subscription/expiring", {
          withCredentials: true,
        });
        setExpiringSoon(res.data);
      } catch {
        // تجاهل
      }
    };
    fetchExpiring();
  }, [isLoggedIn]);

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

  // Animate stats on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedStats(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  const renderExpiringSubscriptions = () => {
    if (!isLoggedIn || role !== "admin") return null;
    if (expiringSoon.length === 0) return null;

    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              ⚠️ Subscriptions Expiring Soon
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {expiringSoon.length} users
              </span>
            </p>
            <div className="mt-2 space-y-1">
              {expiringSoon.slice(0, 5).map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between text-xs text-slate-400"
                >
                  <span>{user.email}</span>
                  <span className="text-amber-400 font-mono">
                    {user.daysRemaining} days left
                  </span>
                </div>
              ))}
              {expiringSoon.length > 5 && (
                <p className="text-xs text-slate-500">
                  +{expiringSoon.length - 5} more users
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

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

  // ✅ الحصول على معلومات الخطة
  const planInfo =
    PLAN_CONFIG[userPlan as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.free;
  const PlanIcon = planInfo.icon;

  // ✅ استخدام الدوال من الملف المركزي
  const features = getPlanFeatures(userPlan);
  const plan = getPlan(userPlan);

  const stats = [
    {
      label: "Security Checks",
      value: "150+",
      icon: ShieldCheck,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
    },
    {
      label: "Avg Response Time",
      value: "< 3s",
      icon: Zap,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "AI Engine",
      value: "Gemini 1.5",
      icon: Cpu,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      label: "Scan Type",
      value: "Non-Invasive",
      icon: ShieldAlert,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
  ];

  const featuresList = [
    {
      icon: CheckCircle2,
      title: "Deterministic Rules",
      description:
        "Analyzes security headers, cookie flags (Secure, HttpOnly), HTTPS redirection, and TLS configurations strictly.",
      color: "sky",
      gradient: "from-sky-500/20 to-sky-600/10",
      border: "border-sky-500/30",
    },
    {
      icon: TrendingUp,
      title: "Historical Comparison",
      description:
        "Track posture improvements over time. Compare scans side-by-side to detect regression or newly fixed findings.",
      color: "indigo",
      gradient: "from-indigo-500/20 to-indigo-600/10",
      border: "border-indigo-500/30",
    },
    {
      icon: Lock,
      title: "AI Remediation",
      description:
        "Get clear explanations of security findings with code snippets tailored for NestJS, Express, Laravel, or Nginx.",
      color: "emerald",
      gradient: "from-emerald-500/20 to-emerald-600/10",
      border: "border-emerald-500/30",
    },
    {
      icon: Globe,
      title: "Multi-Protocol Support",
      description:
        "Scan HTTP/HTTPS websites with support for various web servers, frameworks, and cloud platforms.",
      color: "purple",
      gradient: "from-purple-500/20 to-purple-600/10",
      border: "border-purple-500/30",
    },
    {
      icon: BarChart3,
      title: "Detailed Analytics",
      description:
        "Comprehensive reports with actionable insights, including score breakdowns and improvement suggestions.",
      color: "rose",
      gradient: "from-rose-500/20 to-rose-600/10",
      border: "border-rose-500/30",
    },
    {
      icon: Code2,
      title: "Developer Friendly",
      description:
        "Clean, well-documented API with exportable reports in CSV and PDF formats for easy integration.",
      color: "cyan",
      gradient: "from-cyan-500/20 to-cyan-600/10",
      border: "border-cyan-500/30",
    },
  ];

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
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 mb-6 animate-pulse">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-500/20 flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-rose-400 flex items-center gap-2">
                  ⚠️ Subscription Expired
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Action Required
                  </span>
                </p>
                <p className="text-xs text-slate-400">
                  Your {planInfo.label} plan has expired. You've been downgraded
                  to Free plan. Renew now to regain access to premium features.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-semibold transition shadow-lg shadow-rose-500/20 whitespace-nowrap"
            >
              🔄 Renew Subscription
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`p-4 sm:p-5 rounded-2xl border ${
          isCritical
            ? "bg-amber-500/10 border-amber-500/30"
            : "bg-amber-500/5 border-amber-500/20"
        } mb-6`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-xl ${
                isCritical ? "bg-amber-500/20" : "bg-amber-500/10"
              } flex-shrink-0`}
            >
              <Calendar
                className={`h-6 w-6 ${
                  isCritical ? "text-amber-400" : "text-amber-300"
                }`}
              />
            </div>
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                {isCritical
                  ? "⚠️ Subscription Expiring Soon!"
                  : "⏳ Subscription Expiring"}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isCritical
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                  }`}
                >
                  {subscription.daysRemaining} days left
                </span>
              </p>
              <p className="text-xs text-slate-400">
                Your {planInfo.label} plan will expire in{" "}
                <span className="text-amber-400 font-semibold">
                  {subscription.daysRemaining} days
                </span>
                . Renew now to avoid interruption.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* ✅ عداد تنازلي */}
            {timeLeft && (
              <div className="flex items-center gap-1 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
                <Timer className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs font-mono text-amber-400">
                  {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m{" "}
                  {timeLeft.seconds}s
                </span>
              </div>
            )}
            <button
              onClick={() => setShowUpgradeModal(true)}
              className={`px-4 py-2 rounded-xl text-white text-xs font-semibold transition whitespace-nowrap shadow-lg ${
                isCritical
                  ? "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-500/20"
                  : "bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 shadow-sky-500/20"
              }`}
            >
              {isCritical ? "🔴 Renew Now" : "🔄 Renew"}
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
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 p-4 sm:p-5 rounded-2xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20">
              <ShieldCheck className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                👑 Admin Access
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Full Control
                </span>
              </p>
              <p className="text-xs text-slate-400">
                You have full administrative privileges. Manage users, licenses,
                and monitor all activities.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-semibold transition shadow-lg shadow-amber-500/20 whitespace-nowrap"
          >
            🚀 Go to Admin Panel
          </button>
        </div>
      );
    }

    const planMessages = {
      free: {
        icon: ShieldCheck,
        color: "text-slate-400",
        bg: "bg-slate-900/50",
        border: "border-slate-700",
        title: "Free Plan",
        message: "You're on the Free plan. Upgrade to unlock premium features.",
        action: "Upgrade Now →",
      },
      pro: {
        icon: Crown,
        color: "text-sky-400",
        bg: "bg-sky-950/30",
        border: "border-sky-500/30",
        title: "Pro Plan",
        message:
          "You're enjoying the Pro plan! Access advanced features and priority support.",
        action: "Go Extra →",
      },
      extra: {
        icon: Gem,
        color: "text-purple-400",
        bg: "bg-purple-950/30",
        border: "border-purple-500/30",
        title: "Extra Plan",
        message:
          "🌟 You're on the Elite Extra plan! Unlimited access to all premium features.",
        action: "Manage Subscription →",
      },
    };

    const msg =
      planMessages[userPlan as keyof typeof planMessages] || planMessages.free;
    const Icon = msg.icon;

    return (
      <div
        className={`p-4 sm:p-5 rounded-2xl border ${msg.border} ${msg.bg} mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${msg.bg} border ${msg.border}`}>
            <Icon className={`h-6 w-6 ${msg.color}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-white flex items-center gap-2">
              {msg.title}
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${msg.border} ${msg.color}`}
              >
                {userPlan.toUpperCase()}
              </span>
            </p>
            <p className="text-xs text-slate-400">{msg.message}</p>
          </div>
        </div>
        <button
          onClick={() => setShowUpgradeModal(true)}
          className={`px-4 py-2 rounded-xl text-white text-xs font-semibold transition whitespace-nowrap shadow-lg ${
            userPlan === "free"
              ? "bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 shadow-sky-500/20"
              : userPlan === "pro"
                ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-purple-500/20"
                : "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-500/20"
          }`}
        >
          {msg.action}
        </button>
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden pt-8 sm:pt-12 pb-16 sm:pb-24">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] sm:w-[1000px] h-[350px] sm:h-[450px] bg-gradient-to-b from-sky-500/15 via-indigo-500/10 to-transparent blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3rem_3rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-sky-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${10 + Math.random() * 20}s`,
              animationDelay: `${Math.random() * 10}s`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        {/* ✅ تحذير انتهاء الاشتراك */}
        {renderSubscriptionWarning()}

        {/* ✅ رسالة ترحيب حسب الصلاحية والخطة */}
        {getWelcomeMessage()}

        {/* Hero Banner Badge */}
        <div className="flex justify-center mb-4 sm:mb-6 animate-fade-down">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-[10px] sm:text-xs font-semibold backdrop-blur-md shadow-sm hover:bg-sky-500/20 transition cursor-default">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-sky-400 animate-pulse" />
            <span>Automated Security Posture Analysis</span>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Know how secure your website <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-indigo-500 animate-gradient">
              really is.
            </span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto">
            Scan HTTP headers, SSL/TLS setups, cookies, and configuration rules
            in seconds. Get AI-guided fixes tailored for your backend stack.
          </p>
        </div>

        {/* Quick Scan Input Form */}
        <div className="max-w-xl mx-auto mt-8 sm:mt-10">
          <form
            onSubmit={handleScan}
            className="group relative flex flex-col sm:flex-row gap-2 p-1.5 sm:p-2 bg-slate-900/90 border border-slate-800 focus-within:border-sky-500/50 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-slate-700"
          >
            <div className="relative flex-1 flex items-center">
              <div className="absolute left-3 sm:left-4 text-slate-500">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="example.com or https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                className="w-full bg-transparent pl-9 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-50 font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !url.trim()}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-5 sm:px-7 py-3 sm:py-3.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-sky-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <span>Scan Website</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* ✅ Dynamic Subtext مع الخطة */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-500 mt-3 sm:mt-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
              No registration required
            </span>
            <span className="hidden xs:inline">•</span>
            {isLoggedIn ? (
              <span className="flex items-center gap-1.5">
                <PlanIcon
                  className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${planInfo.color}`}
                />
                <span className={planInfo.color}>{planInfo.label} Plan</span>
                {userPlan !== "free" && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${planInfo.badgeColor}`}
                  >
                    {planInfo.badge}
                  </span>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-500" />2
                free guest scans
              </span>
            )}
            {scanCount > 0 && isLoggedIn && (
              <>
                <span className="hidden xs:inline">•</span>
                <span className="text-emerald-400 font-mono text-[10px] sm:text-xs">
                  {scanCount} scans completed
                </span>
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto mt-8 sm:mt-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`p-3 sm:p-4 rounded-xl bg-slate-900/40 border border-slate-800/50 text-center transition-all duration-500 ${
                  animatedStats
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                } hover:border-slate-700 hover:bg-slate-900/60`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div
                  className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${stat.bg} border border-slate-800/50 mb-1.5 sm:mb-2`}
                >
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                </div>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {stat.value}
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mt-12 sm:mt-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Comprehensive Security Analysis
            </h2>
            <p className="text-sm text-slate-400">
              Everything you need to secure your web applications
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {featuresList.map((feature, index) => {
              const Icon = feature.icon;
              const colorMap = {
                sky: "text-sky-400 border-sky-500/30",
                indigo: "text-indigo-400 border-indigo-500/30",
                emerald: "text-emerald-400 border-emerald-500/30",
                purple: "text-purple-400 border-purple-500/30",
                rose: "text-rose-400 border-rose-500/30",
                cyan: "text-cyan-400 border-cyan-500/30",
              };

              return (
                <div
                  key={index}
                  className="group p-5 sm:p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-opacity-100 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/5 space-y-3 hover:-translate-y-1"
                  style={{
                    transitionDelay: `${index * 50}ms`,
                  }}
                >
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${feature.gradient} border ${feature.border} flex items-center justify-center ${colorMap[feature.color as keyof typeof colorMap]} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-white transition">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Testimonials */}
        <div className="max-w-5xl mx-auto mt-12 sm:mt-16">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Trusted by Developers
            </h2>
            <p className="text-sm text-slate-400">
              Join thousands of developers securing their applications
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-4 sm:p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-sm">
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
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-0.5 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-3 w-3 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ CTA Section حسب الخطة */}
        <div className="max-w-4xl mx-auto mt-12 sm:mt-16">
          <div
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br border p-6 sm:p-10 text-center ${
              userPlan === "extra"
                ? "from-purple-500/20 via-pink-500/10 to-transparent border-purple-500/30"
                : userPlan === "pro"
                  ? "from-sky-500/20 via-indigo-500/10 to-transparent border-sky-500/30"
                  : "from-sky-500/10 via-indigo-500/5 to-transparent border-sky-500/20"
            }`}
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              {isLoggedIn && userPlan === "extra" && (
                <div className="flex justify-center mb-3">
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 text-xs font-semibold border border-purple-500/30">
                    🏆 Elite Member
                  </span>
                </div>
              )}
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {userPlan === "extra"
                  ? "🌟 You're Already an Elite Member!"
                  : userPlan === "pro"
                    ? "🚀 Upgrade to Extra for Unlimited Power"
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
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40"
                >
                  <Rocket className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Get Started Now</span>
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              ) : userPlan === "extra" ? (
                <button
                  onClick={() => router.push("/settings")}
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
                >
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Manage Settings</span>
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
                >
                  <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Upgrade Now</span>
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
            </div>
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
          // ✅ تحديث حالة الاشتراك بعد الترقية
          setSubscription(null);
          setTimeLeft(null);
        }}
      />
    </div>
  );
}
