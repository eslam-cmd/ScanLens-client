// client/app/admin/payments/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  Calendar,
  User,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Eye,
  Printer,
  RefreshCw,
  X,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  FileText,
  Shield,
  ArrowUpRight,
  AlertTriangle,
  Timer,
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

// ✅ إيميل الأدمن الرئيسي
const ADMIN_EMAIL = "hdayaahdayaaslam34@gmail.com";

interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  metadata: any;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface PaymentStats {
  totalRevenue: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
  pendingPayments: number;
  averageAmount: number;
  monthlyRevenue: {
    month: string;
    amount: number;
    count: number;
  }[];
}

export default function AdminPaymentsPage() {
  const [user, setUser] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [success, setSuccess] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  // ✅ جلب بيانات المستخدم
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me", { withCredentials: true });
        if (res.data?.user) {
          const userData = res.data.user;
          setUser(userData);

          // ✅ جلب معلومات الاشتراك (إذا كان غير الأدمن الرئيسي)
          if (userData.email !== ADMIN_EMAIL && userData.subscription) {
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
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [subscription?.expiresAt]);

  // ✅ عرض تحذير انتهاء الاشتراك (لغير الأدمن الرئيسي)
  const renderSubscriptionWarning = () => {
    // ✅ إذا كان الأدمن الرئيسي، لا يعرض تحذير
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
                {isCritical
                  ? "⚠️ Admin Subscription Expiring Soon!"
                  : "⏳ Admin Subscription Expiring"}
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
                . Renew to continue managing payments.
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

  // ✅ جلب المدفوعات
  const fetchPayments = async () => {
    setRefreshing(true);
    try {
      const res = await api.get("/admin/payments", { withCredentials: true });
      setPayments(res.data);
      // حساب الإحصائيات
      calculateStats(res.data);
    } catch (err: any) {
      console.error("Failed to fetch payments:", err);
      if (err.response?.status === 403) {
        router.push("/");
      } else {
        setError("Failed to load payments data");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ حساب الإحصائيات
  const calculateStats = (data: Payment[]) => {
    const successful = data.filter((p) => p.status === "SUCCEEDED");
    const failed = data.filter((p) => p.status === "FAILED");
    const refunded = data.filter((p) => p.status === "REFUNDED");
    const pending = data.filter((p) => p.status === "PENDING");

    const totalRevenue = successful.reduce((sum, p) => sum + p.amount, 0);

    // ✅ الإيرادات الشهرية
    const monthlyData: { [key: string]: { amount: number; count: number } } =
      {};
    successful.forEach((p) => {
      const date = new Date(p.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { amount: 0, count: 0 };
      }
      monthlyData[monthKey].amount += p.amount;
      monthlyData[monthKey].count += 1;
    });

    const monthlyRevenue = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    setStats({
      totalRevenue,
      totalPayments: data.length,
      successfulPayments: successful.length,
      failedPayments: failed.length,
      refundedPayments: refunded.length,
      pendingPayments: pending.length,
      averageAmount:
        successful.length > 0 ? totalRevenue / successful.length : 0,
      monthlyRevenue,
    });
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // ✅ تصفية المدفوعات
  const filteredPayments = payments
    .filter((payment) => {
      const matchesSearch =
        payment.user?.email
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || payment.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc"
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        return sortOrder === "desc" ? b.amount - a.amount : a.amount - b.amount;
      }
    });

  // ✅ تنسيق العملة
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // ✅ تنسيق التاريخ
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ✅ حالة الدفع
  const getStatusBadge = (status: string) => {
    const configs = {
      SUCCEEDED: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/20",
        icon: <CheckCircle className="h-3 w-3" />,
        label: "Success",
      },
      FAILED: {
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        border: "border-rose-500/20",
        icon: <XCircle className="h-3 w-3" />,
        label: "Failed",
      },
      PENDING: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/20",
        icon: <Clock className="h-3 w-3" />,
        label: "Pending",
      },
      REFUNDED: {
        bg: "bg-slate-500/10",
        text: "text-slate-400",
        border: "border-slate-500/20",
        icon: <ArrowUpRight className="h-3 w-3" />,
        label: "Refunded",
      },
    };
    const config = configs[status as keyof typeof configs] || configs.PENDING;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  // ✅ التحقق من أن المستخدم هو الأدمن الرئيسي
  const isMainAdmin = user?.email === ADMIN_EMAIL;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-sky-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl">
      {/* ✅ تحذير انتهاء الاشتراك (لغير الأدمن الرئيسي) */}
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
              <CreditCard className="h-8 w-8 text-emerald-400" />
              Payments
              {isMainAdmin && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  👑 Main Admin
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {isMainAdmin
                ? "Manage and monitor all payment transactions (Full Access)"
                : "Manage and monitor all payment transactions"}
            </p>
          </div>
        </div>
        <button
          onClick={fetchPayments}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            {
              label: "Total Revenue",
              value: formatCurrency(stats.totalRevenue),
              icon: DollarSign,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
            },
            {
              label: "Total Payments",
              value: stats.totalPayments,
              icon: Receipt,
              color: "text-sky-400",
              bg: "bg-sky-500/10",
            },
            {
              label: "Successful",
              value: stats.successfulPayments,
              icon: CheckCircle,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
            },
            {
              label: "Failed",
              value: stats.failedPayments,
              icon: XCircle,
              color: "text-rose-400",
              bg: "bg-rose-500/10",
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/50 text-center hover:border-slate-700 transition"
              >
                <div
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${stat.bg} border border-slate-800/50 mb-2`}
                >
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Monthly Revenue Chart - Simplified */}
      {stats && stats.monthlyRevenue.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 mb-6">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-sky-400" />
            Monthly Revenue
          </h3>
          <div className="flex items-end gap-2 h-32">
            {stats.monthlyRevenue.slice(-6).map((month, index) => {
              const maxAmount = Math.max(
                ...stats.monthlyRevenue.slice(-6).map((m) => m.amount),
                1,
              );
              const height = (month.amount / maxAmount) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="relative w-full flex flex-col items-center">
                    <div
                      className="w-full max-w-[40px] bg-gradient-to-t from-sky-500 to-emerald-400 rounded-t transition-all duration-500"
                      style={{
                        height: `${Math.max(height, 5)}%`,
                        minHeight: "8px",
                      }}
                    />
                  </div>
                  <p className="text-[8px] text-slate-500 mt-1 font-mono">
                    {month.month.slice(5)}
                  </p>
                  <p className="text-[8px] text-slate-400 font-mono">
                    ${month.amount}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by email, ID, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 transition"
          >
            <option value="all">All Status</option>
            <option value="SUCCEEDED">✅ Success</option>
            <option value="PENDING">⏳ Pending</option>
            <option value="FAILED">❌ Failed</option>
            <option value="REFUNDED">↩️ Refunded</option>
          </select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setSortBy("date");
              setSortOrder(sortOrder === "desc" ? "asc" : "desc");
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 hover:text-white transition"
          >
            <Calendar className="h-3.5 w-3.5" />
            Date
            {sortBy === "date" &&
              (sortOrder === "desc" ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" />
              ))}
          </button>
          <button
            onClick={() => {
              setSortBy("amount");
              setSortOrder(sortOrder === "desc" ? "asc" : "desc");
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 hover:text-white transition"
          >
            <DollarSign className="h-3.5 w-3.5" />
            Amount
            {sortBy === "amount" &&
              (sortOrder === "desc" ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" />
              ))}
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-4 text-left font-medium">Payment</th>
                <th className="px-4 py-4 text-left font-medium">User</th>
                <th className="px-4 py-4 text-left font-medium">Amount</th>
                <th className="px-4 py-4 text-left font-medium">Status</th>
                <th className="px-4 py-4 text-left font-medium">Date</th>
                <th className="px-4 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="hover:bg-slate-800/30 transition cursor-pointer"
                  onClick={() => {
                    setSelectedPayment(payment);
                    setShowDetailsModal(true);
                  }}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-800/50">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-mono text-xs text-slate-300">
                          {payment.id.slice(0, 8)}...
                        </p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[100px]">
                          {payment.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-[10px] font-bold text-sky-400">
                        {payment.user?.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="text-sm text-white">
                          {payment.user?.name || "Unknown"}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {payment.user?.email || "No email"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-white font-mono">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase">
                      {payment.currency}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-xs text-slate-300">
                      {formatDate(payment.createdAt)}
                    </p>
                    {payment.paidAt && (
                      <p className="text-[10px] text-emerald-400">
                        Paid: {new Date(payment.paidAt).toLocaleDateString()}
                      </p>
                    )}
                    {payment.refundedAt && (
                      <p className="text-[10px] text-rose-400">
                        Refunded:{" "}
                        {new Date(payment.refundedAt).toLocaleDateString()}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPayment(payment);
                        setShowDetailsModal(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="p-12 text-center">
            <CreditCard className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No payments found</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Receipt className="h-6 w-6 text-emerald-400" />
                Payment Details
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPayment(null);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Payment ID
                  </p>
                  <p className="text-sm font-mono text-white">
                    {selectedPayment.id}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Status
                  </p>
                  {getStatusBadge(selectedPayment.status)}
                </div>
              </div>

              {/* Amount & User */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Amount
                  </p>
                  <p className="text-2xl font-bold text-white font-mono">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {selectedPayment.currency}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    User
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-xs font-bold text-sky-400">
                      {selectedPayment.user?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="text-sm text-white">
                        {selectedPayment.user?.name || "Unknown"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {selectedPayment.user?.email || "No email"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Created At
                  </p>
                  <p className="text-sm text-slate-300">
                    {formatDate(selectedPayment.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    {selectedPayment.paidAt ? "Paid At" : "Refunded At"}
                  </p>
                  <p className="text-sm text-slate-300">
                    {selectedPayment.paidAt
                      ? formatDate(selectedPayment.paidAt)
                      : selectedPayment.refundedAt
                        ? formatDate(selectedPayment.refundedAt)
                        : "—"}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedPayment.description && (
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                    Description
                  </p>
                  <p className="text-sm text-slate-300">
                    {selectedPayment.description}
                  </p>
                </div>
              )}

              {/* Metadata */}
              {selectedPayment.metadata && (
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                    Metadata
                  </p>
                  <pre className="text-xs text-slate-400 font-mono bg-slate-950 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedPayment.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPayment(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // يمكن إضافة وظيفة طباعة أو تصدير
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition shadow-lg shadow-sky-500/20"
              >
                <Printer className="h-4 w-4 inline mr-1.5" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Upgrade Modal (لغير الأدمن الرئيسي) */}
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
