// client/app/subscription/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Crown,
  Sparkles,
  Gem,
  Check,
  X,
  Loader2,
  AlertCircle,
  ArrowRight,
  CreditCard,
  Zap,
  Users,
  Clock,
  Lock,
  Shield,
  Star,
  Rocket,
  Key,
  Scan,
  Award,
  DollarSign,
  Calendar,
  TrendingUp,
  PieChart,
  Settings,
  BadgeCheck,
  AlertTriangle,
  Timer,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import UpgradeModal from "@/components/layout/UpgradeModal";
import { Infinity as InfinityIcon } from "lucide-react";

// ✅ استيراد من الملف المركزي للخطط
import {
  PlanType,
  BillingCycle,
  PlanFeatures,
  PLAN_FEATURES,
  getPlanFeatures,
  getPlan,
  hasMinPlan,
  hasFeature,
  checkUserCapability,
  getHistoryRetention,
  getMaxScans,
  getPlanDisplayName,
  getPlanIcon,
  isPaidPlan,
  getPlanPrice,
  getAllPlans,
  PLANS,
} from "@/lib/plans.config";

export default function SubscriptionPage() {
  const [user, setUser] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanType>("free");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [verifyingLicense, setVerifyingLicense] = useState(false);
  const [licenseError, setLicenseError] = useState("");
  const [licenseSuccess, setLicenseSuccess] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // ✅ حالة الاشتراك والعداد
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

  // ✅ الحصول على جميع الخطط من الملف المركزي
  const allPlans = useMemo(() => {
    return getAllPlans();
  }, []);

  // ✅ الحصول على خطة المستخدم الحالية
  const currentPlanData = useMemo(() => {
    return getPlan(currentPlan);
  }, [currentPlan]);

  const currentPlanFeatures = useMemo(() => {
    return getPlanFeatures(currentPlan);
  }, [currentPlan]);

  // ✅ حساب التوفير السنوي
  const savings = useMemo(() => {
    const proPlan = getPlan("pro");
    const monthlyTotal = proPlan.price * 12;
    const savingsAmount = monthlyTotal - proPlan.priceYearly;
    return {
      amount: savingsAmount,
      percentage: Math.round((savingsAmount / monthlyTotal) * 100),
    };
  }, []);

  // ✅ جلب بيانات المستخدم مع التحقق من التسجيل
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await api.get("/auth/me", { withCredentials: true });
        if (res.data?.user) {
          const userData = res.data.user;
          setUser(userData);
          setCurrentPlan(userData.plan || "free");

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
        } else {
          router.push("/login");
        }
      } catch (err: any) {
        console.error("Auth error:", err);
        if (err.response?.status === 401) {
          router.push("/login");
        } else {
          setError("Failed to load user data");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

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

  // ✅ عرض تحذير انتهاء الاشتراك
  const renderSubscriptionWarning = () => {
    if (!user || user?.role === "admin") return null;
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
                  Your {currentPlanFeatures.name} plan has expired. Renew now to
                  regain access to premium features.
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
                Your {currentPlanFeatures.name} plan will expire in{" "}
                <span className="text-amber-400 font-semibold">
                  {subscription.daysRemaining} days
                </span>
                . Renew now to avoid interruption.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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

  // ✅ التحقق من License Key
  const handleVerifyLicense = async () => {
    if (!licenseKey.trim()) {
      setLicenseError("Please enter a valid license key");
      return;
    }

    setVerifyingLicense(true);
    setLicenseError("");
    setLicenseSuccess("");

    try {
      const res = await api.post("/subscription/verify-license", {
        licenseKey: licenseKey.trim(),
        email: user?.email,
      });

      if (res.data.valid) {
        setLicenseSuccess(
          `License verified! Upgrading to ${res.data.plan} plan...`,
        );
        setCurrentPlan(res.data.plan);
        setUser({ ...user, plan: res.data.plan });
        setLicenseKey("");
        // ✅ تحديث حالة الاشتراك
        setSubscription(null);
        setTimeLeft(null);
        setTimeout(() => {
          setShowLicenseModal(false);
          setLicenseSuccess("");
        }, 2000);
      }
    } catch (err: any) {
      setLicenseError(err.response?.data?.message || "Invalid license key");
    } finally {
      setVerifyingLicense(false);
    }
  };

  // ✅ دالة الترقية (من خلال الموديل)
  const handleUpgrade = async (planId: PlanType) => {
    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/subscription/create-checkout", {
        plan: planId,
        billingCycle,
        email: user?.email,
      });

      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to initiate checkout");
    } finally {
      setProcessing(false);
    }
  };

  // ✅ دالة مساعدة لتنسيق القيم
  const formatLimitValue = (value: any): string => {
    if (value === Infinity || value === "∞") return "∞";
    if (typeof value === "boolean") return value ? "✅" : "❌";
    if (typeof value === "number") return String(value);
    return String(value);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-sky-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Crown className="h-7 w-7 text-amber-400" />
            Subscription Plans
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Choose the perfect plan for your security needs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
          <button
            onClick={() => setShowLicenseModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-semibold transition border border-amber-500/20"
          >
            <Key className="h-4 w-4" />
            <span>License</span>
          </button>
        </div>
      </div>

      {/* ✅ تحذير انتهاء الاشتراك */}
      {renderSubscriptionWarning()}

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 mb-4">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError("")}
            className="text-rose-400/60 hover:text-rose-400 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-4">
          <Check className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="flex-1">{success}</span>
          <button
            onClick={() => setSuccess("")}
            className="text-emerald-400/60 hover:text-emerald-400 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Current Plan Status */}
      <div
        className={`p-5 rounded-2xl ${currentPlanFeatures.bgColor} border ${currentPlanFeatures.borderColor} mb-8`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl bg-gradient-to-br ${currentPlanData.color} bg-opacity-20`}
            >
              <currentPlanData.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Current: {currentPlanFeatures.name}
                {currentPlanData.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {currentPlanData.badge}
                  </span>
                )}
              </h3>
              <p className="text-sm text-slate-400">
                {currentPlan === "free"
                  ? "Upgrade to unlock more features"
                  : `Enjoy all premium features on the ${currentPlanFeatures.name} plan`}
              </p>
            </div>
          </div>
          {currentPlan !== "extra" && (
            <button
              onClick={() => {
                setSelectedPlan(currentPlan === "free" ? "pro" : "extra");
                setShowUpgradeModal(true);
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-sm font-semibold transition shadow-lg shadow-sky-500/20 whitespace-nowrap"
            >
              {currentPlan === "free" ? "Upgrade Now" : "Go Extra"}
            </button>
          )}
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`text-sm font-medium transition px-4 py-2 rounded-lg ${
            billingCycle === "monthly"
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("yearly")}
          className={`relative text-sm font-medium transition px-4 py-2 rounded-lg ${
            billingCycle === "yearly"
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Yearly
          <span className="absolute -top-2 -right-2 text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Save {savings.percentage}%
          </span>
        </button>
      </div>

      {/* Plans Grid - 3 Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {allPlans.map((plan) => {
          const Icon = plan.icon;
          const planFeatures = getPlanFeatures(plan.id);
          const isCurrent = currentPlan === plan.id;
          const isSelected = selectedPlan === plan.id;
          const price = getPlanPrice(plan.id, billingCycle);

          return (
            <div
              key={plan.id}
              className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                isCurrent
                  ? "border-sky-500/50 bg-sky-500/5 shadow-lg shadow-sky-500/10"
                  : isSelected
                    ? "border-sky-500/30 bg-sky-500/5"
                    : "border-slate-800 bg-slate-900/40 hover:scale-[1.02] hover:border-slate-700"
              } ${plan.recommended ? "ring-2 ring-sky-500/30" : ""}`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-[10px] font-semibold">
                  RECOMMENDED
                </div>
              )}

              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`p-2.5 rounded-xl bg-gradient-to-br ${plan.color} bg-opacity-20`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{planFeatures.name}</h4>
                  {plan.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {plan.badge}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-4">{plan.description}</p>

              <div className="mb-4">
                <span className="text-3xl font-bold text-white">
                  {plan.id === "free" ? "Free" : price}
                </span>
                {plan.id !== "free" && (
                  <span className="text-sm text-slate-400">
                    {" "}
                    / {billingCycle === "monthly" ? "mo" : "yr"}
                  </span>
                )}
                {billingCycle === "yearly" && plan.id !== "free" && (
                  <p className="text-[10px] text-emerald-400 mt-0.5">
                    Save ${(plan.price * 12 - plan.priceYearly).toFixed(0)}/yr
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.slice(0, 5).map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-xs text-slate-400"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                {plan.features.length > 5 && (
                  <li className="text-[10px] text-slate-500 pl-5">
                    +{plan.features.length - 5} more features
                  </li>
                )}
              </ul>

              {isCurrent ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-400 text-sm font-semibold cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedPlan(plan.id);
                    setShowUpgradeModal(true);
                  }}
                  disabled={processing}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-sm font-semibold transition shadow-lg shadow-sky-500/20 disabled:opacity-50"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : plan.id === "free" ? (
                    "Downgrade"
                  ) : (
                    "Upgrade Now"
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Comparison Table */}
      <div className="mt-10 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <PieChart className="h-4 w-4 text-sky-400" />
          Feature Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-2 px-3 text-slate-400 font-medium">
                  Feature
                </th>
                <th className="text-center py-2 px-3 text-slate-300">Free</th>
                <th className="text-center py-2 px-3 text-sky-400">Pro</th>
                <th className="text-center py-2 px-3 text-purple-400">Extra</th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: "maxScans", label: "Scans/Day" },
                { key: "teamMembers", label: "Team Members" },
                { key: "historyRetention", label: "History" },
                { key: "aiFixes", label: "AI Fixes" },
                { key: "deepScan", label: "Deep Scan" },
                { key: "prioritySupport", label: "Priority Support" },
                { key: "apiAccess", label: "API Access" },
                { key: "exportReports", label: "Export Reports" },
                { key: "customRules", label: "Custom Rules" },
              ].map((item) => {
                const freeVal =
                  getPlanFeatures("free")[item.key as keyof PlanFeatures];
                const proVal =
                  getPlanFeatures("pro")[item.key as keyof PlanFeatures];
                const extraVal =
                  getPlanFeatures("extra")[item.key as keyof PlanFeatures];

                return (
                  <tr
                    key={item.key}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                  >
                    <td className="py-2 px-3 text-slate-400">{item.label}</td>
                    <td className="text-center py-2 px-3 font-mono text-slate-400">
                      {formatLimitValue(freeVal)}
                    </td>
                    <td className="text-center py-2 px-3 font-mono text-sky-400">
                      {formatLimitValue(proVal)}
                    </td>
                    <td className="text-center py-2 px-3 font-mono text-purple-400">
                      {formatLimitValue(extraVal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* License Modal */}
      {showLicenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-amber-400">
                <Key className="h-5 w-5" />
                <h3 className="text-lg font-bold text-white">
                  Enter License Key
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowLicenseModal(false);
                  setLicenseError("");
                  setLicenseSuccess("");
                  setLicenseKey("");
                }}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter your license key to activate or upgrade your subscription.
            </p>

            {licenseError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{licenseError}</span>
              </div>
            )}

            {licenseSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                <Check className="h-4 w-4 shrink-0" />
                <span>{licenseSuccess}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                License Key
              </label>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-sky-500 focus:outline-none font-mono"
                disabled={verifyingLicense}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleVerifyLicense}
                disabled={verifyingLicense || !licenseKey.trim()}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-sm font-semibold transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {verifyingLicense ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  "Verify License"
                )}
              </button>
              <button
                onClick={() => {
                  setShowLicenseModal(false);
                  setLicenseError("");
                  setLicenseSuccess("");
                  setLicenseKey("");
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={currentPlan}
        userEmail={user?.email}
        onUpgradeSuccess={(plan) => {
          setCurrentPlan(plan);
          setUser({ ...user, plan });
          // ✅ تحديث حالة الاشتراك
          setSubscription(null);
          setTimeLeft(null);
          setSuccess(
            `Successfully upgraded to ${getPlanDisplayName(plan)} plan!`,
          );
          setTimeout(() => setSuccess(""), 3000);
        }}
      />
    </div>
  );
}
