// client/app/admin/licenses/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Key,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Eye,
  Copy,
  Check,
  AlertCircle,
  Crown,
  Gem,
  Shield,
  Calendar,
  Mail,
  User,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  Edit,
  Lock,
  Unlock,
  Timer,
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

interface License {
  id: string;
  key: string;
  plan: string;
  email: string | null;
  usedBy: string | null;
  usedAt: string | null;
  expiresAt: string | null;
  usesCount: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

// ✅ إيميل الأدمن
const ADMIN_EMAIL = "hdayaahdayaaslam34@gmail.com";

export default function AdminLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
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

  // ✅ الحصول على جميع الخطط للمقارنة
  const allPlans = useMemo(() => Object.values(PLANS), []);

  // ✅ الحصول على معلومات الخطة للعرض
  const getPlanDisplayInfo = (planId: string) => {
    const plan = getPlan(planId as PlanType);
    const features = getPlanFeatures(planId as PlanType);
    return {
      ...plan,
      ...features,
      displayName: features.name,
      icon: features.icon,
      color: features.color,
      borderColor: features.borderColor,
      bgColor: features.bgColor,
    };
  };

  // ✅ Form state
  const [formData, setFormData] = useState({
    plan: "pro" as PlanType,
    email: "",
    expiresAt: "",
    notes: "",
  });

  // ✅ جلب بيانات المستخدم الحالي
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me", { withCredentials: true });
        if (res.data?.user) {
          const userData = res.data.user;
          setUser(userData);
          
          // ✅ جلب معلومات الاشتراك (إذا كان غير أدمن)
          if (userData.email !== ADMIN_EMAIL && userData.subscription) {
            const expiresAt = userData.subscription.expiresAt;
            if (expiresAt) {
              const expiryDate = new Date(expiresAt);
              const now = new Date();
              const daysRemaining = Math.ceil(
                (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );
              setSubscription({
                expiresAt,
                isExpiring: daysRemaining <= 7 && daysRemaining > 0,
                daysRemaining,
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, []);

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
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [subscription?.expiresAt]);

  // ✅ عرض تحذير انتهاء الاشتراك (لغير الأدمن)
  const renderSubscriptionWarning = () => {
    // ✅ إذا كان أدمن، لا يعرض تحذير
    if (user?.email === ADMIN_EMAIL) return null;
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
                  ⚠️ Admin Subscription Expired
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Action Required
                  </span>
                </p>
                <p className="text-xs text-slate-400">
                  Your admin subscription has expired. Some admin features may
                  be limited. Please contact support.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-semibold transition shadow-lg shadow-rose-500/20 whitespace-nowrap"
            >
              🔄 Renew
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
                {isCritical ? "⚠️ Admin Subscription Expiring Soon!" : "⏳ Admin Subscription Expiring"}
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
                Your admin subscription will expire in{" "}
                <span className="text-amber-400 font-semibold">
                  {subscription.daysRemaining} days
                </span>
                . Renew to continue managing licenses.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {timeLeft && (
              <div className="flex items-center gap-1 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
                <Timer className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs font-mono text-amber-400">
                  {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
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

  // ✅ جلب المفاتيح
  const fetchLicenses = async () => {
    setRefreshing(true);
    try {
      const res = await api.get("/admin/licenses", { withCredentials: true });
      setLicenses(res.data);
    } catch (err: any) {
      console.error("Failed to fetch licenses:", err);
      if (err.response?.status === 403) {
        router.push("/");
      } else {
        setError("Failed to load licenses data");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  // ✅ إنشاء مفتاح جديد
  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await api.post(
        "/admin/licenses",
        {
          plan: formData.plan,
          email: formData.email || undefined,
          expiresAt: formData.expiresAt
            ? new Date(formData.expiresAt)
            : undefined,
          notes: formData.notes || undefined,
        },
        { withCredentials: true },
      );

      setLicenses([res.data, ...licenses]);
      const planDisplayName = getPlanDisplayName(formData.plan);
      setSuccess(
        `✅ License created for ${planDisplayName} plan: ${res.data.key}`,
      );
      setShowCreateModal(false);
      setFormData({
        plan: "pro",
        email: "",
        expiresAt: "",
        notes: "",
      });

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create license");
      setTimeout(() => setError(""), 3000);
    }
  };

  // ✅ تعطيل/تفعيل مفتاح
  const handleToggleLicense = async (
    licenseId: string,
    currentStatus: boolean,
  ) => {
    if (
      !confirm(
        `Are you sure you want to ${currentStatus ? "revoke" : "activate"} this license?`,
      )
    )
      return;

    try {
      if (currentStatus) {
        await api.delete(`/admin/licenses/${licenseId}`, {
          withCredentials: true,
        });
        setLicenses(
          licenses.map((l) =>
            l.id === licenseId ? { ...l, isActive: false } : l,
          ),
        );
        setSuccess("✅ License revoked successfully");
      } else {
        await api.put(
          `/admin/licenses/${licenseId}/activate`,
          {},
          { withCredentials: true },
        );
        setLicenses(
          licenses.map((l) =>
            l.id === licenseId ? { ...l, isActive: true } : l,
          ),
        );
        setSuccess("✅ License activated successfully");
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update license");
      setTimeout(() => setError(""), 3000);
    }
  };

  // ✅ نسخ المفتاح
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ✅ تنسيق التاريخ
  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ✅ الحصول على خطة المفتاح باستخدام الملف المركزي
  const getPlanBadge = (plan: string) => {
    const planInfo = getPlanDisplayInfo(plan);
    const Icon = planInfo.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${planInfo.bgColor} ${planInfo.color} border ${planInfo.borderColor}`}
      >
        <Icon className="h-3 w-3" />
        {planInfo.displayName}
      </span>
    );
  };

  // ✅ حالة المفتاح
  const getStatusBadge = (license: License) => {
    const isExpired =
      license.expiresAt && new Date(license.expiresAt) < new Date();

    if (!license.isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <XCircle className="h-3 w-3" />
          Revoked
        </span>
      );
    }

    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="h-3 w-3" />
          Expired
        </span>
      );
    }

    if (license.usedBy) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle className="h-3 w-3" />
          Used
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
        <CheckCircle className="h-3 w-3" />
        Active
      </span>
    );
  };

  // ✅ تصفية المفاتيح
  const filteredLicenses = licenses.filter((license) => {
    const matchesSearch =
      license.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      license.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      license.usedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      license.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = filterPlan === "all" || license.plan === filterPlan;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && license.isActive && !license.usedBy) ||
      (filterStatus === "used" && license.usedBy) ||
      (filterStatus === "revoked" && !license.isActive) ||
      (filterStatus === "expired" &&
        license.expiresAt &&
        new Date(license.expiresAt) < new Date());
    return matchesSearch && matchesPlan && matchesStatus;
  });

  // ✅ التحقق من أن المستخدم هو الأدمن
  const isAdminUser = user?.email === ADMIN_EMAIL;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-sky-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading licenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl">
      {/* ✅ تحذير انتهاء الاشتراك (لغير الأدمن) */}
      {renderSubscriptionWarning()}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <Key className="h-8 w-8 text-amber-400" />
              Licenses
              {isAdminUser && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  👑 Admin
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {isAdminUser
                ? "Manage license keys for your users (Full Access)"
                : "Manage license keys for your users"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLicenses}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-sm font-semibold transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>New License</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 mb-4">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-auto text-rose-400/60 hover:text-rose-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-4">
          <Check className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{success}</span>
          <button
            onClick={() => setSuccess("")}
            className="ml-auto text-emerald-400/60 hover:text-emerald-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by key, email, user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
            />
          </div>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 transition"
          >
            <option value="all">All Plans</option>
            {allPlans.map((plan) => {
              const features = getPlanFeatures(plan.id);
              return (
                <option key={plan.id} value={plan.id}>
                  {features.name}
                </option>
              );
            })}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 transition"
          >
            <option value="all">All Status</option>
            <option value="active">✅ Active</option>
            <option value="used">👤 Used</option>
            <option value="expired">⏰ Expired</option>
            <option value="revoked">❌ Revoked</option>
          </select>
        </div>
        <span className="text-xs text-slate-400">
          {filteredLicenses.length} licenses found
        </span>
      </div>

      {/* Licenses Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-4 text-left font-medium">License Key</th>
                <th className="px-4 py-4 text-left font-medium">Plan</th>
                <th className="px-4 py-4 text-left font-medium">Used By</th>
                <th className="px-4 py-4 text-left font-medium">Status</th>
                <th className="px-4 py-4 text-left font-medium">Expires</th>
                <th className="px-4 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLicenses.map((license) => (
                <tr
                  key={license.id}
                  className="hover:bg-slate-800/30 transition cursor-pointer"
                  onClick={() => {
                    setSelectedLicense(license);
                    setShowDetailsModal(true);
                  }}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-800/50">
                        <Key className="h-3.5 w-3.5 text-amber-400" />
                      </div>
                      <span className="font-mono text-xs text-sky-400">
                        {license.key}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyKey(license.key);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-700 transition"
                      >
                        {copiedKey === license.key ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-slate-500" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4">{getPlanBadge(license.plan)}</td>
                  <td className="px-4 py-4">
                    {license.usedBy ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-[8px] font-bold text-sky-400">
                          {license.user?.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-xs text-white">
                            {license.user?.name || "Unknown"}
                          </p>
                          <p className="text-[9px] text-slate-400">
                            {license.user?.email || license.usedBy}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Not used</span>
                    )}
                  </td>
                  <td className="px-4 py-4">{getStatusBadge(license)}</td>
                  <td className="px-4 py-4">
                    <span className="text-xs text-slate-400">
                      {formatDate(license.expiresAt)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLicense(license);
                        setShowDetailsModal(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLicense(license.id, license.isActive);
                      }}
                      className={`p-1.5 rounded-lg transition ${
                        license.isActive
                          ? "text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                          : "text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                      }`}
                      title={
                        license.isActive ? "Revoke License" : "Activate License"
                      }
                    >
                      {license.isActive ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Unlock className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLicenses.length === 0 && (
          <div className="p-12 text-center">
            <Key className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No licenses found</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your filters or create a new license
            </p>
          </div>
        )}
      </div>

      {/* Create License Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Create License
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLicense} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Plan
                </label>
                <select
                  value={formData.plan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      plan: e.target.value as PlanType,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 transition"
                >
                  {allPlans.map((plan) => {
                    const features = getPlanFeatures(plan.id);
                    return (
                      <option key={plan.id} value={plan.id}>
                        {features.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="user@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Expires At (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes about this license..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 transition resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-sm font-semibold transition shadow-lg shadow-amber-500/20"
                >
                  <Sparkles className="h-4 w-4 inline mr-1.5" />
                  Generate License
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* License Details Modal */}
      {showDetailsModal && selectedLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Key className="h-6 w-6 text-amber-400" />
                License Details
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedLicense(null);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* License Key */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  License Key
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-lg font-mono text-sky-400">
                    {selectedLicense.key}
                  </p>
                  <button
                    onClick={() => handleCopyKey(selectedLicense.key)}
                    className="p-2 rounded-lg hover:bg-slate-800 transition"
                  >
                    {copiedKey === selectedLicense.key ? (
                      <Check className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Copy className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Plan
                  </p>
                  <div className="mt-1">
                    {getPlanBadge(selectedLicense.plan)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Status
                  </p>
                  <div className="mt-1">{getStatusBadge(selectedLicense)}</div>
                </div>
              </div>

              {/* User Info */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Used By
                </p>
                {selectedLicense.usedBy ? (
                  <div className="flex items-center gap-3 mt-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-xs font-bold text-sky-400">
                      {selectedLicense.user?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="text-sm text-white">
                        {selectedLicense.user?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {selectedLicense.user?.email || selectedLicense.usedBy}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 mt-1">Not used yet</p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Created At
                  </p>
                  <p className="text-sm text-slate-300 mt-1">
                    {formatDate(selectedLicense.createdAt)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Expires At
                  </p>
                  <p className="text-sm text-slate-300 mt-1">
                    {formatDate(selectedLicense.expiresAt)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedLicense.notes && (
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Notes
                  </p>
                  <p className="text-sm text-slate-300 mt-1">
                    {selectedLicense.notes}
                  </p>
                </div>
              )}

              {/* Usage */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Usage
                </p>
                <p className="text-sm text-slate-300 mt-1">
                  Used{" "}
                  <span className="font-bold text-white">
                    {selectedLicense.usesCount}
                  </span>{" "}
                  times
                  {selectedLicense.usedAt && (
                    <span className="text-slate-400">
                      {" "}
                      (Last used: {formatDate(selectedLicense.usedAt)})
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedLicense(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                Close
              </button>
              {selectedLicense.isActive ? (
                <button
                  onClick={() => {
                    handleToggleLicense(selectedLicense.id, true);
                    setShowDetailsModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition shadow-lg shadow-rose-600/20"
                >
                  <Lock className="h-4 w-4 inline mr-1.5" />
                  Revoke License
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleToggleLicense(selectedLicense.id, false);
                    setShowDetailsModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition shadow-lg shadow-emerald-600/20"
                >
                  <Unlock className="h-4 w-4 inline mr-1.5" />
                  Activate License
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ Upgrade Modal (لغير الأدمن) */}
      {user?.email !== ADMIN_EMAIL && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={user?.plan || "free"}
          userEmail={user?.email}
          onUpgradeSuccess={(plan: PlanType) => {
            setUser({ ...user, plan });
            setSubscription(null);
            setTimeLeft(null);
            setSuccess(`✅ Subscription renewed successfully!`);
            setTimeout(() => setSuccess(""), 3000);
          }}
        />
      )}
    </div>
  );
}