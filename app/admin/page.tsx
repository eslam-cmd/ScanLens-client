// client/app/admin/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Settings,
  User,
  Users,
  CreditCard,
  Key,
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
  Shield,
  Award,
  BarChart3,
  History,
  HelpCircle,
  Infinity,
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
  DollarSign,
  Gift,
  Ticket,
  Medal,
  Trophy,
  RefreshCw,
  Filter,
  Search,
  Eye,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Building,
  MapPin,
  Globe as GlobeIcon,
  AlertTriangle,
  Timer,
  TrendingDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { withAdmin } from "@/lib/guards/withAdmin";

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

interface UserData {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  role: string;
  createdAt: string;
  scansCount: number;
  websites: any[];
  payments: any[];
  subscription: any | null;
  license: any | null;
}

interface PaymentData {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  createdAt: string;
  paidAt: string | null;
  refundedAt: string | null;
  metadata: any;
  user: {
    email: string;
    name: string | null;
    plan?: string;
  };
}

interface LicenseData {
  id: string;
  key: string;
  plan: string;
  email: string | null;
  usedBy: string | null;
  usedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  usesCount: number;
  createdAt: string;
}

interface StatsData {
  totalUsers: number;
  totalScans: number;
  totalRevenue: number;
  totalPayments: number;
  totalLicenses: number;
  activeLicenses: number;
  activeSubscriptions: number;
  totalPaidUsers: number;
  averageAmount: number;
  planDistribution: {
    plan: string;
    count: number;
    percentage: number;
  }[];
  recentUsers: UserData[];
  recentPayments: PaymentData[];
  monthlyRevenue: {
    month: string;
    amount: number;
    count: number;
  }[];
  yearlyRevenue: {
    year: string;
    amount: number;
    count: number;
  }[];
  revenueByPlan: {
    plan: string;
    amount: number;
    count: number;
  }[];
}

function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "payments" | "licenses" | "subscriptions"
  >("overview");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [licenses, setLicenses] = useState<LicenseData[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
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

  // ✅ State لتفعيل الاشتراك
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedPlanForUser, setSelectedPlanForUser] = useState<string>("pro");
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<
    "monthly" | "yearly"
  >("monthly");
  const [activatingSubscription, setActivatingSubscription] = useState(false);

  // ✅ فلاتر قسم Payments
  const [paymentPlanFilter, setPaymentPlanFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");

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

  // ✅ تنسيق العملة
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // ✅ تنسيق العملة المختصرة (K, M)
  const formatCurrencyShort = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount}`;
  };

  // ✅ حساب المبلغ الإجمالي المدفوع لكل مستخدم
  const getUserTotalPaid = (userId: string): number => {
    return payments
      .filter((p) => p.userId === userId && p.status === "SUCCEEDED")
      .reduce((sum, p) => sum + p.amount, 0);
  };

  // ✅ الحصول على المدفوعات الخاصة بمستخدم
  const getUserPayments = (userId: string) => {
    return payments.filter((p) => p.userId === userId);
  };

  // ✅ حساب حالة الاشتراك
  const getSubscriptionStatus = (expiresAt: string | null | undefined) => {
    if (!expiresAt)
      return { status: "lifetime", label: "Lifetime", color: "purple" };
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysRemaining = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysRemaining <= 0)
      return {
        status: "expired",
        label: "Expired",
        color: "rose",
        daysRemaining,
      };
    if (daysRemaining <= 7)
      return {
        status: "expiring",
        label: "Expiring Soon",
        color: "amber",
        daysRemaining,
      };
    return {
      status: "active",
      label: "Active",
      color: "emerald",
      daysRemaining,
    };
  };

  // ✅ الحصول على دورة الفوترة
  const getBillingCycle = (metadata: any) => {
    return metadata?.billingCycle === "yearly" ? "Yearly" : "Monthly";
  };

  // ✅ قائمة المستخدمين المشتركين (plan != free)
  const subscribedUsers = useMemo(() => {
    return users.filter((u) => u.plan && u.plan !== "free");
  }, [users]);

  // ✅ قائمة مدفوعات المستخدمين المشتركين
  const subscribedUserPayments = useMemo(() => {
    const userIds = new Set(subscribedUsers.map((u) => u.id));
    return payments.filter((p) => userIds.has(p.userId));
  }, [subscribedUsers, payments]);

  // ✅ تصفية المستخدمين المشتركين
  const filteredSubscribedUsers = useMemo(() => {
    let result = [...subscribedUsers];

    if (paymentPlanFilter !== "all") {
      result = result.filter((u) => u.plan === paymentPlanFilter);
    }

    if (paymentStatusFilter !== "all") {
      result = result.filter((u) => {
        const status = getSubscriptionStatus(u.subscription?.expiresAt);
        return status.status === paymentStatusFilter;
      });
    }

    if (searchQuery) {
      result = result.filter(
        (u) =>
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.name?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return result;
  }, [subscribedUsers, paymentPlanFilter, paymentStatusFilter, searchQuery]);

  // ✅ توليد مفتاح ترخيص
  const handleCreateLicense = async (planId: string, email?: string) => {
    try {
      const res = await api.post(
        "/admin/licenses",
        {
          plan: planId,
          email: email || undefined,
          expiresAt: undefined,
          notes: `License created for ${email || "unknown user"}`,
        },
        { withCredentials: true },
      );
      setLicenses([res.data, ...licenses]);
      const planDisplayName = getPlanDisplayName(planId as PlanType);
      setSuccess(
        `✅ License created for ${planDisplayName} plan: ${res.data.key}`,
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create license");
      setTimeout(() => setError(""), 3000);
    }
  };

  // ✅ دالة تفعيل الاشتراك
  const handleActivateSubscription = async () => {
    if (!selectedUserId) {
      setError("Please select a user");
      return;
    }

    if (!selectedPlanForUser) {
      setError("Please select a plan");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to activate ${selectedPlanForUser} plan for this user with ${selectedBillingCycle} billing?`,
      )
    )
      return;

    setActivatingSubscription(true);
    setError("");

    try {
      const res = await api.post(
        "/subscription/activate",
        {
          userId: selectedUserId,
          planId: selectedPlanForUser,
          billingCycle: selectedBillingCycle,
        },
        { withCredentials: true },
      );

      if (res.data.success) {
        setSuccess(
          `✅ Subscription activated successfully! ${res.data.plan} plan (${selectedBillingCycle}) for user`,
        );
        await fetchAllData();

        setSelectedUserId("");
        setSelectedPlanForUser("pro");
        setSelectedBillingCycle("monthly");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to activate subscription",
      );
    } finally {
      setActivatingSubscription(false);
    }
  };

  // ✅ التحقق من صلاحية المدير
  useEffect(() => {
    const checkAdmin = async () => {
      setLoading(true);
      try {
        const res = await api.get("/auth/me", { withCredentials: true });
        if (res.data?.user) {
          const userData = res.data.user;
          setUser(userData);
          if (userData.role === "admin") {
            setIsAdmin(true);

            if (userData.email !== ADMIN_EMAIL && userData.subscription) {
              const expiresAt = userData.subscription.expiresAt;
              if (expiresAt) {
                const expiryDate = new Date(expiresAt);
                const now = new Date();
                const daysRemaining = Math.ceil(
                  (expiryDate.getTime() - now.getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                setSubscription({
                  expiresAt,
                  isExpiring: daysRemaining <= 7 && daysRemaining > 0,
                  daysRemaining,
                });
              }
            }

            await fetchAllData();
          } else {
            router.push("/");
          }
        } else {
          router.push("/login");
        }
      } catch (err: any) {
        console.error("Auth error:", err);
        if (err.response?.status === 401) {
          router.push("/login");
        } else {
          setError("Failed to authenticate. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
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
                . Renew to continue managing the platform.
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

  // ✅ جلب جميع البيانات
  // ✅ جلب جميع البيانات — بالترتيب الصحيح
  const fetchAllData = async () => {
    setRefreshing(true);
    setError("");
    try {
      // ✅ جلب كل البيانات أولاً بشكل متوازٍ
      const [usersRes, paymentsRes, licensesRes, subsRes] =
        await Promise.allSettled([
          api.get("/admin/users", { withCredentials: true }),
          api.get("/admin/payments", { withCredentials: true }),
          api.get("/admin/licenses", { withCredentials: true }),
          api.get("/subscription/admin/all", { withCredentials: true }),
        ]);

      // ✅ معالجة users
      let newUsers: UserData[] = [];
      if (usersRes.status === "fulfilled") {
        newUsers = usersRes.value.data || [];
        setUsers(newUsers);
        console.log("✅ Users loaded:", newUsers.length);
      } else {
        console.error("❌ Users failed:", usersRes.reason);
      }

      // ✅ معالجة payments
      let newPayments: PaymentData[] = [];
      if (paymentsRes.status === "fulfilled") {
        const raw = paymentsRes.value.data;
        newPayments = Array.isArray(raw)
          ? raw
          : raw?.data || raw?.payments || [];
        setPayments(newPayments);
        console.log("✅ Payments loaded:", newPayments.length);
      } else {
        console.error("❌ Payments failed:", paymentsRes.reason);
      }

      // ✅ معالجة licenses
      let newLicenses: LicenseData[] = [];
      if (licensesRes.status === "fulfilled") {
        newLicenses = licensesRes.value.data || [];
        setLicenses(newLicenses);
        console.log("✅ Licenses loaded:", newLicenses.length);
      } else {
        console.error("❌ Licenses failed:", licensesRes.reason);
      }

      // ✅ معالجة subscriptions
      let newSubs: any[] = [];
      if (subsRes.status === "fulfilled") {
        newSubs = Array.isArray(subsRes.value.data) ? subsRes.value.data : [];
        setSubscriptions(newSubs);
        console.log("✅ Subscriptions loaded:", newSubs.length);
      } else {
        console.warn("⚠️ Subscriptions failed, using users fallback");
        newSubs = newUsers
          .filter((u) => u.plan && u.plan !== "free")
          .map((u) => ({
            id: u.id,
            userId: u.id,
            user: { email: u.email, name: u.name },
            plan: u.plan,
            planId: u.plan,
            status: "ACTIVE",
            isActive: true,
            billingCycle: "monthly",
            startDate: u.createdAt,
            endDate: u.subscription?.expiresAt || null,
            expiresAt: u.subscription?.expiresAt || null,
          }));
        setSubscriptions(newSubs);
      }

      // ✅ الآن احسب الإحصائيات بالبيانات المحدّثة
      await fetchStats(newUsers, newPayments, newLicenses);
    } catch (err) {
      console.error("❌ Failed to fetch data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ جلب المستخدمين
  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users", { withCredentials: true });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users");
    }
  };

  // ✅ جلب المدفوعات
  const fetchPayments = async () => {
    try {
      const res = await api.get("/admin/payments", { withCredentials: true });

      console.log("📊 Full response:", res.data);

      let paymentsData = [];
      let statsData = null;

      if (res.data) {
        if (res.data.data && Array.isArray(res.data.data)) {
          paymentsData = res.data.data;
          statsData = res.data.stats;
        } else if (Array.isArray(res.data)) {
          paymentsData = res.data;
        } else if (res.data.payments && Array.isArray(res.data.payments)) {
          paymentsData = res.data.payments;
          statsData = res.data.stats;
        }
      }

      console.log("✅ Payments data:", paymentsData);
      console.log("✅ Stats data:", statsData);

      setPayments(paymentsData);

      if (statsData) {
        setStats((prev) => ({
          ...prev!,
          totalRevenue: statsData.totalRevenue || 0,
          totalPayments: statsData.totalPayments || paymentsData.length,
          totalPaidUsers: statsData.paidUsers || paymentsData.length,
          activeSubscriptions: statsData.activeUsers || 0,
          revenueByPlan: statsData.revenueByPlan || [],
          monthlyRevenue: statsData.monthlyRevenue || [],
          averageAmount: statsData.averageAmount || 0,
          planDistribution: statsData.planDistribution || [],
        }));
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setError("Failed to load payments");
    }
  };

  // ✅ جلب المفاتيح
  const fetchLicenses = async () => {
    try {
      const res = await api.get("/admin/licenses", { withCredentials: true });
      setLicenses(res.data);
    } catch (err) {
      console.error("Failed to fetch licenses:", err);
      setError("Failed to load licenses");
    }
  };

  // ✅ جلب الاشتراكات
  const fetchSubscriptions = async () => {
    try {
      const res = await api.get("/subscription/admin/all", {
        withCredentials: true,
      });
      let subsData = res.data;
      if (!Array.isArray(res.data)) {
        subsData = [];
      }
      setSubscriptions(subsData);
    } catch (err) {
      console.error("Failed to fetch subscriptions:", err);
      const paidUsers = users.filter((u) => u.plan !== "free");
      setSubscriptions(
        paidUsers.map((u) => ({
          id: u.id,
          userId: u.id,
          user: { email: u.email, name: u.name },
          plan: u.plan,
          planId: u.plan,
          status: "ACTIVE",
          isActive: true,
          billingCycle: "monthly",
          startDate: u.createdAt,
          endDate: u.subscription?.expiresAt || null,
          expiresAt: u.subscription?.expiresAt || null,
        })),
      );
    }
  };

  // ✅ جلب الإحصائيات
  // ✅ جلب الإحصائيات — يعمل حتى لو فشل الـ API
  const fetchStats = async (
    usersData?: UserData[],
    paymentsData?: PaymentData[],
    licensesData?: LicenseData[],
  ) => {
    // ✅ استخدم البيانات المُمرَّرة أو الحالية
    const currentUsers = usersData || users;
    const currentPayments = paymentsData || payments;
    const currentLicenses = licensesData || licenses;

    console.log("📊 fetchStats called with:", {
      usersCount: currentUsers.length,
      paymentsCount: currentPayments.length,
      licensesCount: currentLicenses.length,
    });

    // ✅ 1. حسابات محلية من البيانات المتاحة
    const successfulPayments = currentPayments.filter(
      (p) => p.status === "SUCCEEDED",
    );
    const totalRevenue = successfulPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0,
    );
    const totalPayments = currentPayments.length;

    // ✅ المستخدمون المدفوعون
    const paidUsersList = currentUsers.filter(
      (u) => u.plan && u.plan !== "free",
    );
    const totalPaidUsers = paidUsersList.length;

    // ✅ الإيرادات حسب الخطة
    const revenueByPlan: {
      [key: string]: { amount: number; count: number };
    } = {};
    successfulPayments.forEach((p) => {
      const planId = p.metadata?.planId || p.user?.plan || "free";
      if (!revenueByPlan[planId]) {
        revenueByPlan[planId] = { amount: 0, count: 0 };
      }
      revenueByPlan[planId].amount += p.amount || 0;
      revenueByPlan[planId].count += 1;
    });

    // ✅ الإيرادات الشهرية
    const monthlyData: { [key: string]: { amount: number; count: number } } =
      {};
    successfulPayments.forEach((p) => {
      const date = new Date(p.createdAt);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { amount: 0, count: 0 };
      }
      monthlyData[monthKey].amount += p.amount || 0;
      monthlyData[monthKey].count += 1;
    });

    const monthlyRevenue = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // ✅ توزيع الخطط
    const planDistribution = Object.entries(
      currentUsers.reduce(
        (acc, u) => {
          const plan = u.plan || "free";
          acc[plan] = (acc[plan] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    ).map(([plan, count]) => ({
      plan,
      count,
      percentage:
        currentUsers.length > 0 ? (count / currentUsers.length) * 100 : 0,
    }));

    // ✅ إحصائيات من الـ API (اختياري)
    let apiStats: any = {};
    try {
      const res = await api.get("/admin/stats", { withCredentials: true });
      console.log("📊 /admin/stats response:", res.data);
      apiStats = res.data || {};
    } catch (err) {
      console.warn("⚠️ /admin/stats failed, using local calculations:", err);
    }

    // ✅ دمج البيانات (API له الأولوية، ثم الحسابات المحلية)
    const finalStats: StatsData = {
      totalUsers: apiStats.totalUsers ?? currentUsers.length,
      totalScans:
        apiStats.totalScans ??
        currentUsers.reduce((sum, u) => sum + (u.scansCount || 0), 0),
      totalRevenue: apiStats.totalRevenue ?? totalRevenue,
      totalPayments: apiStats.totalPayments ?? totalPayments,
      totalLicenses: apiStats.totalLicenses ?? currentLicenses.length,
      activeLicenses:
        apiStats.activeLicenses ??
        currentLicenses.filter((l) => l.isActive).length,
      activeSubscriptions:
        apiStats.activeSubscriptions ?? apiStats.activeUsers ?? totalPaidUsers,
      totalPaidUsers:
        apiStats.totalPaidUsers ?? apiStats.paidUsers ?? totalPaidUsers,
      averageAmount:
        apiStats.averageAmount ??
        (successfulPayments.length > 0
          ? totalRevenue / successfulPayments.length
          : 0),
      planDistribution: apiStats.planDistribution ?? planDistribution,
      recentUsers: currentUsers.slice(0, 5),
      recentPayments: currentPayments.slice(0, 5),
      monthlyRevenue: apiStats.monthlyRevenue ?? monthlyRevenue,
      yearlyRevenue: apiStats.yearlyRevenue ?? [],
      revenueByPlan:
        apiStats.revenueByPlan ??
        Object.entries(revenueByPlan).map(([plan, data]) => ({
          plan,
          amount: data.amount,
          count: data.count,
        })),
    };

    console.log("✅ Final stats:", finalStats);
    setStats(finalStats);
  };
  // ✅ تعطيل مفتاح
  const handleRevokeLicense = async (licenseId: string) => {
    if (!confirm("Are you sure you want to revoke this license?")) return;
    try {
      await api.delete(`/admin/licenses/${licenseId}`, {
        withCredentials: true,
      });
      setLicenses(licenses.filter((l) => l.id !== licenseId));
      setSuccess("✅ License revoked successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to revoke license");
      setTimeout(() => setError(""), 3000);
    }
  };

  // ✅ تغيير خطة المستخدم
  const handleChangeUserPlan = async (userId: string, plan: string) => {
    if (
      !confirm(`Change user plan to ${getPlanDisplayName(plan as PlanType)}?`)
    )
      return;
    try {
      await api.put(
        `/admin/users/${userId}/plan`,
        { plan },
        { withCredentials: true },
      );
      setUsers(users.map((u) => (u.id === userId ? { ...u, plan } : u)));
      const planDisplayName = getPlanDisplayName(plan as PlanType);
      setSuccess(`✅ User plan updated to ${planDisplayName}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update user plan");
      setTimeout(() => setError(""), 3000);
    }
  };

  // ✅ حذف مستخدم
  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone!",
      )
    )
      return;
    try {
      await api.delete(`/admin/users/${userId}`, { withCredentials: true });
      setUsers(users.filter((u) => u.id !== userId));
      setSuccess("✅ User deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete user");
      setTimeout(() => setError(""), 3000);
    }
  };

  // ✅ تصفية المستخدمين
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ✅ تصفية المدفوعات
  const filteredPayments = payments.filter(
    (p) =>
      p.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ✅ تصفية المفاتيح
  const filteredLicenses = licenses.filter(
    (l) =>
      l.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.usedBy?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ✅ التحقق من أن المستخدم هو الأدمن الرئيسي
  const isMainAdmin = user?.email === ADMIN_EMAIL;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-sky-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-rose-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Access Denied</h2>
          <p className="text-sm text-slate-400">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl">
      {/* ✅ تحذير انتهاء الاشتراك */}
      {renderSubscriptionWarning()}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-amber-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Admin Dashboard
            {isMainAdmin && (
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                👑 Main Admin
              </span>
            )}
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {user?.email}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAllData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Back to Site</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 sm:p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs sm:text-sm font-medium text-rose-400 mb-4">
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
        <div className="flex items-start gap-2.5 p-3 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-sm font-medium text-emerald-400 mb-4">
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

      {/* ✅ Activate Subscription Section */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent border border-emerald-500/20 mb-6">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Crown className="h-4 w-4 text-emerald-400" />
          Activate Subscription for User
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 transition flex-1"
          >
            <option value="">Select User</option>
            {users.map((u) => {
              const planInfo = getPlanDisplayInfo(u.plan);
              return (
                <option key={u.id} value={u.id} className="bg-slate-900">
                  {u.email} ({u.name || "No name"}) -
                  <span className={planInfo.color}>{planInfo.displayName}</span>
                </option>
              );
            })}
          </select>

          <select
            value={selectedPlanForUser}
            onChange={(e) => setSelectedPlanForUser(e.target.value)}
            className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 transition"
          >
            {allPlans
              .filter((plan) => plan.id !== "free")
              .map((plan) => {
                const features = getPlanFeatures(plan.id);
                return (
                  <option
                    key={plan.id}
                    value={plan.id}
                    className="bg-slate-900"
                  >
                    {features.name} - ${plan.price}/month
                  </option>
                );
              })}
          </select>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setSelectedBillingCycle("monthly")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                selectedBillingCycle === "monthly"
                  ? "bg-sky-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedBillingCycle("yearly")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                selectedBillingCycle === "yearly"
                  ? "bg-sky-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Yearly
              <span className="text-[8px] text-emerald-400 ml-1">Save 20%</span>
            </button>
          </div>

          <button
            onClick={handleActivateSubscription}
            disabled={
              !selectedUserId || !selectedPlanForUser || activatingSubscription
            }
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-sm font-semibold transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activatingSubscription ? (
              <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
            ) : (
              <Crown className="h-4 w-4 inline mr-1" />
            )}
            <span>
              {activatingSubscription
                ? "Activating..."
                : `Activate ${
                    selectedBillingCycle === "monthly" ? "Monthly" : "Yearly"
                  } Plan`}
            </span>
          </button>
        </div>

        {selectedPlanForUser && (
          <div className="mt-2 text-xs text-slate-400">
            Price:{" "}
            <span className="text-white font-mono font-bold">
              {selectedBillingCycle === "monthly"
                ? `$${
                    PLANS[selectedPlanForUser as keyof typeof PLANS]?.price || 0
                  }/month`
                : `$${
                    PLANS[selectedPlanForUser as keyof typeof PLANS]
                      ?.priceYearly || 0
                  }/year`}
            </span>
            {selectedBillingCycle === "yearly" && (
              <span className="text-emerald-400 ml-2">
                (Save $
                {(
                  (PLANS[selectedPlanForUser as keyof typeof PLANS]?.price ||
                    0) *
                    12 -
                  (PLANS[selectedPlanForUser as keyof typeof PLANS]
                    ?.priceYearly || 0)
                ).toFixed(2)}
                )
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-2 mb-6">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "users", label: "Users", icon: Users },
          { id: "payments", label: "Payments", icon: CreditCard },
          { id: "licenses", label: "Licenses", icon: Key },
          { id: "subscriptions", label: "Subscriptions", icon: Crown },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === tab.id
                  ? "bg-sky-600/10 text-sky-400 border border-sky-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* ✅ OVERVIEW TAB */}
      {/* ============================================================ */}
      {activeTab === "overview" && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                label: "Total Revenue",
                value: formatCurrency(stats.totalRevenue || 0),
                icon: DollarSign,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
                subtitle: `${stats.totalPayments || 0} payments`,
              },
              {
                label: "Total Users",
                value: stats.totalUsers || 0,
                icon: Users,
                color: "text-sky-400",
                bg: "bg-sky-500/10",
                subtitle: `${stats.totalPaidUsers || 0} paid users`,
              },
              {
                label: "Active Subscriptions",
                value: stats.activeSubscriptions || 0,
                icon: Crown,
                color: "text-amber-400",
                bg: "bg-amber-500/10",
                subtitle: `${stats.totalLicenses || 0} total licenses`,
              },
              {
                label: "Total Scans",
                value: stats.totalScans || 0,
                icon: Scan,
                color: "text-purple-400",
                bg: "bg-purple-500/10",
                subtitle: "All time scans",
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="p-3 sm:p-4 rounded-xl bg-slate-900/40 border border-slate-800/50 text-center hover:border-slate-700 transition"
                >
                  <div
                    className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${stat.bg} border border-slate-800/50 mb-1.5 sm:mb-2`}
                  >
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-white font-mono">
                    {stat.value}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  {stat.subtitle && (
                    <p className="text-[8px] text-slate-500 mt-0.5">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 && (
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Monthly Revenue
                </h3>
                <span className="text-xs text-slate-400">
                  Total:{" "}
                  {formatCurrency(
                    stats.monthlyRevenue.reduce((sum, m) => sum + m.amount, 0),
                  )}
                </span>
              </div>
              <div className="flex items-end gap-2 h-32">
                {stats.monthlyRevenue.slice(-12).map((month, index) => {
                  const maxAmount = Math.max(
                    ...stats.monthlyRevenue.slice(-12).map((m) => m.amount),
                    1,
                  );
                  const height = (month.amount / maxAmount) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div className="relative w-full flex flex-col items-center">
                        <div
                          className="w-full max-w-[40px] bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t transition-all duration-500"
                          style={{
                            height: `${Math.max(height, 5)}%`,
                            minHeight: "8px",
                          }}
                        />
                      </div>
                      <div className="mt-1 text-center">
                        <p className="text-[8px] text-slate-500 font-mono">
                          {month.month.slice(5)}
                        </p>
                        <p className="text-[7px] text-emerald-400 font-mono">
                          {formatCurrencyShort(month.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-sky-400" />
                Revenue by Plan
              </h3>
              <div className="space-y-3">
                {stats.revenueByPlan && stats.revenueByPlan.length > 0 ? (
                  stats.revenueByPlan.map((item) => {
                    const planInfo = getPlanDisplayInfo(item.plan);
                    const totalRevenue = stats.revenueByPlan.reduce(
                      (sum, p) => sum + p.amount,
                      0,
                    );
                    const percentage =
                      totalRevenue > 0 ? (item.amount / totalRevenue) * 100 : 0;
                    return (
                      <div key={item.plan}>
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-2 text-slate-300">
                            <planInfo.icon
                              className={`h-3 w-3 ${planInfo.color}`}
                            />
                            {planInfo.displayName}
                          </span>
                          <span className="text-white font-mono">
                            {formatCurrency(item.amount)}
                            <span className="text-slate-500 text-[10px] ml-1">
                              ({item.count} payments)
                            </span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${planInfo.color.replace("text-", "bg-")}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No revenue data available
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-400" />
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
                  <span className="text-xs text-slate-400">
                    Average Payment
                  </span>
                  <span className="text-sm font-bold text-white font-mono">
                    {formatCurrency(stats.averageAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
                  <span className="text-xs text-slate-400">
                    Total Paid Users
                  </span>
                  <span className="text-sm font-bold text-white">
                    {stats.totalPaidUsers || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
                  <span className="text-xs text-slate-400">
                    Active Licenses
                  </span>
                  <span className="text-sm font-bold text-white">
                    {stats.activeLicenses || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
                  <span className="text-xs text-slate-400">Total Payments</span>
                  <span className="text-sm font-bold text-white">
                    {stats.totalPayments || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
                  <span className="text-xs text-slate-400">
                    Conversion Rate
                  </span>
                  <span className="text-sm font-bold text-white">
                    {stats.totalUsers > 0
                      ? `${(
                          ((stats.totalPaidUsers || 0) / stats.totalUsers) *
                          100
                        ).toFixed(1)}%`
                      : "0%"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-400" />
              User Distribution by Plan
            </h3>
            <div className="space-y-3">
              {stats.planDistribution?.map((plan: any) => {
                const planInfo = getPlanDisplayInfo(plan.plan);
                return (
                  <div key={plan.plan}>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-2">
                        <planInfo.icon
                          className={`h-3 w-3 ${planInfo.color}`}
                        />
                        {planInfo.displayName}
                      </span>
                      <span>
                        {plan.count} users ({plan.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${planInfo.color.replace("text-", "bg-")}`}
                        style={{ width: `${plan.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-3">
                Recent Users
              </h3>
              <div className="space-y-2">
                {stats.recentUsers?.slice(0, 5).map((u) => {
                  const planInfo = getPlanDisplayInfo(u.plan);
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800/50"
                    >
                      <div>
                        <p className="text-sm text-white">
                          {u.name || "Unknown"}
                        </p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${planInfo.bgColor} ${planInfo.borderColor} ${planInfo.color}`}
                      >
                        <planInfo.icon className="h-3 w-3 inline mr-0.5" />
                        {planInfo.displayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-3">
                Recent Payments
              </h3>
              <div className="space-y-2">
                {stats.recentPayments?.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800/50"
                  >
                    <div>
                      <p className="text-sm text-white">
                        {p.user?.email || "Unknown"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {p.description || "Payment"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white font-mono">
                        {formatCurrency(p.amount)}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          p.status === "SUCCEEDED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : p.status === "FAILED"
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ✅ USERS TAB */}
      {/* ============================================================ */}
      {activeTab === "users" && (
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-400" />
              All Users ({filteredUsers.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400">
                  <th className="text-left py-2 px-3">User</th>
                  <th className="text-left py-2 px-3">Email</th>
                  <th className="text-left py-2 px-3">Plan</th>
                  <th className="text-left py-2 px-3">Role</th>
                  <th className="text-left py-2 px-3">Scans</th>
                  <th className="text-left py-2 px-3">Joined</th>
                  <th className="text-left py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const planInfo = getPlanDisplayInfo(u.plan);
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                    >
                      <td className="py-2 px-3 text-white">{u.name || "—"}</td>
                      <td className="py-2 px-3 text-slate-300">{u.email}</td>
                      <td className="py-2 px-3">
                        <select
                          value={u.plan}
                          onChange={(e) =>
                            handleChangeUserPlan(u.id, e.target.value)
                          }
                          className={`text-xs px-2 py-0.5 rounded-full border border-transparent bg-transparent text-white focus:outline-none focus:border-sky-500 ${planInfo.color}`}
                        >
                          {allPlans.map((plan) => {
                            const features = getPlanFeatures(plan.id);
                            return (
                              <option
                                key={plan.id}
                                value={plan.id}
                                className="bg-slate-900"
                              >
                                {features.name}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            u.role === "admin"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-slate-500/20 text-slate-400"
                          }`}
                        >
                          {u.role || "user"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {u.scansCount || 0}
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowUserModal(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ✅ PAYMENTS TAB */}
      {/* ============================================================ */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          {/* ✅ بطاقة الإحصائيات الشاملة */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Total Revenue",
                value: formatCurrency(stats?.totalRevenue || 0),
                icon: DollarSign,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
                subtitle: `${subscribedUserPayments.filter((p) => p.status === "SUCCEEDED").length} successful`,
              },
              {
                label: "Paid Users",
                value: subscribedUsers.length,
                icon: Users,
                color: "text-sky-400",
                bg: "bg-sky-500/10",
                subtitle: `${users.filter((u) => u.plan === "free").length} free users`,
              },
              {
                label: "Active Subs",
                value: subscribedUsers.filter(
                  (u) =>
                    getSubscriptionStatus(u.subscription?.expiresAt).status ===
                    "active",
                ).length,
                icon: Crown,
                color: "text-amber-400",
                bg: "bg-amber-500/10",
                subtitle: `${subscribedUsers.filter((u) => getSubscriptionStatus(u.subscription?.expiresAt).status === "expiring").length} expiring soon`,
              },
              {
                label: "Average Payment",
                value: formatCurrency(stats?.averageAmount || 0),
                icon: TrendingUp,
                color: "text-purple-400",
                bg: "bg-purple-500/10",
                subtitle: `Total: ${formatCurrency(stats?.totalRevenue || 0)}`,
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="p-3 sm:p-4 rounded-xl bg-slate-900/40 border border-slate-800/50 text-center hover:border-slate-700 transition"
                >
                  <div
                    className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${stat.bg} border border-slate-800/50 mb-1.5 sm:mb-2`}
                  >
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-white font-mono">
                    {stat.value}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  {stat.subtitle && (
                    <p className="text-[8px] text-slate-500 mt-0.5">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* ✅ فلاتر */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Filter className="h-4 w-4" />
              <span>Filters:</span>
            </div>

            <select
              value={paymentPlanFilter}
              onChange={(e) => setPaymentPlanFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 transition"
            >
              <option value="all">All Plans</option>
              {allPlans
                .filter((p) => p.id !== "free")
                .map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {getPlanDisplayName(plan.id as PlanType)}
                  </option>
                ))}
            </select>

            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 transition"
            >
              <option value="all">All Status</option>
              <option value="active">✅ Active</option>
              <option value="expiring">⚠️ Expiring Soon</option>
              <option value="expired">❌ Expired</option>
              <option value="lifetime">♾️ Lifetime</option>
            </select>

            <div className="flex-1 text-right text-xs text-slate-500">
              Showing {filteredSubscribedUsers.length} of{" "}
              {subscribedUsers.length} users
            </div>
          </div>

          {/* ✅ جدول المستخدمين المشتركين */}
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-400" />
                Paid Users ({filteredSubscribedUsers.length})
              </h3>
              <div className="text-xs text-slate-400">
                Total:{" "}
                <span className="text-emerald-400 font-bold font-mono">
                  {formatCurrency(
                    filteredSubscribedUsers.reduce(
                      (sum, u) => sum + getUserTotalPaid(u.id),
                      0,
                    ),
                  )}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400">
                    <th className="text-left py-2 px-3">#</th>
                    <th className="text-left py-2 px-3">User</th>
                    <th className="text-left py-2 px-3">Plan</th>
                    <th className="text-left py-2 px-3">Amount</th>
                    <th className="text-left py-2 px-3">Billing</th>
                    <th className="text-left py-2 px-3">Start Date</th>
                    <th className="text-left py-2 px-3">Expires</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Scans</th>
                    <th className="text-left py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribedUsers.length > 0 ? (
                    filteredSubscribedUsers.map((u, index) => {
                      const planInfo = getPlanDisplayInfo(u.plan);
                      const totalPaid = getUserTotalPaid(u.id);
                      const userPayments = getUserPayments(u.id);
                      const latestPayment = userPayments.sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      )[0];

                      const expiresAt =
                        u.subscription?.expiresAt ||
                        latestPayment?.metadata?.expiresAt;
                      const statusInfo = getSubscriptionStatus(expiresAt);
                      const billingCycle = getBillingCycle(
                        latestPayment?.metadata,
                      );

                      const planPrice =
                        PLANS[u.plan as keyof typeof PLANS]?.price || 0;
                      const planPriceYearly =
                        PLANS[u.plan as keyof typeof PLANS]?.priceYearly ||
                        planPrice * 12;
                      const expectedPrice =
                        billingCycle === "Yearly" ? planPriceYearly : planPrice;

                      return (
                        <tr
                          key={u.id}
                          className="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                        >
                          <td className="py-2 px-3 text-slate-500 text-xs">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3">
                            <div>
                              <p className="text-white text-sm">
                                {u.name || "Unknown"}
                              </p>
                              <p className="text-slate-400 text-xs">
                                {u.email}
                              </p>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${planInfo.bgColor} ${planInfo.borderColor} ${planInfo.color} inline-flex items-center gap-1`}
                            >
                              <planInfo.icon className="h-3 w-3" />
                              {planInfo.displayName}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div>
                              <p className="text-white font-mono font-bold">
                                {totalPaid > 0
                                  ? formatCurrency(totalPaid)
                                  : formatCurrency(expectedPrice)}
                              </p>
                              <p className="text-slate-500 text-[10px]">
                                {userPayments.length > 0
                                  ? `${userPayments.length} payment${userPayments.length > 1 ? "s" : ""}`
                                  : "No payments recorded"}
                              </p>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                billingCycle === "Yearly"
                                  ? "bg-purple-500/20 text-purple-400"
                                  : "bg-sky-500/20 text-sky-400"
                              }`}
                            >
                              {billingCycle}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-xs">
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-xs">
                            {expiresAt ? (
                              <div>
                                <p>
                                  {new Date(expiresAt).toLocaleDateString()}
                                </p>
                                {statusInfo.daysRemaining !== undefined && (
                                  <p
                                    className={`text-[10px] ${
                                      statusInfo.daysRemaining <= 0
                                        ? "text-rose-400"
                                        : statusInfo.daysRemaining <= 7
                                          ? "text-amber-400"
                                          : "text-emerald-400"
                                    }`}
                                  >
                                    {statusInfo.daysRemaining <= 0
                                      ? "Expired"
                                      : `${statusInfo.daysRemaining} days left`}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-purple-400">Lifetime</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                statusInfo.status === "active"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : statusInfo.status === "expiring"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : statusInfo.status === "lifetime"
                                      ? "bg-purple-500/20 text-purple-400"
                                      : "bg-rose-500/20 text-rose-400"
                              }`}
                            >
                              {statusInfo.status === "active" && "✅ Active"}
                              {statusInfo.status === "expiring" &&
                                "⚠️ Expiring"}
                              {statusInfo.status === "expired" && "❌ Expired"}
                              {statusInfo.status === "lifetime" &&
                                "♾️ Lifetime"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-300 text-xs">
                            {u.scansCount || 0}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowUserModal(true);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                                title="View Details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleChangeUserPlan(
                                    u.id,
                                    u.plan === "extra" ? "pro" : "extra",
                                  )
                                }
                                className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                                title="Change Plan"
                              >
                                <Crown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        className="py-12 text-center text-slate-400"
                      >
                        <CreditCard className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                        <p className="text-sm">No subscribed users found</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {paymentPlanFilter !== "all" ||
                          paymentStatusFilter !== "all"
                            ? "Try changing your filters"
                            : "Users with paid subscriptions will appear here"}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ✅ جدول المدفوعات الخام */}
          {payments.length > 0 && (
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <History className="h-4 w-4 text-sky-400" />
                Payment History ({payments.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400">
                      <th className="text-left py-2 px-3">#</th>
                      <th className="text-left py-2 px-3">User</th>
                      <th className="text-left py-2 px-3">Amount</th>
                      <th className="text-left py-2 px-3">Status</th>
                      <th className="text-left py-2 px-3">Description</th>
                      <th className="text-left py-2 px-3">Date</th>
                      <th className="text-left py-2 px-3">Paid At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.slice(0, 20).map((payment, index) => (
                      <tr
                        key={payment.id}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                      >
                        <td className="py-2 px-3 text-slate-500 text-xs">
                          {index + 1}
                        </td>
                        <td className="py-2 px-3">
                          <div>
                            <p className="text-white text-sm">
                              {payment.user?.name || "Unknown"}
                            </p>
                            <p className="text-slate-400 text-xs">
                              {payment.user?.email || "No email"}
                            </p>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-white font-mono font-bold">
                            {formatCurrency(payment.amount)}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              payment.status === "SUCCEEDED"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : payment.status === "FAILED"
                                  ? "bg-rose-500/20 text-rose-400"
                                  : payment.status === "REFUNDED"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-slate-500/20 text-slate-400"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300 text-xs">
                          {payment.description || "—"}
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-xs">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-xs">
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {payments.length > 20 && (
                  <p className="text-center text-xs text-slate-500 mt-3">
                    Showing 20 of {payments.length} payments
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ✅ LICENSES TAB */}
      {/* ============================================================ */}
      {activeTab === "licenses" && (
        <div className="space-y-6">
          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-400" />
              Create New License
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                id="planSelect"
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 transition"
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
              <input
                type="email"
                id="emailInput"
                placeholder="User email (optional)"
                className="flex-1 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500 transition"
              />
              <button
                onClick={() => {
                  const plan = (
                    document.getElementById("planSelect") as HTMLSelectElement
                  ).value;
                  const email = (
                    document.getElementById("emailInput") as HTMLInputElement
                  ).value;
                  handleCreateLicense(plan, email || undefined);
                }}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-sm font-semibold transition shadow-lg shadow-amber-500/20"
              >
                <Sparkles className="h-4 w-4 inline mr-1" />
                Generate License
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Key className="h-4 w-4 text-purple-400" />
              All Licenses ({filteredLicenses.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400">
                    <th className="text-left py-2 px-3">Key</th>
                    <th className="text-left py-2 px-3">Plan</th>
                    <th className="text-left py-2 px-3">Used By</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Uses</th>
                    <th className="text-left py-2 px-3">Expires</th>
                    <th className="text-left py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLicenses.map((license) => {
                    const planInfo = getPlanDisplayInfo(license.plan);
                    return (
                      <tr
                        key={license.id}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                      >
                        <td className="py-2 px-3 font-mono text-xs text-sky-400">
                          {license.key}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${planInfo.bgColor} ${planInfo.borderColor} ${planInfo.color}`}
                          >
                            <planInfo.icon className="h-3 w-3 inline mr-0.5" />
                            {planInfo.displayName}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          {license.usedBy || "—"}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              license.isActive
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-rose-500/20 text-rose-400"
                            }`}
                          >
                            {license.isActive ? "Active" : "Revoked"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          {license.usesCount || 0}
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-xs">
                          {license.expiresAt
                            ? new Date(license.expiresAt).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="py-2 px-3">
                          {license.isActive && (
                            <button
                              onClick={() => handleRevokeLicense(license.id)}
                              className="text-xs text-rose-400 hover:text-rose-300 transition"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ✅ SUBSCRIPTIONS TAB */}
      {/* ============================================================ */}
      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Total",
                value: subscriptions.length,
                icon: Crown,
                color: "text-amber-400",
              },
              {
                label: "Active",
                value: subscriptions.filter((s) => s.isActive !== false).length,
                icon: Check,
                color: "text-emerald-400",
              },
              {
                label: "Free Users",
                value: users.filter((u) => u.plan === "free").length,
                icon: User,
                color: "text-slate-400",
              },
              {
                label: "Paid Users",
                value: users.filter((u) => u.plan !== "free").length,
                icon: DollarSign,
                color: "text-emerald-400",
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/50 text-center"
                >
                  <Icon className={`h-5 w-5 ${stat.color} mx-auto mb-1`} />
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-[10px] text-slate-400 uppercase">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-400" />
              Subscriptions ({subscriptions.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400">
                    <th className="text-left py-2 px-3">User</th>
                    <th className="text-left py-2 px-3">Plan</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Billing</th>
                    <th className="text-left py-2 px-3">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.length > 0 ? (
                    subscriptions.map((sub) => {
                      const planInfo = getPlanDisplayInfo(
                        sub.plan || sub.planId || "free",
                      );
                      return (
                        <tr
                          key={sub.id || sub.userId}
                          className="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                        >
                          <td className="py-2 px-3 text-white">
                            {sub.user?.email || sub.email || "Unknown"}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${planInfo.bgColor} ${planInfo.borderColor} ${planInfo.color}`}
                            >
                              <planInfo.icon className="h-3 w-3 inline mr-0.5" />
                              {planInfo.displayName}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                sub.status === "ACTIVE" ||
                                sub.isActive !== false
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : sub.status === "CANCELLED"
                                    ? "bg-rose-500/20 text-rose-400"
                                    : "bg-amber-500/20 text-amber-400"
                              }`}
                            >
                              {sub.status === "ACTIVE" || sub.isActive !== false
                                ? "✅ Active"
                                : "❌ Inactive"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-300">
                            {sub.billingCycle || "monthly"}
                          </td>
                          <td className="py-2 px-3 text-slate-400 text-xs">
                            {sub.endDate || sub.expiresAt
                              ? new Date(
                                  sub.endDate || sub.expiresAt,
                                ).toLocaleDateString()
                              : sub.expiresAt === null
                                ? "Never"
                                : "—"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-slate-400"
                      >
                        <Crown className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                        <p>No subscriptions found</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Subscriptions will appear here when users subscribe
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ✅ User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="h-5 w-5 text-sky-400" />
                User Details
              </h3>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase">Name</p>
                <p className="text-sm text-white">{selectedUser.name || "—"}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase">Email</p>
                <p className="text-sm text-white truncate">
                  {selectedUser.email}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase">Plan</p>
                <p className="text-sm text-white">{selectedUser.plan}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase">Role</p>
                <p className="text-sm text-white">{selectedUser.role}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase">
                  Total Paid
                </p>
                <p className="text-sm text-emerald-400 font-mono font-bold">
                  {formatCurrency(getUserTotalPaid(selectedUser.id))}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase">
                  Total Scans
                </p>
                <p className="text-sm text-white font-mono">
                  {selectedUser.scansCount || 0}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-2">
                Payment History ({getUserPayments(selectedUser.id).length})
              </h4>
              {getUserPayments(selectedUser.id).length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {getUserPayments(selectedUser.id).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800"
                    >
                      <div>
                        <p className="text-xs text-white">
                          {p.description || "Payment"}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(p.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white font-mono font-bold">
                          {formatCurrency(p.amount)}
                        </p>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            p.status === "SUCCEEDED"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">
                  No payment records
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Upgrade Modal */}
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

export default withAdmin(AdminPage);
