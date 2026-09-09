// client/app/buy-license/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  Key,
  Crown,
  Gem,
  Shield,
  Check,
  X,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  Zap,
  DollarSign,
  Gift,
  Ticket,
  Award,
  BadgeCheck,
  ShieldCheck,
  Users,
  Database,
  FileText,
  ArrowRight,
  Copy,
  Lock,
  Unlock,
  Mail,
  User,
  Building,
  Phone,
  MapPin,
  Globe,
  Star,
  Heart,
  ThumbsUp,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  Layers,
  Rocket,
  Flame,
  Infinity,
  Timer,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";

// ✅ استيراد من الملف المركزي للخطط
import {
  PlanType,
  getPlanFeatures,
  getPlan,
  getPlanDisplayName,
  getPlanIcon,
  getPlanPrice,
  isPaidPlan,
  hasMinPlan,
  PLAN_FEATURES,
  PLANS,
} from "@/lib/plans.config";

// ✅ استيراد UpgradeModal
import UpgradeModal from "@/components/layout/UpgradeModal";

interface LicensePurchase {
  id: string;
  key: string;
  plan: string;
  email: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function BuyLicensePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("pro");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [purchasedLicense, setPurchasedLicense] =
    useState<LicensePurchase | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();

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

  // ✅ الحصول على جميع الخطط
  const allPlans = useMemo(() => Object.values(PLANS), []);

  // ✅ الحصول على معلومات الخطة المختارة
  const selectedPlanData = useMemo(() => {
    return getPlan(selectedPlan);
  }, [selectedPlan]);

  const selectedPlanFeatures = useMemo(() => {
    return getPlanFeatures(selectedPlan);
  }, [selectedPlan]);

  // ✅ جلب بيانات المستخدم
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me", { withCredentials: true });
        if (res.data?.user) {
          const userData = res.data.user;
          setUser(userData);
          setEmail(userData.email);

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
      } catch {
        router.push("/login");
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
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 mb-6 animate-pulse">
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
                  Your subscription has expired. Purchase a new license to
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
        className={`p-4 rounded-2xl border ${
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
                Your subscription will expire in{" "}
                <span className="text-amber-400 font-semibold">
                  {subscription.daysRemaining} days
                </span>
                . Purchase a new license to continue uninterrupted.
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

  // ✅ شراء المفتاح
  const handlePurchase = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!termsAccepted) {
      setError("Please accept the terms and conditions");
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post(
        "/subscription/purchase-license",
        {
          planId: selectedPlan,
          email,
          billingCycle,
        },
        { withCredentials: true },
      );

      if (response.data.success) {
        setPurchasedLicense(response.data.license);
        setShowSuccessModal(true);
        setSuccess(`✅ License purchased successfully!`);

        // ✅ تحديث بيانات المستخدم
        if (user) {
          setUser({ ...user, plan: selectedPlan });
        }
        // ✅ تحديث حالة الاشتراك
        setSubscription(null);
        setTimeLeft(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to purchase license");
    } finally {
      setProcessing(false);
    }
  };

  // ✅ نسخ المفتاح
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // ✅ تنسيق السعر
  const getPriceDisplay = (planId: PlanType) => {
    const plan = getPlan(planId);
    if (planId === "free") return "Free";
    const price = billingCycle === "monthly" ? plan.price : plan.priceYearly;
    return `$${price}`;
  };

  // ✅ تنسيق المدة
  const getDurationLabel = () => {
    return billingCycle === "monthly" ? "Monthly" : "Yearly";
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
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Key className="h-8 w-8 text-amber-400" />
            Purchase License
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Buy a license key to unlock premium features
          </p>
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
            className="text-rose-400/60 hover:text-rose-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && !showSuccessModal && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-4">
          <Check className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="flex-1">{success}</span>
          <button
            onClick={() => setSuccess("")}
            className="text-emerald-400/60 hover:text-emerald-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Plan Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
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
                Save 20%
              </span>
            </button>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {allPlans
              .filter((plan) => plan.id !== "free")
              .map((plan) => {
                const Icon = plan.icon;
                const planFeatures = getPlanFeatures(plan.id);
                const isSelected = selectedPlan === plan.id;
                const price = getPriceDisplay(plan.id);

                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative p-6 rounded-2xl border transition-all duration-300 text-left ${
                      isSelected
                        ? "border-sky-500/50 bg-sky-500/5 shadow-lg shadow-sky-500/10 ring-2 ring-sky-500/30"
                        : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:scale-[1.02]"
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-[10px] font-semibold">
                        RECOMMENDED
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`p-2.5 rounded-xl bg-gradient-to-br ${plan.color} bg-opacity-20`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">
                          {planFeatures.name}
                        </h3>
                        {plan.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {plan.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mb-4">
                      {plan.description}
                    </p>

                    <div className="mb-4">
                      <span className="text-3xl font-bold text-white">
                        {price}
                      </span>
                      <span className="text-sm text-slate-400">
                        {" "}
                        / {getDurationLabel()}
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {plan.features.slice(0, 4).map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-xs text-slate-400"
                        >
                          <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 4 && (
                        <li className="text-[10px] text-slate-500 pl-5">
                          +{plan.features.length - 4} more features
                        </li>
                      )}
                    </ul>

                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-sky-500/20">
                        <span className="text-xs text-sky-400 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Selected
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Checkout Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-400" />
              Checkout
            </h3>

            {/* Selected Plan Summary */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <selectedPlanData.icon className="h-5 w-5 text-sky-400" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {selectedPlanFeatures.name} Plan
                  </p>
                  <p className="text-xs text-slate-400">
                    {getDurationLabel()} • {getPriceDisplay(selectedPlan)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="h-3 w-3" />
                <span>
                  Valid for {billingCycle === "monthly" ? "1 month" : "1 year"}
                </span>
              </div>
            </div>

            {/* Email Input */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 transition"
                  disabled={processing}
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 mb-4">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-sky-600 focus:ring-sky-500 focus:ring-offset-slate-900"
                disabled={processing}
              />
              <label className="text-xs text-slate-400">
                I agree to the{" "}
                <Link href="/terms" className="text-sky-400 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-sky-400 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Purchase Button */}
            <button
              onClick={handlePurchase}
              disabled={processing || !email || !termsAccepted}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-semibold transition shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                <>
                  <Key className="h-4 w-4 inline mr-2" />
                  Purchase License
                </>
              )}
            </button>

            {/* Security Badge */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-500">
              <Lock className="h-3 w-3" />
              <span>Secure payment • Instant delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && purchasedLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-4">
                <Check className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                License Purchased! 🎉
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Your license key has been generated. Copy it below to activate
                your subscription.
              </p>

              {/* License Key */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 mb-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg text-sky-400 font-bold">
                    {purchasedLicense.key}
                  </span>
                  <button
                    onClick={() => handleCopyKey(purchasedLicense.key)}
                    className="p-2 rounded-lg hover:bg-slate-800 transition"
                  >
                    {copiedKey ? (
                      <Check className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Copy className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* License Details */}
              <div className="grid grid-cols-2 gap-3 text-left mb-6">
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase">Plan</p>
                  <p className="text-sm font-semibold text-white">
                    {getPlanDisplayName(purchasedLicense.plan as PlanType)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase">
                    Expires
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {purchasedLicense.expiresAt
                      ? new Date(
                          purchasedLicense.expiresAt,
                        ).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push("/settings");
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition shadow-lg shadow-sky-500/20"
                >
                  Go to Settings
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push("/scan");
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
                >
                  Start Scanning
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={user?.plan || "free"}
        userEmail={user?.email}
        onUpgradeSuccess={(plan: PlanType) => {
          setUser({ ...user, plan });
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
