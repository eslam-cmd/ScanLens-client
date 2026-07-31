// client/app/scan/page.tsx

"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Search,
  Zap,
  BarChart3,
  Sparkles,
  Terminal,
  TrendingUp,
  TrendingDown,
  Minus,
  History,
  Lock,
  LockKeyhole,
  Globe,
  FileSpreadsheet,
  FileText,
  Cookie,
  Loader2,
  Check,
  X,
  ArrowRight,
  Clock,
  Calendar,
  ChevronDown,
  ChevronRight,
  Shield,
  Server,
  Award,
  AlertCircle,
  LogIn,
  Crown,
  Filter,
  Timer,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import Link from "next/link";
import { Infinity as InfinityIcon } from "lucide-react";

// ✅ استيراد من الملف المركزي للخطط
import {
  PlanType,
  PlanFeatures,
  getPlanFeatures,
  getPlan,
  getMaxScans,
} from "@/lib/plans.config";

// ✅ استيراد UpgradeModal
import UpgradeModal from "@/components/layout/UpgradeModal";

// ✅ ثوابت المستخدم الزائر
const MAX_GUEST_SCANS = 2;
const STORAGE_KEY = "guestScanData";

// ✅ دالة للحصول على بيانات الزائر
const getGuestScanData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      const today = new Date().toDateString();
      if (parsed.date !== today) {
        return { count: 0, date: today };
      }
      return parsed;
    }
  } catch {
    // تجاهل الأخطاء
  }
  return { count: 0, date: new Date().toDateString() };
};

// ✅ دالة لحفظ بيانات الزائر
const saveGuestScanData = (count: number) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        count,
        date: new Date().toDateString(),
      }),
    );
  } catch {
    // تجاهل الأخطاء
  }
};

function ScanPageContent({ user: initialUser }: { user?: any }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialUrl = searchParams.get("url") || "";

  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [targetUrl, setTargetUrl] = useState(initialUrl);
  const [isDeepScan, setIsDeepScan] = useState(true);
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "ai-remediation">(
    "overview",
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["ssl", "cors", "cookies"]),
  );

  // ✅ Session & User state
  const [user, setUser] = useState<any>(initialUser || null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPlan, setUserPlan] = useState<PlanType>("free");
  const [userRole, setUserRole] = useState<string>("user");
  const [aiFixes, setAiFixes] = useState<Record<number, string>>({});
  const [loadingFixIndex, setLoadingFixIndex] = useState<number | null>(null);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // ✅ Guest scan state - تتجدد يومياً
  const [guestScanData, setGuestScanData] = useState(() => getGuestScanData());
  const guestScanCount = guestScanData.count;

  const setGuestScanCount = (count: number) => {
    const newData = { ...guestScanData, count };
    setGuestScanData(newData);
    saveGuestScanData(count);
  };

  const [scanFilters, setScanFilters] = useState({
    severity: "all",
    category: "all",
    searchQuery: "",
  });
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

  // ✅ الحصول على ميزات الخطة
  const userPlanFeatures = useMemo(() => {
    const features = getPlanFeatures(userPlan);
    return features;
  }, [userPlan]);

  const userPlanData = useMemo(() => {
    return getPlan(userPlan);
  }, [userPlan]);

  const PlanIcon = userPlanFeatures.icon;

  // ✅ تعريف fetchScanHistory
  const fetchScanHistory = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await api.get("/scans/history", { withCredentials: true });
      setScanHistory(res.data || []);
    } catch (err) {
      console.error("Failed to fetch scan history:", err);
    }
  }, [isLoggedIn]);

  // ✅ تعريف getScanLimitStatus
  const getScanLimitStatus = useCallback(() => {
    if (isLoggedIn) {
      const maxScans = getMaxScans(userPlan);
      const scansUsed = scanHistory?.length || 0;

      if (maxScans === Infinity) {
        return {
          isLimitReached: false,
          remaining: Infinity,
          message: "Unlimited scans",
        };
      }

      const remaining = Math.max(0, (maxScans as number) - scansUsed);
      const isLimitReached = remaining <= 0;

      return {
        isLimitReached,
        remaining,
        message: isLimitReached
          ? `⚠️ You've reached your ${userPlanFeatures.name} plan's daily limit`
          : `${remaining} scans remaining today`,
      };
    }

    const remaining = Math.max(0, MAX_GUEST_SCANS - guestScanCount);
    const isLimitReached = remaining <= 0;

    return {
      isLimitReached,
      remaining,
      message: isLimitReached
        ? "⚠️ Daily free scan limit reached"
        : `${remaining} free scans remaining today`,
    };
  }, [isLoggedIn, userPlan, userPlanFeatures, scanHistory, guestScanCount]);

  // ✅ استخدم fetchScanHistory في useEffect
  useEffect(() => {
    if (isLoggedIn) {
      fetchScanHistory();
    }
  }, [isLoggedIn, fetchScanHistory]);

  // ✅ التحقق من صلاحية المستخدم
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await api.get("/auth/me", { withCredentials: true });
        if (res.data?.user) {
          const userData = res.data.user;
          setUser(userData);
          setIsLoggedIn(true);
          setUserPlan(userData.plan || "free");
          setUserRole(userData.role || "user");

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
          setIsLoggedIn(false);
          const data = getGuestScanData();
          setGuestScanData(data);
        }
      } catch {
        setIsLoggedIn(false);
        const data = getGuestScanData();
        setGuestScanData(data);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkSession();
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

  // Auto-scan on load if URL is provided
  useEffect(() => {
    if (initialUrl && !isCheckingAuth) {
      setInputUrl(initialUrl);
      setTargetUrl(initialUrl);
      fetchScan(initialUrl);
    }
  }, [initialUrl, isCheckingAuth]);

  // ✅ التحقق من صلاحية الفحص
  const canPerformScan = useCallback(() => {
    if (isLoggedIn) {
      const maxScans = getMaxScans(userPlan);
      if (maxScans === Infinity) return true;
      return true;
    }
    return guestScanCount < MAX_GUEST_SCANS;
  }, [isLoggedIn, guestScanCount, userPlan]);

  // ✅ دالة التحقق من الميزة
  const hasFeature = useCallback(
    (feature: keyof PlanFeatures) => {
      if (!isLoggedIn) return false;
      return userPlanFeatures[feature] || false;
    },
    [isLoggedIn, userPlanFeatures],
  );

  // ✅ fetchScan باستخدام Direct Scan (بدون Queue)
  const fetchScan = useCallback(
    async (urlToScan: string) => {
      if (!urlToScan) return;

      if (!isLoggedIn) {
        const remaining = MAX_GUEST_SCANS - guestScanCount;
        if (remaining <= 0) {
          setError(
            "You have reached the daily limit of 2 free scans. Please log in to continue scanning.",
          );
          return;
        }
      }

      if (!canPerformScan()) {
        setError(
          isLoggedIn
            ? "You have reached your plan's scan limit. Please upgrade to continue."
            : "You have reached the daily limit of 2 free scans. Please log in to continue scanning.",
        );
        return;
      }

      let formattedUrl = urlToScan.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
        setInputUrl(formattedUrl);
      }

      setLoading(true);
      setError("");

      try {
        // ✅ استخدام direct-scan بدلاً من queue
        const res = await api.post("/scans/direct-scan", {
          url: formattedUrl,
          deepScan: isDeepScan,
        });

        console.log("📊 Direct scan result:", res.data);
        setScanResult(res.data);
        setLoading(false);

        if (!isLoggedIn) {
          setGuestScanCount(guestScanCount + 1);
        } else {
          fetchScanHistory();
        }
      } catch (err: any) {
        console.error("❌ Scan error:", err);
        if (err.response?.status === 429) {
          setError(
            "Rate limit exceeded. Please wait a moment before trying again.",
          );
        } else if (err.response?.status === 401) {
          setError(
            "Session expired. Please log in again to continue scanning.",
          );
          setIsLoggedIn(false);
        } else if (err.response?.status === 500) {
          setError("Server error. Please try again later.");
        } else {
          setError(
            err.response?.data?.message || "Failed to complete website scan",
          );
        }
        setLoading(false);
      }
    },
    [
      isDeepScan,
      isLoggedIn,
      canPerformScan,
      guestScanCount,
      fetchScanHistory,
      setGuestScanCount,
    ],
  );

  // ✅ handleScanSubmit
  const handleScanSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputUrl) return;

      const limitStatus = getScanLimitStatus();
      if (limitStatus.isLimitReached) {
        setError(
          isLoggedIn
            ? `You have reached your daily limit of ${getMaxScans(userPlan)} scans. Upgrade your plan for unlimited scans.`
            : `You have reached the daily limit of ${MAX_GUEST_SCANS} free scans. Please sign in to continue.`,
        );
        return;
      }

      if (!isLoggedIn) {
        const remaining = MAX_GUEST_SCANS - guestScanCount;
        if (remaining <= 0) {
          setError(
            "You have reached the daily limit of 2 free scans. Please log in to continue scanning.",
          );
          return;
        }
      }

      if (!canPerformScan()) {
        setError(
          isLoggedIn
            ? "You have reached your plan's scan limit. Please upgrade to continue."
            : "You have reached the daily limit of 2 free scans. Please log in to continue scanning.",
        );
        return;
      }

      setTargetUrl(inputUrl);
      router.replace(`/scan?url=${encodeURIComponent(inputUrl)}`, {
        scroll: false,
      });

      await fetchScan(inputUrl);
    },
    [
      inputUrl,
      canPerformScan,
      isLoggedIn,
      fetchScan,
      router,
      guestScanCount,
      userPlan,
      getScanLimitStatus,
    ],
  );

  // ✅ handleRequestAiFix
  const handleRequestAiFix = useCallback(
    async (title: string, description: string, index: number) => {
      if (!isLoggedIn || !hasFeature("aiFixes")) {
        setError(
          "AI fixes are not available on your current plan. Please upgrade to access this feature.",
        );
        return;
      }

      setLoadingFixIndex(index);
      setError("");

      try {
        const res = await api.post("/scans/ai-fix", {
          title,
          description,
        });
        setAiFixes((prev) => ({ ...prev, [index]: res.data.remediation }));
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setIsLoggedIn(false);
          setError("Session expired. Please log in to use AI features.");
        } else if (err.response?.status === 429) {
          setError(
            "Rate limit exceeded for AI features. Please try again later.",
          );
        } else {
          setError(err.response?.data?.message || "Failed to generate AI fix.");
        }
      } finally {
        setLoadingFixIndex(null);
      }
    },
    [isLoggedIn, hasFeature],
  );

  // ✅ downloadReport
  const downloadReport = useCallback(
    async (type: "csv" | "pdf") => {
      if (!isLoggedIn || !hasFeature("exportReports")) {
        setError(
          "Report export is not available on your current plan. Please upgrade to access this feature.",
        );
        return;
      }

      if (!scanResult?.id) {
        setError("No valid scan ID found. Please re-run the scan.");
        return;
      }

      setExporting(type);
      try {
        const response = await api.get(
          `/scans/${scanResult.id}/export/${type}`,
          {
            responseType: "blob",
          },
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `SecureLens-Report-${scanResult.id}.${type}`,
        );
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        setError(
          `Failed to download the ${type.toUpperCase()} report. Please try again.`,
        );
      } finally {
        setExporting(null);
      }
    },
    [isLoggedIn, hasFeature, scanResult],
  );

  // ✅ toggleSection
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  // ✅ تصفية الثغرات
  const filteredVulnerabilities = useMemo(() => {
    if (!scanResult?.vulnerabilities) return [];
    let vulns = [...scanResult.vulnerabilities];

    if (scanFilters.severity !== "all") {
      vulns = vulns.filter((v) => v.severity === scanFilters.severity);
    }

    if (scanFilters.category !== "all") {
      vulns = vulns.filter((v) =>
        v.title.toLowerCase().includes(scanFilters.category.toLowerCase()),
      );
    }

    if (scanFilters.searchQuery) {
      vulns = vulns.filter(
        (v) =>
          v.title
            .toLowerCase()
            .includes(scanFilters.searchQuery.toLowerCase()) ||
          v.description
            .toLowerCase()
            .includes(scanFilters.searchQuery.toLowerCase()),
      );
    }

    return vulns;
  }, [scanResult, scanFilters]);

  // ✅ isScanButtonDisabled
  const isScanButtonDisabled = useCallback(() => {
    if (loading) return true;
    if (!inputUrl) return true;

    const status = getScanLimitStatus();
    if (status.isLimitReached) return true;

    return false;
  }, [loading, inputUrl, getScanLimitStatus]);

  // ✅ renderLimitError
  const renderLimitError = () => {
    const status = getScanLimitStatus();

    if (!status.isLimitReached && !error) return null;

    if (error) {
      const isLimitError =
        error.includes("limit") ||
        error.includes("reached") ||
        error.includes("quota");

      if (isLimitError) {
        return (
          <div className="p-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-center space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-amber-500/20">
                <AlertTriangle className="h-10 w-10 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Scan Limit Reached
              </h3>
              <p className="text-sm text-slate-300 max-w-md">{error}</p>

              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 px-4 py-2 rounded-lg">
                <Clock className="h-4 w-4 text-amber-400" />
                <span>Limit resets at midnight</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2">
                {!isLoggedIn ? (
                  <Link
                    href="/login"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-sm font-semibold transition shadow-lg shadow-sky-600/20 inline-flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In for More Scans</span>
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-sm font-semibold transition shadow-lg shadow-amber-500/20 inline-flex items-center gap-2"
                    >
                      <Crown className="h-4 w-4" />
                      <span>Upgrade Plan</span>
                    </button>
                    <Link
                      href="/subscription"
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                    >
                      View Plans
                    </Link>
                  </>
                )}
              </div>

              {isLoggedIn && (
                <div className="text-xs text-slate-500 mt-2">
                  Current plan:{" "}
                  <span className={userPlanFeatures.color}>
                    {userPlanFeatures.name}
                  </span>
                  {userPlan !== "extra" && (
                    <span className="block text-emerald-400 mt-1">
                      💡 Upgrade to <span className="font-bold">Pro</span> or{" "}
                      <span className="font-bold">Extra</span> for unlimited
                      scans
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }
    }

    if (status.isLimitReached) {
      return (
        <div className="p-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-center space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-amber-500/20 animate-pulse">
              <Clock className="h-10 w-10 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white">
              ⚠️ Scan Limit Reached
            </h3>
            <p className="text-sm text-slate-300 max-w-md">
              {isLoggedIn
                ? `You've used all ${getMaxScans(userPlan)} scans available on your ${userPlanFeatures.name} plan today.`
                : `You've used all ${MAX_GUEST_SCANS} free scans available for guests today.`}
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/50 px-4 py-2 rounded-lg">
              <RefreshCw className="h-4 w-4 text-amber-400 animate-spin-slow" />
              <span>Resets at midnight</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2">
              {!isLoggedIn ? (
                <Link
                  href="/login"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-sm font-semibold transition shadow-lg shadow-sky-600/20 inline-flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In for More Scans</span>
                </Link>
              ) : userPlan !== "extra" ? (
                <>
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-sm font-semibold transition shadow-lg shadow-amber-500/20 inline-flex items-center gap-2"
                  >
                    <Crown className="h-4 w-4" />
                    <span>Upgrade Now</span>
                  </button>
                  <Link
                    href="/subscription"
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                  >
                    View Plans
                  </Link>
                </>
              ) : (
                <div className="text-emerald-400 text-sm font-semibold">
                  ✅ You have unlimited scans on your Extra plan
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // ✅ renderErrorMessages
  const renderErrorMessages = () => {
    const limitStatus = getScanLimitStatus();
    if (limitStatus.isLimitReached) {
      return renderLimitError();
    }

    if (!error) return null;

    const errorConfigs: Record<
      string,
      { icon: any; color: string; title: string; action?: React.ReactNode }
    > = {
      "You have reached the daily limit": {
        icon: Clock,
        color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
        title: "Daily Scan Limit Reached",
        action: (
          <div className="flex flex-wrap items-center gap-2">
            {!isLoggedIn ? (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition shadow-lg shadow-sky-600/20 inline-flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In for More</span>
              </Link>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-semibold transition shadow-lg shadow-amber-500/20 inline-flex items-center gap-2"
              >
                <Crown className="h-4 w-4" />
                <span>Upgrade Plan</span>
              </button>
            )}
            <button
              onClick={() => setError("")}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Dismiss
            </button>
          </div>
        ),
      },
      "You have reached your plan's scan limit": {
        icon: Crown,
        color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
        title: "Plan Limit Reached",
        action: (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-semibold transition shadow-lg shadow-amber-500/20 inline-flex items-center gap-2"
          >
            <Crown className="h-4 w-4" />
            <span>Upgrade Plan</span>
          </button>
        ),
      },
      "Session expired": {
        icon: Lock,
        color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
        title: "Session Expired",
        action: (
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition shadow-lg shadow-sky-600/20 inline-flex items-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In Again</span>
          </Link>
        ),
      },
      "Server error": {
        icon: Server,
        color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
        title: "Server Error",
        action: (
          <button
            onClick={() => setError("")}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            <RefreshCw className="h-4 w-4 inline mr-1" />
            Try Again
          </button>
        ),
      },
    };

    let matchedConfig = null;
    for (const [key, config] of Object.entries(errorConfigs)) {
      if (error.includes(key) || key.includes(error)) {
        matchedConfig = config;
        break;
      }
    }

    const Icon = matchedConfig?.icon || AlertTriangle;
    const color =
      matchedConfig?.color || "text-rose-400 border-rose-500/30 bg-rose-500/10";
    const title = matchedConfig?.title || "Scan Failed";
    const action = matchedConfig?.action || (
      <button
        onClick={() => setError("")}
        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
      >
        Dismiss
      </button>
    );

    return (
      <div
        className={`p-6 sm:p-8 rounded-2xl border ${color} text-center space-y-4`}
      >
        <Icon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto" />
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">{error}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action}
        </div>
      </div>
    );
  };

  // ✅ renderScanLimitWarning
  const renderScanLimitWarning = () => {
    const status = getScanLimitStatus();

    if (status.isLimitReached) {
      return (
        <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 px-3 py-2 rounded-lg border border-amber-500/20">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            {isLoggedIn
              ? `You've reached your daily limit of ${getMaxScans(userPlan)} scans. Upgrade for unlimited scans.`
              : `You've reached the daily limit of ${MAX_GUEST_SCANS} free scans. Sign in for more.`}
          </span>
          {!isLoggedIn ? (
            <Link
              href="/login"
              className="text-sky-400 hover:text-sky-300 font-semibold underline ml-1"
            >
              Sign In
            </Link>
          ) : (
            userPlan !== "extra" && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-amber-400 hover:text-amber-300 font-semibold underline ml-1"
              >
                Upgrade
              </button>
            )
          )}
        </div>
      );
    }

    const remaining = status.remaining;
    if (remaining !== Infinity && remaining <= 2) {
      return (
        <div className="flex items-center gap-2 text-amber-400/70 text-xs bg-amber-500/5 px-3 py-2 rounded-lg border border-amber-500/10">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>
            {remaining} {remaining === 1 ? "scan" : "scans"} remaining today
            {isLoggedIn && userPlan === "free" && (
              <span className="text-slate-500 ml-1">
                •{" "}
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="text-sky-400 hover:underline"
                >
                  Upgrade for more
                </button>
              </span>
            )}
          </span>
        </div>
      );
    }

    return null;
  };

  // ✅ renderUserPlanBadge
  const renderUserPlanBadge = () => {
    if (!isLoggedIn) return null;
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${userPlanFeatures.bgColor} border ${userPlanFeatures.borderColor}`}
      >
        <PlanIcon className={`h-3.5 w-3.5 ${userPlanFeatures.color}`} />
        <span className={`text-xs font-semibold ${userPlanFeatures.color}`}>
          {userPlanFeatures.name}
        </span>
        <span
          className={`text-[8px] px-1.5 py-0.5 rounded-full ${userPlanFeatures.badgeColor}`}
        >
          {userPlanData.badge}
        </span>
      </div>
    );
  };

  // ✅ renderFeatureBadge
  const renderFeatureBadge = (feature: keyof PlanFeatures, label: string) => {
    const available = hasFeature(feature);
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
          available
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-slate-800/50 text-slate-500 border border-slate-700"
        }`}
      >
        {available ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        {label}
      </span>
    );
  };

  // ✅ renderScanLimitInfo
  const renderScanLimitInfo = () => {
    if (isLoggedIn) {
      const maxScans = getMaxScans(userPlan);
      const maxScansNum = typeof maxScans === "number" ? maxScans : 0;

      if (maxScansNum === Infinity) {
        return (
          <span className="flex items-center gap-1 text-purple-400">
            <InfinityIcon className="h-3 w-3" />
            Unlimited scans
          </span>
        );
      }

      const scansUsed = scanHistory?.length || 0;
      const remaining = Math.max(0, maxScansNum - scansUsed);

      return (
        <span className="text-xs text-slate-400">
          {remaining} / {maxScansNum} scans remaining today
        </span>
      );
    }

    const remaining = MAX_GUEST_SCANS - guestScanCount;
    return (
      <span className="text-xs text-slate-400">
        {remaining} / {MAX_GUEST_SCANS} free scans remaining today
      </span>
    );
  };

  // ✅ renderStatusBadge
  const renderStatusBadge = (status: boolean, label: string) => (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        status
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
      }`}
    >
      {status ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </span>
  );

  // ✅ renderCookiesData
  const renderCookiesData = () => {
    const cookies = scanResult?.cookies || [];

    if (!cookies || cookies.length === 0) {
      return (
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
          <p className="text-xs text-slate-500">No session cookies detected.</p>
        </div>
      );
    }

    const secureCookies = cookies.filter((c: any) => c.hasSecure);
    const httpOnlyCookies = cookies.filter((c: any) => c.hasHttpOnly);
    const sameSiteCookies = cookies.filter((c: any) => c.sameSite);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
            <p className="text-lg font-bold text-white">{cookies.length}</p>
            <p className="text-[9px] text-slate-400 uppercase">Total Cookies</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 border border-emerald-500/20 text-center">
            <p className="text-lg font-bold text-emerald-400">
              {secureCookies.length}
            </p>
            <p className="text-[9px] text-emerald-400 uppercase">Secure</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 border border-sky-500/20 text-center">
            <p className="text-lg font-bold text-sky-400">
              {httpOnlyCookies.length}
            </p>
            <p className="text-[9px] text-sky-400 uppercase">HttpOnly</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 border border-amber-500/20 text-center">
            <p className="text-lg font-bold text-amber-400">
              {sameSiteCookies.length}
            </p>
            <p className="text-[9px] text-amber-400 uppercase">SameSite</p>
          </div>
        </div>

        <div className="space-y-2">
          {cookies.slice(0, 4).map((cookie: any, i: number) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-mono text-white truncate">
                  {cookie.name}
                </span>
                <div className="flex items-center gap-1.5">
                  {cookie.hasSecure && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Secure
                    </span>
                  )}
                  {cookie.hasHttpOnly && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      HttpOnly
                    </span>
                  )}
                  {cookie.sameSite && (
                    <span
                      className={`text-[8px] px-1.5 py-0.5 rounded ${
                        cookie.sameSite === "None"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      SameSite: {cookie.sameSite}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {cookie.path || "/"}
              </p>
            </div>
          ))}
          {cookies.length > 4 && (
            <p className="text-[10px] text-slate-500 text-center">
              +{cookies.length - 4} more cookies
            </p>
          )}
        </div>
      </div>
    );
  };

  // ✅ عرض تحذير انتهاء الاشتراك
  const renderSubscriptionWarning = () => {
    if (!isLoggedIn || userRole === "admin") return null;
    if (!subscription?.isExpiring || !subscription?.expiresAt) return null;

    const isExpired = subscription.daysRemaining <= 0;
    const isCritical = subscription.daysRemaining <= 3;

    if (isExpired) {
      return (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 mb-4 animate-pulse">
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
                  Your {userPlanFeatures.name} plan has expired. Renew now to
                  continue using premium features.
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
        } mb-4`}
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
                Your {userPlanFeatures.name} plan will expire in{" "}
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

  const score = scanResult?.score ?? 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 50) return "#f59e0b";
    return "#f43f5e";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Needs Improvement";
  };

  const gaugeData = [
    { name: "Score", value: score },
    { name: "Remaining", value: 100 - score },
  ];

  const headersChartData = [
    {
      name: "Security Headers",
      Present: scanResult?.headers?.presentHeaders?.length || 0,
      Missing: scanResult?.headers?.missingHeaders?.length || 0,
    },
  ];

  if (isCheckingAuth) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-sky-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // 🖥️ RENDER
  // ============================================================
  return (
    <div
      className="container mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl space-y-6 sm:space-y-8"
      dir="ltr"
    >
      {renderSubscriptionWarning()}

      {/* ✅ Banner: حالة المستخدم والخطة */}
      {isLoggedIn ? (
        <div
          className={`p-4 rounded-2xl border ${userPlanFeatures.borderColor} ${userPlanFeatures.bgColor}`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div
                className={`p-2 rounded-xl ${userPlanFeatures.bgColor} border ${userPlanFeatures.borderColor}`}
              >
                <PlanIcon className={`h-5 w-5 ${userPlanFeatures.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-white flex items-center gap-2 flex-wrap">
                  {user?.name || "User"} •
                  <span className={userPlanFeatures.color}>
                    {userPlanFeatures.name} Plan
                  </span>
                  {userRole === "admin" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      👑 Admin
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/50 text-slate-400 border border-slate-700">
                    {renderScanLimitInfo()}
                  </span>
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {renderFeatureBadge("aiFixes", "AI Fixes")}
                  {renderFeatureBadge("deepScan", "Deep Scan")}
                  {renderFeatureBadge("exportReports", "Export Reports")}
                  {renderFeatureBadge("prioritySupport", "Priority Support")}
                  {renderFeatureBadge("apiAccess", "API Access")}
                </div>
              </div>
            </div>
            {userPlan !== "extra" && (
              <Link
                href="/subscription"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-xs font-semibold transition shadow-lg shadow-sky-500/20 whitespace-nowrap"
              >
                <Crown className="h-3.5 w-3.5 inline mr-1" />
                Upgrade Plan
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Guest Mode: {MAX_GUEST_SCANS - guestScanCount} of{" "}
                  {MAX_GUEST_SCANS} free scans remaining today
                </p>
                <p className="text-xs text-slate-400">
                  {guestScanCount >= MAX_GUEST_SCANS
                    ? "You've reached today's limit. Please log in for unlimited scans."
                    : `Resets daily at midnight`}
                </p>
              </div>
            </div>
            {guestScanCount >= MAX_GUEST_SCANS && (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition shadow-lg shadow-sky-600/20"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In to Continue</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Search Input Card */}
      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md space-y-4">
        {renderScanLimitWarning()}

        <form
          onSubmit={handleScanSubmit}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Enter domain or URL (e.g., example.com)"
              className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition font-mono disabled:opacity-50"
              disabled={loading || getScanLimitStatus().isLimitReached}
            />
          </div>

          <button
            type="submit"
            disabled={isScanButtonDisabled()}
            className={`inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-white text-sm font-semibold transition shadow-lg whitespace-nowrap ${
              isScanButtonDisabled()
                ? "bg-slate-700 cursor-not-allowed opacity-50 shadow-none"
                : "bg-sky-600 hover:bg-sky-500 shadow-sky-600/20 cursor-pointer"
            }`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : getScanLimitStatus().isLimitReached ? (
              <Clock className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            <span>
              {loading
                ? "Scanning..."
                : getScanLimitStatus().isLimitReached
                  ? "Limit Reached"
                  : "Run Security Audit"}
            </span>
          </button>
        </form>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200 transition">
              <input
                type="checkbox"
                checked={isDeepScan}
                onChange={(e) => setIsDeepScan(e.target.checked)}
                disabled={
                  (!hasFeature("deepScan") && isLoggedIn) ||
                  getScanLimitStatus().isLimitReached
                }
                className="rounded border-slate-800 bg-slate-950 text-sky-500 w-4 h-4 disabled:opacity-50"
              />
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs sm:text-sm">
                Deep Audit (SSL/TLS, CORS, Cookie Configuration)
              </span>
              {isLoggedIn && !hasFeature("deepScan") && (
                <span className="text-[10px] text-slate-500">🔒</span>
              )}
            </label>
            {isLoggedIn && renderUserPlanBadge()}
          </div>

          {targetUrl && (
            <div className="flex items-center gap-2 font-mono text-xs w-full sm:w-auto">
              <span className="text-slate-500">Target:</span>
              <span className="text-slate-200 truncate max-w-[150px] sm:max-w-xs">
                {targetUrl}
              </span>
              <a
                href={targetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-sky-400 flex-shrink-0"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 sm:p-16 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-4">
          <div className="relative inline-block">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-slate-800 border-t-sky-400 rounded-full animate-spin" />
            <ShieldCheck className="absolute inset-0 m-auto h-6 w-6 sm:h-8 sm:w-8 text-sky-400 animate-pulse" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Executing Security Audit...
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Evaluating security headers, SSL certificates, CORS policies, and
            comparing with previous audit history.
          </p>
        </div>
      )}

      {/* ✅ Error State */}
      {error && !loading && renderErrorMessages()}

      {/* Results */}
      {scanResult && !loading && !error && (
        <div className="space-y-6">
          {/* Export Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span className="truncate">
                Audit Completed • ID:{" "}
                <span className="font-mono text-slate-200">
                  {scanResult.id?.slice(0, 8) || "Guest Mode"}
                </span>
              </span>
              {!isLoggedIn && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                  Guest Scan ({MAX_GUEST_SCANS - guestScanCount} remaining)
                </span>
              )}
              {isLoggedIn && (
                <span
                  className={`px-2 py-0.5 rounded-full ${userPlanFeatures.borderColor} ${userPlanFeatures.bgColor} text-[10px]`}
                >
                  {userPlanFeatures.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                onClick={() => downloadReport("csv")}
                disabled={exporting === "csv" || !hasFeature("exportReports")}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  !hasFeature("exportReports")
                    ? "Upgrade to export reports"
                    : ""
                }
              >
                {exporting === "csv" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                )}
                <span className="hidden xs:inline">Export</span> CSV
              </button>

              <button
                onClick={() => downloadReport("pdf")}
                disabled={exporting === "pdf" || !hasFeature("exportReports")}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  !hasFeature("exportReports")
                    ? "Upgrade to export reports"
                    : ""
                }
              >
                {exporting === "pdf" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-sky-400" />
                )}
                <span className="hidden xs:inline">Export</span> PDF
              </button>

              {!isLoggedIn && (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 text-xs font-semibold transition border border-sky-500/20"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline">Sign In</span>
                </Link>
              )}
            </div>
          </div>

          {/* Comparison Delta Banner */}
          {scanResult.comparison && (
            <div
              className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-md space-y-3 ${
                scanResult.comparison.status === "IMPROVED"
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : scanResult.comparison.status === "REGRESSED"
                    ? "bg-rose-500/10 border-rose-500/20"
                    : "bg-slate-900/80 border-slate-800"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`p-2 rounded-xl flex-shrink-0 ${
                      scanResult.comparison.status === "IMPROVED"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : scanResult.comparison.status === "REGRESSED"
                          ? "bg-rose-500/20 text-rose-400"
                          : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {scanResult.comparison.status === "IMPROVED" ? (
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : scanResult.comparison.status === "REGRESSED" ? (
                      <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                      <span>Audit Delta Analysis</span>
                      <span className="text-xs text-slate-400 font-normal font-mono flex items-center gap-1">
                        <History className="h-3.5 w-3.5" />
                        <span className="hidden xs:inline">Previous:</span>
                        {new Date(
                          scanResult.comparison.previousScanDate,
                        ).toLocaleDateString()}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {scanResult.comparison.status === "IMPROVED" ? (
                        <>
                          Security posture{" "}
                          <strong className="text-emerald-400">improved</strong>{" "}
                          by{" "}
                          <span className="font-mono font-bold text-emerald-400">
                            +{scanResult.comparison.scoreDiff} points
                          </span>{" "}
                          (Previous: {scanResult.comparison.previousScore})
                        </>
                      ) : scanResult.comparison.status === "REGRESSED" ? (
                        <>
                          Security posture{" "}
                          <strong className="text-rose-400">regressed</strong>{" "}
                          by{" "}
                          <span className="font-mono font-bold text-rose-400">
                            {scanResult.comparison.scoreDiff} points
                          </span>{" "}
                          (Previous: {scanResult.comparison.previousScore})
                        </>
                      ) : (
                        <>
                          No score variance (Score remains{" "}
                          {scanResult.comparison.previousScore})
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs flex-shrink-0">
                  <span className="text-slate-400">
                    {scanResult.comparison.previousScore}
                  </span>
                  <span className="text-slate-600">→</span>
                  <span className="text-white font-bold text-sm">{score}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === "overview"
                  ? "bg-sky-600/10 text-sky-400 border border-sky-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("ai-remediation")}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === "ai-remediation"
                  ? "bg-sky-600/10 text-sky-400 border border-sky-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
              <span>AI Fix ({filteredVulnerabilities.length || 0})</span>
              {!hasFeature("aiFixes") && isLoggedIn && (
                <span className="text-[10px] text-slate-500 ml-1">🔒</span>
              )}
              {!isLoggedIn && (
                <span className="text-[10px] text-slate-500 ml-1">🔒</span>
              )}
            </button>
          </div>

          {/* Tab Content - Overview */}
          {activeTab === "overview" ? (
            <div className="space-y-6">
              {/* Score & Headers */}
              <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center">
                  <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-sky-400" />
                    Security Score
                  </div>

                  <div className="w-full h-40 sm:h-48 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={gaugeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          startAngle={180}
                          endAngle={0}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill={getScoreColor(score)} />
                          <Cell fill="#1e293b" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-6 sm:pt-8">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                        {score}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase">
                        / 100
                      </span>
                      <span className="text-[10px] sm:text-xs font-medium mt-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {getScoreLabel(score)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 mb-1">
                      HTTP Security Headers Audit
                    </h3>
                    <p className="text-xs text-slate-400">
                      Visual status of configured security response headers.
                    </p>
                  </div>

                  <div className="h-14 sm:h-16 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={headersChartData}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          labelStyle={{ color: "#94a3b8" }}
                        />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          iconType="circle"
                          wrapperStyle={{ fontSize: "10px" }}
                        />
                        <Bar
                          dataKey="Present"
                          fill="#10b981"
                          stackId="a"
                          radius={[4, 0, 0, 4]}
                        />
                        <Bar
                          dataKey="Missing"
                          fill="#f43f5e"
                          stackId="a"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid xs:grid-cols-2 gap-3 sm:gap-4 text-xs pt-3 sm:pt-4 border-t border-slate-800/80">
                    <div>
                      <span className="text-emerald-400 font-bold block mb-1.5 text-[10px] sm:text-xs">
                        ✓ Present (
                        {scanResult?.headers?.presentHeaders?.length || 0}):
                      </span>
                      <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                        {scanResult?.headers?.presentHeaders?.map(
                          (h: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            >
                              {h}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-rose-400 font-bold block mb-1.5 text-[10px] sm:text-xs">
                        ✕ Missing (
                        {scanResult?.headers?.missingHeaders?.length || 0}):
                      </span>
                      <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                        {scanResult?.headers?.missingHeaders?.map(
                          (h: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20"
                            >
                              {h}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deep Audit Details */}
              {isDeepScan ? (
                hasFeature("deepScan") ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Shield className="h-4 w-4 text-sky-400" />
                        Deep Audit Details
                      </h3>
                      <span className="text-xs text-slate-500">
                        {expandedSections.size} sections expanded
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                      {/* SSL/TLS Section */}
                      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                        <button
                          onClick={() => toggleSection("ssl")}
                          className="w-full flex items-center justify-between border-b border-slate-800/80 pb-3"
                        >
                          <div className="flex items-center gap-2">
                            <LockKeyhole className="h-5 w-5 text-sky-400" />
                            <h3 className="text-sm font-bold text-white">
                              SSL/TLS
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            {renderStatusBadge(
                              scanResult?.ssl?.valid,
                              scanResult?.ssl?.valid ? "Valid" : "Invalid",
                            )}
                            {expandedSections.has("ssl") ? (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {expandedSections.has("ssl") && scanResult?.ssl && (
                          <div className="space-y-2 text-xs font-mono">
                            <div className="flex flex-col sm:flex-row justify-between py-1.5 border-b border-slate-800/40">
                              <span className="text-slate-400">Issuer:</span>
                              <span
                                className="text-slate-200 truncate"
                                title={scanResult.ssl.issuer}
                              >
                                {scanResult.ssl.issuer || "Unknown"}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between py-1.5 border-b border-slate-800/40">
                              <span className="text-slate-400">Protocol:</span>
                              <span className="text-sky-400 font-bold">
                                {scanResult.ssl.protocol || "TLS 1.2/1.3"}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between py-1.5 border-b border-slate-800/40">
                              <span className="text-slate-400">
                                Valid From:
                              </span>
                              <span className="text-slate-200">
                                {scanResult.ssl.validFrom
                                  ? new Date(
                                      scanResult.ssl.validFrom,
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between py-1.5">
                              <span className="text-slate-400">
                                Days Remaining:
                              </span>
                              <span
                                className={`font-bold ${
                                  scanResult.ssl.daysRemaining < 30
                                    ? "text-amber-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {scanResult.ssl.daysRemaining ?? "N/A"} Days
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CORS Section */}
                      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                        <button
                          onClick={() => toggleSection("cors")}
                          className="w-full flex items-center justify-between border-b border-slate-800/80 pb-3"
                        >
                          <div className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-indigo-400" />
                            <h3 className="text-sm font-bold text-white">
                              CORS Policy
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                scanResult?.cors?.riskLevel === "HIGH"
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              }`}
                            >
                              {scanResult?.cors?.riskLevel || "SECURE"}
                            </span>
                            {expandedSections.has("cors") ? (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {expandedSections.has("cors") && scanResult?.cors && (
                          <div className="space-y-2 text-xs font-mono">
                            <div className="flex flex-col gap-1 py-1.5 border-b border-slate-800/40">
                              <span className="text-slate-400">
                                Access-Control-Allow-Origin:
                              </span>
                              <span
                                className={`${
                                  scanResult.cors.allowOrigin === "*"
                                    ? "text-rose-400 font-bold"
                                    : "text-slate-200"
                                }`}
                              >
                                {scanResult.cors.allowOrigin ||
                                  "Not Set (Strict)"}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between py-1.5 border-b border-slate-800/40">
                              <span className="text-slate-400">
                                Allow-Credentials:
                              </span>
                              <span className="text-slate-200">
                                {scanResult.cors.allowCredentials
                                  ? "true"
                                  : "false/undefined"}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between py-1.5">
                              <span className="text-slate-400">
                                Allow-Methods:
                              </span>
                              <span className="text-slate-200">
                                {scanResult.cors.allowMethods || "Not Set"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Cookies Section */}
                      <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                        <button
                          onClick={() => toggleSection("cookies")}
                          className="w-full flex items-center justify-between border-b border-slate-800/80 pb-3"
                        >
                          <div className="flex items-center gap-2">
                            <Cookie className="h-5 w-5 text-amber-500" />
                            <h3 className="text-sm font-bold text-white">
                              Cookies
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">
                              {scanResult?.cookies?.length || 0} found
                            </span>
                            {expandedSections.has("cookies") ? (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {expandedSections.has("cookies") && renderCookiesData()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-900/50 border border-amber-500/20">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <Lock className="h-8 w-8 text-amber-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        Deep Audit Locked
                      </h3>
                      <p className="text-sm text-slate-400 max-w-md">
                        Deep audit features (SSL/TLS, CORS, and Cookie analysis)
                        are only available on{" "}
                        <span className="text-sky-400 font-semibold">Pro</span>{" "}
                        and{" "}
                        <span className="text-purple-400 font-semibold">
                          Extra
                        </span>{" "}
                        plans.
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <Link
                          href="/subscription"
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-sm font-semibold transition shadow-lg shadow-sky-500/20 inline-flex items-center gap-2"
                        >
                          <Crown className="h-4 w-4" />
                          <span>Upgrade to Unlock</span>
                        </Link>
                        <button
                          onClick={() => setIsDeepScan(false)}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                        >
                          <X className="h-4 w-4 inline mr-1" />
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 text-center">
                  <p className="text-sm text-slate-400">
                    <Zap className="h-4 w-4 inline mr-1 text-amber-400" />
                    Enable Deep Scan for detailed SSL/TLS, CORS, and Cookie
                    analysis
                    {!hasFeature("deepScan") && isLoggedIn && (
                      <span className="block text-xs text-slate-500 mt-1">
                        Available on <span className="text-sky-400">Pro</span>{" "}
                        and <span className="text-purple-400">Extra</span> plans
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  {
                    label: "Total Checks",
                    value: scanResult?.vulnerabilities?.length + 3 || 0,
                    icon: ShieldCheck,
                    color: "text-sky-400",
                  },
                  {
                    label: "Passed",
                    value: scanResult?.headers?.presentHeaders?.length || 0,
                    icon: Check,
                    color: "text-emerald-400",
                  },
                  {
                    label: "Warnings",
                    value: scanResult?.headers?.missingHeaders?.length || 0,
                    icon: AlertTriangle,
                    color: "text-amber-400",
                  },
                  {
                    label: "Vulnerabilities",
                    value: filteredVulnerabilities.length || 0,
                    icon: AlertCircle,
                    color: "text-rose-400",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="p-3 sm:p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center"
                  >
                    <div
                      className={`flex items-center justify-center ${stat.color} mb-1`}
                    >
                      <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-white font-mono">
                      {stat.value}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* AI Remediation Tab */
            <div className="space-y-6">
              <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-amber-400" />
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    AI Remediation Directives
                  </h3>
                  <span className="text-xs text-slate-500 ml-auto">
                    {filteredVulnerabilities.length || 0} issues
                  </span>
                  {!hasFeature("aiFixes") && isLoggedIn && (
                    <span className="text-[10px] text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
                      🔒 Upgrade to Unlock
                    </span>
                  )}
                  {!isLoggedIn && (
                    <span className="text-[10px] text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
                      🔒 Login Required
                    </span>
                  )}
                </div>

                {/* Filters for vulnerabilities */}
                {filteredVulnerabilities.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <select
                      value={scanFilters.severity}
                      onChange={(e) =>
                        setScanFilters({
                          ...scanFilters,
                          severity: e.target.value,
                        })
                      }
                      className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-500 transition"
                    >
                      <option value="all">All Severity</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                      <option value="INFO">Info</option>
                    </select>
                    <select
                      value={scanFilters.category}
                      onChange={(e) =>
                        setScanFilters({
                          ...scanFilters,
                          category: e.target.value,
                        })
                      }
                      className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-sky-500 transition"
                    >
                      <option value="all">All Categories</option>
                      <option value="headers">Security Headers</option>
                      <option value="ssl">SSL/TLS</option>
                      <option value="cors">CORS</option>
                      <option value="cookies">Cookies</option>
                    </select>
                    <div className="relative flex-1 min-w-[120px]">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search vulnerabilities..."
                        value={scanFilters.searchQuery}
                        onChange={(e) =>
                          setScanFilters({
                            ...scanFilters,
                            searchQuery: e.target.value,
                          })
                        }
                        className="w-full pl-7 pr-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                      />
                    </div>
                    {(scanFilters.severity !== "all" ||
                      scanFilters.category !== "all" ||
                      scanFilters.searchQuery) && (
                      <button
                        onClick={() =>
                          setScanFilters({
                            severity: "all",
                            category: "all",
                            searchQuery: "",
                          })
                        }
                        className="text-[10px] text-slate-400 hover:text-white transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {!hasFeature("aiFixes") &&
                  isLoggedIn &&
                  filteredVulnerabilities.length > 0 && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Crown className="h-8 w-8 text-amber-400" />
                        <p className="text-sm font-medium text-white">
                          AI Fixes Available in Pro & Extra Plans
                        </p>
                        <p className="text-xs text-slate-400">
                          Upgrade to unlock AI-powered remediation suggestions
                          and fix vulnerabilities instantly.
                        </p>
                        <Link
                          href="/subscription"
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-xs font-semibold transition shadow-lg shadow-sky-600/20"
                        >
                          <Crown className="h-3.5 w-3.5 inline mr-1" />
                          Upgrade Now
                        </Link>
                      </div>
                    </div>
                  )}

                {!isLoggedIn && filteredVulnerabilities.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Lock className="h-6 w-6 text-amber-400" />
                      <p className="text-xs text-slate-300">
                        Sign in to unlock AI-powered remediation suggestions
                      </p>
                      <Link
                        href="/login"
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition shadow-lg shadow-sky-600/20"
                      >
                        <span>Sign In Now</span>
                      </Link>
                    </div>
                  </div>
                )}

                {hasFeature("aiFixes") && filteredVulnerabilities.length > 0 ? (
                  <div className="space-y-4 sm:space-y-6">
                    {filteredVulnerabilities.map((vuln: any, index: number) => {
                      const originalIndex =
                        scanResult.vulnerabilities.indexOf(vuln);
                      const currentFix =
                        aiFixes[originalIndex] || vuln.remediation;

                      return (
                        <div
                          key={index}
                          className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                            <h4 className="text-sm font-bold text-slate-200">
                              {vuln.title}
                            </h4>
                            <span
                              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                vuln.severity === "CRITICAL" ||
                                vuln.severity === "HIGH"
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : vuln.severity === "MEDIUM"
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                              }`}
                            >
                              {vuln.severity}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400">
                            {vuln.description}
                          </p>

                          {currentFix ? (
                            <div className="p-3 sm:p-4 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-emerald-400 space-y-2">
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-sans">
                                AI Fix Directives:
                              </span>
                              <pre className="whitespace-pre-wrap leading-relaxed text-xs">
                                {currentFix}
                              </pre>
                            </div>
                          ) : (
                            <div className="pt-2">
                              <button
                                onClick={() =>
                                  handleRequestAiFix(
                                    vuln.title,
                                    vuln.description,
                                    originalIndex,
                                  )
                                }
                                disabled={loadingFixIndex === originalIndex}
                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold transition disabled:opacity-50 w-full sm:w-auto"
                              >
                                {loadingFixIndex === originalIndex ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Sparkles className="h-4 w-4" />
                                )}
                                <span>
                                  {loadingFixIndex === originalIndex
                                    ? "Generating..."
                                    : "Generate AI Fix"}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : hasFeature("aiFixes") ? (
                  <div className="p-6 sm:p-8 text-center text-emerald-400 text-sm">
                    <Check className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-emerald-400" />
                    ✓ No vulnerabilities detected! AI remediation not needed.
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={userPlan}
        userEmail={user?.email}
        onUpgradeSuccess={(plan: PlanType) => {
          setUserPlan(plan);
          setUser({ ...user, plan });
          setSubscription(null);
          setTimeLeft(null);
        }}
      />
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-sky-400 animate-spin" />
            <p className="text-xs sm:text-sm text-slate-400">Loading...</p>
          </div>
        </div>
      }
    >
      <ScanPageContent />
    </Suspense>
  );
}
