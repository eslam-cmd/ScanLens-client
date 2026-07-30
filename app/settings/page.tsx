// client/app/settings/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  User,
  Mail,
  Lock,
  CreditCard,
  Crown,
  Star,
  Sparkles,
  Zap,
  Check,
  X,
  Loader2,
  AlertCircle,
  ChevronRight,
  LogOut,
  Save,
  Edit2,
  Globe,
  Clock,
  Users,
  Shield,
  Award,
  BarChart3,
  History,
  HelpCircle,
  Key,
  Rocket,
  Flame,
  Gem,
  BadgeCheck,
  CircleCheck,
  CircleX,
  Info,
  ArrowUpRight,
  Calendar,
  TrendingUp,
  Database,
  Server,
  Cloud,
  LockKeyhole,
  Fingerprint,
  Scan,
  FileSearch,
  Bot,
  Brain,
  Cpu,
  Gauge,
  Activity,
  PieChart,
  LineChart,
  Layers,
  ShieldCheck,
  Gift,
  Ticket,
  Infinity as InfinityIcon,
  AlertTriangle,
  Timer,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

// ✅ استيراد من الملف المركزي للخطط
import {
  PlanType,
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

// ✅ Import UpgradeModal
import UpgradeModal from "@/components/layout/UpgradeModal";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanType>("free");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [activeTab, setActiveTab] = useState<
    "profile" | "subscription" | "security"
  >("profile");
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

  // ✅ الحصول على ميزات الخطة الحالية من الملف المركزي
  const currentPlanFeatures = useMemo(() => {
    return getPlanFeatures(currentPlan);
  }, [currentPlan]);

  const currentPlanData = useMemo(() => {
    return getPlan(currentPlan);
  }, [currentPlan]);

  // ✅ الحصول على جميع الخطط من الملف المركزي
  const allPlans = useMemo(() => {
    return getAllPlans();
  }, []);

  // ✅ التحقق من التسجيل الدخول والصلاحية
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await api.get("/auth/me", { withCredentials: true });
        if (res.data?.user) {
          const userData = res.data.user;
          setUser(userData);
          setCurrentPlan(userData.plan || "free");
          setFormData({
            name: userData.name || "",
            email: userData.email || "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });

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

          // ✅ إذا كان المستخدم أدمن - يروح للوحة التحكم
          if (userData.role === "admin") {
            router.replace("/admin");
            return;
          }
        } else {
          // ❌ غير مسجل دخول - يخرج فوراً
          router.replace("/login");
          return;
        }
      } catch (err: any) {
        console.error("Auth error:", err);
        router.replace("/login");
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

  // ✅ تحديث الملف الشخصي
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.put(
        "/auth/profile",
        {
          name: formData.name,
          email: formData.email,
        },
        { withCredentials: true },
      );
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setUser({ ...user, name: formData.name, email: formData.email });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // ✅ تغيير كلمة المرور
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.put(
        "/auth/change-password",
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        { withCredentials: true },
      );
      setSuccess("Password changed successfully!");
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  // ✅ تسجيل الخروج
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch {
      // Ignore errors
    } finally {
      setUser(null);
      router.push("/login");
    }
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

  // ✅ حساب النسبة المئوية لاستخدام الخطة
  const getPlanUsage = () => {
    const maxScans = getMaxScans(currentPlan);
    if (maxScans === Infinity) return 0;
    const scansUsed = user?.scansThisMonth || 0;
    return Math.min((scansUsed / maxScans) * 100, 100);
  };

  // ✅ الحصول على قيمة محددة من الخطة
  const getPlanLimit = (key: keyof PlanFeatures) => {
    const features = getPlanFeatures(currentPlan);
    return features[key];
  };

  // ✅ تنسيق القيمة للعرض
  const formatLimitValue = (value: any): string => {
    if (value === Infinity) return "∞";
    if (typeof value === "boolean") return value ? "✅" : "❌";
    if (typeof value === "number") return String(value);
    return String(value);
  };

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
                  Your {currentPlanFeatures.name} plan has expired. You've been
                  downgraded to Free plan. Renew now to regain access to premium
                  features.
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

  // ✅ إذا كان loading، يظهر شاشة تحميل
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-sky-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  // ✅ إذا لم يكن هناك مستخدم (غير مسجل) - يظهر رسالة
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-16 w-16 text-rose-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Access Denied</h2>
          <p className="text-sm text-slate-400">
            Please log in to access your settings.
          </p>
          <Link
            href="/login"
            className="inline-block mt-4 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const usage = getPlanUsage();
  const PlanIcon = currentPlanFeatures.icon;

  return (
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-sky-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Settings
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLicenseModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-semibold transition border border-amber-500/20"
          >
            <Key className="h-4 w-4" />
            <span>License</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-semibold transition border border-rose-500/20"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* ✅ تحذير انتهاء الاشتراك */}
      {renderSubscriptionWarning()}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500/30 to-indigo-500/30 border border-sky-500/30 flex items-center justify-center text-sm font-bold text-sky-400">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${currentPlanFeatures.color} border ${currentPlanFeatures.borderColor} bg-slate-900/50`}
                >
                  {currentPlanFeatures.name}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              {[
                { icon: User, label: "Profile", value: "profile" },
                {
                  icon: CreditCard,
                  label: "Subscription",
                  value: "subscription",
                },
                { icon: Shield, label: "Security", value: "security" },
                { icon: History, label: "Activity", value: "activity" },
                { icon: HelpCircle, label: "Help & Support", value: "help" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                    activeTab === item.value
                      ? "bg-sky-500/10 text-sky-400"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {activeTab === item.value && (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <>
              {/* Current Plan Card */}
              <div
                className={`p-6 rounded-2xl ${currentPlanFeatures.bgColor} border ${currentPlanFeatures.borderColor}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${currentPlanData.color} bg-opacity-20`}
                    >
                      <PlanIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {currentPlanFeatures.name} Plan
                        {currentPlanData.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {currentPlanData.badge}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {currentPlanData.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-white">
                      {getPlanPrice(currentPlan, billingCycle)}
                    </span>
                    <span className="text-sm text-slate-400">
                      / {billingCycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>
                </div>

                {/* Usage Bar */}
                {getMaxScans(currentPlan) !== Infinity && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Monthly Usage</span>
                      <span>
                        {user?.scansThisMonth || 0} / {getMaxScans(currentPlan)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          usage > 80 ? "bg-amber-500" : "bg-sky-500"
                        }`}
                        style={{ width: `${usage}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    {
                      label: "Scans/Day",
                      value: formatLimitValue(getMaxScans(currentPlan)),
                    },
                    {
                      label: "History",
                      value: `${getHistoryRetention(currentPlan)} days`,
                    },
                    {
                      label: "Team Members",
                      value: formatLimitValue(currentPlanFeatures.teamMembers),
                    },
                    {
                      label: "AI Fixes",
                      value: currentPlanFeatures.aiFixes ? "✅" : "❌",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/50 text-center"
                    >
                      <span className="text-slate-500 block">{item.label}</span>
                      <span className="text-white font-semibold">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile Settings */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4">
                  Profile Settings
                </h3>

                {error && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs sm:text-sm font-medium text-rose-400 mb-4">
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
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-sm font-medium text-emerald-400 mb-4">
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

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          disabled={!isEditing}
                          className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 transition disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          disabled={!isEditing}
                          className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 transition disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <>
                        <button
                          type="submit"
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition shadow-lg shadow-sky-600/20 disabled:opacity-50"
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          <span>{saving ? "Saving..." : "Save Changes"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span>Edit Profile</span>
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Change Password */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4">
                  Change Password
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              currentPassword: e.target.value,
                            })
                          }
                          placeholder="Enter current password"
                          className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              newPassword: e.target.value,
                            })
                          }
                          placeholder="At least 6 characters"
                          className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Confirm new password"
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 transition"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={
                      saving ||
                      !formData.currentPassword ||
                      !formData.newPassword
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition shadow-lg shadow-amber-600/20 disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    <span>{saving ? "Changing..." : "Change Password"}</span>
                  </button>
                </form>
              </div>
            </>
          )}

          {/* Subscription Tab */}
          {activeTab === "subscription" && (
            <>
              {/* Current Plan Details */}
              <div
                className={`p-6 rounded-2xl ${currentPlanFeatures.bgColor} border ${currentPlanFeatures.borderColor}`}
              >
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-400" />
                  Current Subscription
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">
                      You are currently on the{" "}
                      <span className="text-white font-bold">
                        {currentPlanFeatures.name}
                      </span>{" "}
                      plan
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold text-white">
                        {getPlanPrice(currentPlan, billingCycle)}
                      </span>
                      <span className="text-sm text-slate-400">
                        / {billingCycle === "monthly" ? "month" : "year"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Billing:</span>
                    <button
                      onClick={() => setBillingCycle("monthly")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        billingCycle === "monthly"
                          ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle("yearly")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        billingCycle === "yearly"
                          ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Yearly (Save 20%)
                    </button>
                  </div>
                </div>
              </div>

              {/* Plan Comparison */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-sky-400" />
                  Plan Comparison
                </h3>
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    <div className="grid grid-cols-4 gap-2 text-xs font-bold py-3 border-b-2 border-slate-700">
                      <span className="text-slate-400">Feature</span>
                      <span className="text-center text-slate-300">Free</span>
                      <span className="text-center text-sky-400">Pro</span>
                      <span className="text-center text-purple-400">Extra</span>
                    </div>

                    {[
                      { key: "maxScans", label: "Scans per day" },
                      { key: "teamMembers", label: "Team members" },
                      { key: "exportReports", label: "Export reports" },
                      { key: "aiFixes", label: "AI fixes" },
                      { key: "deepScan", label: "Deep scan" },
                      { key: "prioritySupport", label: "Priority support" },
                      { key: "customRules", label: "Custom rules" },
                      { key: "apiAccess", label: "API access" },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="grid grid-cols-4 gap-2 text-xs py-2 border-b border-slate-800/50"
                      >
                        <span className="text-slate-400">{item.label}</span>
                        <span className="text-center font-mono">
                          {formatLimitValue(
                            getPlanFeatures("free")[
                              item.key as keyof PlanFeatures
                            ],
                          )}
                        </span>
                        <span className="text-center font-mono text-sky-400">
                          {formatLimitValue(
                            getPlanFeatures("pro")[
                              item.key as keyof PlanFeatures
                            ],
                          )}
                        </span>
                        <span className="text-center font-mono text-purple-400">
                          {formatLimitValue(
                            getPlanFeatures("extra")[
                              item.key as keyof PlanFeatures
                            ],
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ✅ Upgrade Options with License */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Key className="h-5 w-5 text-amber-400" />
                  Upgrade with License Key
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  Enter your license key to upgrade your plan instantly
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 transition font-mono"
                    disabled={verifyingLicense}
                  />
                  <button
                    onClick={handleVerifyLicense}
                    disabled={verifyingLicense || !licenseKey.trim()}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-sm font-semibold transition shadow-lg shadow-amber-500/20 disabled:opacity-50 whitespace-nowrap"
                  >
                    {verifyingLicense ? (
                      <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                    ) : (
                      <Key className="h-4 w-4 inline mr-1" />
                    )}
                    {verifyingLicense ? "Verifying..." : "Verify License"}
                  </button>
                </div>
                {licenseError && (
                  <p className="text-xs text-rose-400 mt-2">{licenseError}</p>
                )}
                {licenseSuccess && (
                  <p className="text-xs text-emerald-400 mt-2">
                    {licenseSuccess}
                  </p>
                )}
              </div>

              {/* Upgrade Options Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {allPlans
                  .filter((plan) => plan.id !== currentPlan)
                  .map((plan) => {
                    const Icon = plan.icon;
                    const planFeatures = getPlanFeatures(plan.id);
                    return (
                      <div
                        key={plan.id}
                        className={`p-6 rounded-2xl ${planFeatures.bgColor} border ${planFeatures.borderColor} transition-all duration-300 hover:scale-[1.02]`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className={`p-2 rounded-xl bg-gradient-to-br ${plan.color} bg-opacity-20`}
                          >
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">
                              {planFeatures.name}
                            </h4>
                            {plan.badge && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                {plan.badge}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">
                          {plan.description}
                        </p>
                        <p className="text-2xl font-bold text-white mb-4">
                          {getPlanPrice(plan.id, billingCycle)}
                          <span className="text-sm text-slate-400 font-normal">
                            {" "}
                            / {billingCycle === "monthly" ? "mo" : "yr"}
                          </span>
                        </p>
                        <button
                          onClick={() => setShowLicenseModal(true)}
                          className="w-full py-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-sm font-semibold transition shadow-lg shadow-sky-500/20 inline-block text-center"
                        >
                          {plan.id === "free" ? "Downgrade" : "Upgrade Now"}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <LockKeyhole className="h-5 w-5 text-emerald-400" />
                  Security Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Two-Factor Authentication
                      </p>
                      <p className="text-xs text-slate-400">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition">
                      Enable
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Session Management
                      </p>
                      <p className="text-xs text-slate-400">
                        View and manage active sessions
                      </p>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition">
                      Manage
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                    <div>
                      <p className="text-sm font-medium text-white">API Keys</p>
                      <p className="text-xs text-slate-400">
                        Generate and manage API access keys
                      </p>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition">
                      Manage
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Audit Logs
                      </p>
                      <p className="text-xs text-slate-400">
                        {currentPlanFeatures.auditLogs
                          ? "View all security events and activities"
                          : "Upgrade to Pro or Extra to access audit logs"}
                      </p>
                    </div>
                    <button
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                        currentPlanFeatures.auditLogs
                          ? "bg-slate-800 hover:bg-slate-700 text-white"
                          : "bg-slate-800/50 text-slate-500 cursor-not-allowed"
                      }`}
                      disabled={!currentPlanFeatures.auditLogs}
                    >
                      {currentPlanFeatures.auditLogs
                        ? "View Logs"
                        : "🔒 Locked"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Activity Log */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-sky-400" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      action: "Logged in",
                      time: "2 hours ago",
                      ip: "192.168.1.1",
                    },
                    {
                      action: "Scanned example.com",
                      time: "5 hours ago",
                      ip: "192.168.1.1",
                    },
                    {
                      action: "Updated profile",
                      time: "1 day ago",
                      ip: "192.168.1.1",
                    },
                  ].map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800"
                    >
                      <div>
                        <p className="text-sm text-white">{activity.action}</p>
                        <p className="text-xs text-slate-400">
                          {activity.time} • IP: {activity.ip}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-500">✅</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ License Modal */}
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
              You can obtain a license key from the developer.
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
        onUpgradeSuccess={(plan: PlanType) => {
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
