// client/app/history/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  History,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Trash2,
  Search,
  Eye,
  Download,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Calendar,
  Crown,
  Gem,
  Shield,
  Lock,
  Timer,
  AlertCircle,
  HardDrive,
  CheckCircle2,
  Database,
} from "lucide-react";
import { api } from "@/lib/api";
import ScanDetailModal from "./ScanDetailModal";

// ✅ استيراد من الملف المركزي للخطط
import {
  PlanType,
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
} from "@/lib/plans.config";

// ✅ استيراد UpgradeModal
import UpgradeModal from "@/components/layout/UpgradeModal";

interface ScanRecord {
  id: string;
  score: number;
  status: string;
  createdAt: string;
  website: {
    url: string;
    domain: string;
  };
}

// ============================================================
// 🧩 COMPONENT: Mobile Filter Drawer
// ============================================================
function MobileFilterDrawer({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder,
  statusFilter,
  setStatusFilter,
  scoreRange,
  setScoreRange,
}: {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  sortOrder: "newest" | "oldest" | "highest" | "lowest";
  setSortOrder: (v: "newest" | "oldest" | "highest" | "lowest") => void;
  statusFilter: "all" | "passed" | "failed" | "warning";
  setStatusFilter: (v: "all" | "passed" | "failed" | "warning") => void;
  scoreRange: [number, number];
  setScoreRange: (v: [number, number]) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-sky-400" />
            Filters
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">
              Search Domain
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Filter by domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">
              Sort By
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "newest", label: "Newest" },
                { value: "oldest", label: "Oldest" },
                { value: "highest", label: "Highest Score" },
                { value: "lowest", label: "Lowest Score" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setSortOrder(
                      option.value as
                        | "newest"
                        | "oldest"
                        | "highest"
                        | "lowest",
                    )
                  }
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
                    sortOrder === option.value
                      ? "bg-sky-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "all", label: "All", icon: null },
                { value: "passed", label: "Passed", icon: CheckCircle },
                { value: "warning", label: "Warning", icon: AlertTriangle },
                { value: "failed", label: "Failed", icon: XCircle },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setStatusFilter(
                      option.value as "all" | "passed" | "failed" | "warning",
                    )
                  }
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                    statusFilter === option.value
                      ? "bg-sky-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {option.icon && <option.icon className="h-3 w-3" />}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">
              Score Range: {scoreRange[0]} - {scoreRange[1]}
            </label>
            <div className="flex gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={scoreRange[0]}
                onChange={(e) =>
                  setScoreRange([parseInt(e.target.value), scoreRange[1]])
                }
                className="flex-1 accent-sky-500"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={scoreRange[1]}
                onChange={(e) =>
                  setScoreRange([scoreRange[0], parseInt(e.target.value)])
                }
                className="flex-1 accent-sky-500"
              />
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 🧩 COMPONENT: Empty State
// ============================================================
function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="p-12 sm:p-16 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-4">
      <ShieldAlert className="h-12 w-12 sm:h-16 sm:w-16 text-slate-600 mx-auto" />
      <h3 className="text-base sm:text-lg font-semibold text-slate-300">
        {searchQuery
          ? "No matching audit logs found"
          : "No scan history recorded"}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
        {searchQuery
          ? "Try adjusting your search domain filter."
          : "Perform your first domain audit to start tracking security metrics over time."}
      </p>
      {!searchQuery && (
        <Link
          href="/scan"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition"
        >
          <span>Launch Security Audit</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

// ============================================================
// 🧩 COMPONENT: Loading State
// ============================================================
function LoadingState() {
  return (
    <div className="p-12 sm:p-16 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
      <Loader2 className="h-8 w-8 text-sky-400 animate-spin mx-auto" />
      <p className="text-sm text-slate-400">
        Fetching security audit history...
      </p>
    </div>
  );
}

// ============================================================
// 🧩 COMPONENT: Error State
// ============================================================
function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="p-8 sm:p-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-4">
      <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-rose-400 mx-auto" />
      <p className="text-sm text-rose-300">{error}</p>
      <button
        onClick={onRetry}
        className="px-5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-sm font-semibold transition"
      >
        Try Again
      </button>
    </div>
  );
}

// ============================================================
// 🧩 COMPONENT: Score Badge
// ============================================================
function ScoreBadge({ score }: { score: number }) {
  const getConfig = () => {
    if (score >= 80) {
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/20",
        icon: <CheckCircle className="h-3 w-3" />,
      };
    }
    if (score >= 50) {
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/20",
        icon: <AlertTriangle className="h-3 w-3" />,
      };
    }
    return {
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      border: "border-rose-500/20",
      icon: <XCircle className="h-3 w-3" />,
    };
  };

  const config = getConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border} font-mono`}
    >
      {config.icon}
      {score} / 100
    </span>
  );
}

// ============================================================
// 🧩 COMPONENT: Plan Badge
// ============================================================
function PlanBadge({ plan }: { plan: PlanType }) {
  const features = getPlanFeatures(plan);
  if (!features) return null;
  const Icon = features.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${features.color} border ${features.borderColor} bg-slate-900/50`}
    >
      <Icon className="h-3 w-3" />
      {features.name}
    </span>
  );
}

// ============================================================
// 🧩 COMPONENT: Scan Row (Desktop)
// ============================================================
function ScanRowDesktop({
  scan,
  onSelect,
  onExportPdf,
  onDelete,
  exportingPdfId,
  deletingId,
  index,
  canDelete,
  canExport,
  retentionDays,
}: {
  scan: ScanRecord;
  onSelect: (scan: ScanRecord) => void;
  onExportPdf: (id: string, domain: string) => void;
  onDelete: (scan: ScanRecord) => void;
  exportingPdfId: string | null;
  deletingId: string | null;
  index: number;
  canDelete: boolean;
  canExport: boolean;
  retentionDays: number;
}) {
  const domainName = scan.website?.domain || scan.website?.url || "domain";
  const scanAge = Math.floor(
    (Date.now() - new Date(scan.createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  const isExpired = scanAge > retentionDays;

  return (
    <tr
      key={scan.id}
      className={`hover:bg-slate-800/40 transition cursor-pointer group ${
        index % 2 === 0 ? "bg-transparent" : "bg-slate-900/30"
      } ${isExpired ? "opacity-50" : ""}`}
      onClick={() => onSelect(scan)}
    >
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-white font-medium group-hover:text-sky-400 transition text-sm truncate max-w-[120px] sm:max-w-[200px]">
            {domainName}
          </span>
          <a
            href={scan.website?.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-slate-500 hover:text-sky-400 transition flex-shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {isExpired && (
            <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Expired
            </span>
          )}
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <ScoreBadge score={scan.score} />
      </td>
      <td className="px-4 sm:px-6 py-4 text-xs text-slate-400 font-mono whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          {new Date(scan.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          {new Date(scan.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </td>
      <td
        className="px-4 sm:px-6 py-4 text-right space-x-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onExportPdf(scan.id, domainName)}
          disabled={!canExport || exportingPdfId === scan.id || isExpired}
          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed inline-block cursor-pointer"
          title={isExpired ? "Scan expired" : "Export PDF Report"}
        >
          <FileText
            className={`h-4 w-4 ${
              exportingPdfId === scan.id ? "animate-bounce text-sky-400" : ""
            }`}
          />
        </button>

        <button
          onClick={() => onSelect(scan)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition inline-block cursor-pointer"
          title="View Full Report"
        >
          <Eye className="h-4 w-4" />
        </button>

        <Link
          href={`/scan?url=${encodeURIComponent(scan.website?.url)}`}
          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition inline-block cursor-pointer"
          title="Re-run Scan"
        >
          <RefreshCw className="h-4 w-4" />
        </Link>

        {canDelete && !isExpired && (
          <button
            onClick={() => onDelete(scan)}
            disabled={deletingId === scan.id}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition disabled:opacity-50 inline-block cursor-pointer"
            title="Delete Record"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </td>
    </tr>
  );
}

// ============================================================
// 🧩 COMPONENT: Scan Card (Mobile)
// ============================================================
function ScanCardMobile({
  scan,
  onSelect,
  onExportPdf,
  onDelete,
  exportingPdfId,
  deletingId,
  canDelete,
  canExport,
  retentionDays,
}: {
  scan: ScanRecord;
  onSelect: (scan: ScanRecord) => void;
  onExportPdf: (id: string, domain: string) => void;
  onDelete: (scan: ScanRecord) => void;
  exportingPdfId: string | null;
  deletingId: string | null;
  canDelete: boolean;
  canExport: boolean;
  retentionDays: number;
}) {
  const domainName = scan.website?.domain || scan.website?.url || "domain";
  const scanAge = Math.floor(
    (Date.now() - new Date(scan.createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  const isExpired = scanAge > retentionDays;

  return (
    <div
      className={`bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition cursor-pointer ${
        isExpired ? "opacity-50" : ""
      }`}
      onClick={() => onSelect(scan)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-white font-medium text-sm truncate">
              {domainName}
            </span>
            <a
              href={scan.website?.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-500 hover:text-sky-400 transition flex-shrink-0"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            {isExpired && (
              <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Expired
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <ScoreBadge score={scan.score} />
            <span className="text-[10px] text-slate-500 font-mono">
              {new Date(scan.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 justify-end border-t border-slate-800/50 pt-3">
        <button
          onClick={() => onExportPdf(scan.id, domainName)}
          disabled={!canExport || exportingPdfId === scan.id || isExpired}
          className="p-2 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex-1 flex items-center justify-center gap-1.5 text-xs"
        >
          <FileText className="h-4 w-4" />
          <span>PDF</span>
        </button>

        <button
          onClick={() => onSelect(scan)}
          className="p-2 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition flex-1 flex items-center justify-center gap-1.5 text-xs"
        >
          <Eye className="h-4 w-4" />
          <span>View</span>
        </button>

        <Link
          href={`/scan?url=${encodeURIComponent(scan.website?.url)}`}
          className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition flex-1 flex items-center justify-center gap-1.5 text-xs"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Re-run</span>
        </Link>

        {canDelete && !isExpired && (
          <button
            onClick={() => onDelete(scan)}
            disabled={deletingId === scan.id}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition flex-1 flex items-center justify-center gap-1.5 text-xs"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 📄 MAIN COMPONENT: HistoryPage
// ============================================================
export default function HistoryPage() {
  // State
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdfId, setExportingPdfId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // User & Plan State
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userPlan, setUserPlan] = useState<PlanType>("free");
  const [userRole, setUserRole] = useState<string>("user");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // ✅ retentionDays كـ State منفصل
  const [retentionDays, setRetentionDays] = useState<number>(7);

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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<
    "newest" | "oldest" | "highest" | "lowest"
  >("newest");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "passed" | "failed" | "warning"
  >("all");
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);

  // UI State
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [confirmDeleteScan, setConfirmDeleteScan] = useState<ScanRecord | null>(
    null,
  );
  const [actionErrorModal, setActionErrorModal] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Storage Stats State
  const [storageStats, setStorageStats] = useState<{
    totalScans: number;
    expiredScans: number;
    retentionDays: number | typeof Infinity;
    isPermanent: boolean;
  } | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [showStorageInfo, setShowStorageInfo] = useState(true);

  // ✅ جلب بيانات المستخدم والخطة
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/me", { withCredentials: true });
        if (res.data?.user) {
          const userData = res.data.user;
          setUser(userData);
          setIsLoggedIn(true);
          setUserPlan(userData.plan || "free");
          setUserRole(userData.role || "user");

          // ✅ تعيين retentionDays باستخدام الدالة من الملف المركزي
          if (userData.role === "admin") {
            setRetentionDays(Infinity);
          } else {
            const retention = getHistoryRetention(userData.plan as PlanType);
            setRetentionDays(retention);
          }

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
          setIsLoggedIn(false);
          setUserPlan("free");
          setUserRole("user");
          setRetentionDays(7);
        }
      } catch {
        setIsLoggedIn(false);
        setUserPlan("free");
        setUserRole("user");
        setRetentionDays(7);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
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

  // ✅ الحصول على ميزات الخطة من الملف المركزي
  const planFeatures = useMemo(() => {
    if (userRole === "admin") {
      return {
        name: "Admin",
        icon: Crown,
        color: "text-amber-400",
        borderColor: "border-amber-500/30",
        maxScans: Infinity,
        exportReports: true,
        aiFixes: true,
        deepScan: true,
        prioritySupport: true,
        canDelete: true,
      };
    }

    const features = getPlanFeatures(userPlan);
    return {
      name: features.name,
      icon: features.icon,
      color: features.color,
      borderColor: features.borderColor,
      maxScans: features.maxScans,
      exportReports: features.exportReports,
      aiFixes: features.aiFixes,
      deepScan: features.deepScan,
      prioritySupport: features.prioritySupport,
      canDelete: userPlan !== "free",
    };
  }, [userPlan, userRole]);

  // ✅ استخراج القيم
  const canExport = planFeatures.exportReports;
  const canDelete = planFeatures.canDelete;

  // ✅ التحقق من صلاحية التصدير
  const checkExportPermission = useCallback(() => {
    if (!canExport) {
      setActionErrorModal(
        "Export reports are not available on your current plan. Please upgrade to Pro or Extra.",
      );
      return false;
    }
    return true;
  }, [canExport]);

  // ✅ التحقق من صلاحية الحذف
  const checkDeletePermission = useCallback(() => {
    if (!canDelete) {
      setActionErrorModal(
        "Delete is only available for Pro, Extra, or Admin users.",
      );
      return false;
    }
    return true;
  }, [canDelete]);

  // ✅ جلب الفحوصات
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/scans/history");
      setScans(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch scan history");
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ جلب إحصائيات التخزين
  const fetchStorageStats = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await api.get("/scans/storage-stats", {
        withCredentials: true,
      });
      setStorageStats(res.data);
    } catch (err) {
      console.error("Failed to fetch storage stats:", err);
    }
  }, [isLoggedIn]);

  // ✅ تنظيف الفحوصات المنتهية يدوياً
  const handleManualCleanup = useCallback(async () => {
    if (!isLoggedIn) return;

    try {
      setCleaning(true);
      const res = await api.delete("/scans/user/clean-expired", {
        withCredentials: true,
      });

      // ✅ تحديث البيانات
      await fetchHistory();
      await fetchStorageStats();

      // ✅ عرض رسالة نجاح
      const deletedCount = res.data?.deleted || 0;
      if (deletedCount > 0) {
        setActionErrorModal(
          `✅ Successfully deleted ${deletedCount} expired scan${
            deletedCount > 1 ? "s" : ""
          }`,
        );
      } else {
        setActionErrorModal("✅ No expired scans to delete");
      }
    } catch (err: any) {
      setActionErrorModal(
        err.response?.data?.message || "Failed to clean expired scans",
      );
    } finally {
      setCleaning(false);
    }
  }, [isLoggedIn, fetchHistory, fetchStorageStats]);

  // ✅ تنظيف شامل (للمدير فقط)
  const handleAdminCleanup = useCallback(async () => {
    if (userRole !== "admin") return;

    if (
      !confirm(
        "⚠️ This will delete ALL expired scans for ALL users. Are you sure?",
      )
    )
      return;

    try {
      setCleaning(true);
      const res = await api.delete("/scans/clean-expired", {
        withCredentials: true,
      });
      await fetchHistory();
      await fetchStorageStats();
      setActionErrorModal(
        `✅ Cleanup complete: ${res.data.totalDeleted} scans deleted`,
      );
    } catch (err: any) {
      setActionErrorModal(
        err.response?.data?.message || "Failed to clean expired scans",
      );
    } finally {
      setCleaning(false);
    }
  }, [userRole, fetchHistory, fetchStorageStats]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchStorageStats();
    }
  }, [isLoggedIn, fetchStorageStats]);

  // ✅ تصفية الفحوصات
  const filteredScans = useMemo(() => {
    let result = [...scans];

    // ✅ فلترة حسب صلاحية التخزين - باستخدام retentionDays
    if (retentionDays !== Infinity) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      result = result.filter((scan) => new Date(scan.createdAt) >= cutoffDate);
    }

    // Search
    if (searchQuery) {
      result = result.filter((scan) => {
        const domain = scan.website?.domain || scan.website?.url || "";
        return domain.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Status Filter
    if (statusFilter !== "all") {
      result = result.filter((scan) => {
        if (statusFilter === "passed") return scan.score >= 80;
        if (statusFilter === "warning")
          return scan.score >= 50 && scan.score < 80;
        if (statusFilter === "failed") return scan.score < 50;
        return true;
      });
    }

    // Score Range
    result = result.filter(
      (scan) => scan.score >= scoreRange[0] && scan.score <= scoreRange[1],
    );

    // Sort
    result.sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "highest":
          return b.score - a.score;
        case "lowest":
          return a.score - b.score;
        default:
          return 0;
      }
    });

    return result;
  }, [scans, searchQuery, statusFilter, scoreRange, sortOrder, retentionDays]);

  // Pagination
  const totalPages = Math.ceil(filteredScans.length / itemsPerPage);
  const paginatedScans = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredScans.slice(start, start + itemsPerPage);
  }, [filteredScans, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, scoreRange, sortOrder]);

  // Handlers
  const handleExportPdf = async (scanId: string, targetDomain: string) => {
    if (!checkExportPermission()) return;

    setExportingPdfId(scanId);
    try {
      const response = await api.get(`/scans/${scanId}/export/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      const safeDomain = targetDomain.replace(/[^a-zA-Z0-9.-]/g, "_");
      link.setAttribute(
        "download",
        `ScanLens_Report_${safeDomain}_${Date.now()}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setActionErrorModal(
        err.response?.data?.message ||
          "Failed to export PDF report. Please verify your permissions or re-run the scan.",
      );
    } finally {
      setExportingPdfId(null);
    }
  };

  const handleExportCsv = async () => {
    if (!checkExportPermission()) return;

    setExportingCsv(true);
    try {
      const response = await api.get("/scans/export/csv", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "text/csv" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ScanLens_History_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setActionErrorModal(
        err.response?.data?.message || "Failed to export CSV history report.",
      );
    } finally {
      setExportingCsv(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDeleteScan) return;
    if (!checkDeletePermission()) {
      setConfirmDeleteScan(null);
      return;
    }

    const scanId = confirmDeleteScan.id;
    setDeletingId(scanId);
    try {
      await api.delete(`/scans/${scanId}`);
      setScans((prev) => prev.filter((scan) => scan.id !== scanId));
      setConfirmDeleteScan(null);
    } catch (err: any) {
      setActionErrorModal(
        err.response?.data?.message || "Failed to delete scan record.",
      );
    } finally {
      setDeletingId(null);
    }
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
                  Your plan has expired. Renew now to continue accessing your
                  scan history and premium features.
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
                Your plan will expire in{" "}
                <span className="text-amber-400 font-semibold">
                  {subscription.daysRemaining} days
                </span>
                . Renew now to avoid losing access to your scan history.
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

  // ✅ عرض معلومات الخطة
  const renderPlanBanner = () => {
    if (!isLoggedIn) {
      return (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-white">Guest Mode</p>
              <p className="text-xs text-slate-400">
                Sign in to save your scan history permanently
              </p>
            </div>
            <Link
              href="/login"
              className="ml-auto px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      );
    }

    const PlanIcon = planFeatures.icon;
    const retentionText =
      retentionDays === Infinity ? "Permanent" : `${retentionDays} days`;

    return (
      <div
        className={`p-4 rounded-2xl border ${planFeatures.borderColor} bg-slate-900/50`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PlanIcon className={`h-5 w-5 ${planFeatures.color}`} />
            <div>
              <p className="text-sm font-medium text-white flex items-center gap-2">
                {userRole === "admin" ? "👑 Admin" : planFeatures.name} Plan
                {userRole === "admin" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Full Access
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                <span>History Retention: {retentionText}</span>
                <span className="text-slate-600">•</span>
                <span>
                  {planFeatures.maxScans === Infinity
                    ? "∞"
                    : planFeatures.maxScans}{" "}
                  scans/day
                </span>
                {canExport && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400">✓ Export</span>
                  </>
                )}
                {canDelete && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-rose-400">✓ Delete</span>
                  </>
                )}
              </p>
            </div>
          </div>
          {userRole !== "admin" && userPlan !== "extra" && (
            <Link
              href="/subscription"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-xs font-semibold transition shadow-lg shadow-sky-500/20 whitespace-nowrap"
            >
              <Crown className="h-3.5 w-3.5 inline mr-1" />
              Upgrade
            </Link>
          )}
        </div>
      </div>
    );
  };

  // ✅ عرض معلومات التخزين
  const renderStorageInfo = () => {
    if (!isLoggedIn || !storageStats) return null;
    if (!showStorageInfo) return null;

    const { totalScans, expiredScans, retentionDays, isPermanent } =
      storageStats;

    if (totalScans === 0) return null;

    const retentionText = isPermanent ? "Permanent" : `${retentionDays} days`;

    return (
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-slate-800 flex-shrink-0">
              <HardDrive className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white flex items-center gap-2">
                Storage Information
                {isPermanent ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    💾 Permanent
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    ⏳ {retentionText}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                <span>
                  Total Scans:{" "}
                  <strong className="text-white">{totalScans}</strong>
                </span>
                <span className="text-slate-600">•</span>
                <span>
                  Retention:{" "}
                  <strong className="text-sky-400">{retentionText}</strong>
                </span>
                {!isPermanent && expiredScans > 0 && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {expiredScans} scan{expiredScans > 1 ? "s" : ""} will be
                      deleted
                    </span>
                  </>
                )}
                {!isPermanent && expiredScans === 0 && totalScans > 0 && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      All scans are valid
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isPermanent && expiredScans > 0 && (
              <button
                onClick={handleManualCleanup}
                disabled={cleaning}
                className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                {cleaning ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Clean Expired ({expiredScans})</span>
              </button>
            )}

            {userRole === "admin" && (
              <button
                onClick={handleAdminCleanup}
                disabled={cleaning}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                {cleaning ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Database className="h-3.5 w-3.5" />
                )}
                <span>Admin: Clean All</span>
              </button>
            )}

            <button
              onClick={() => setShowStorageInfo(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ✅ عداد تنازلي لوقت الحذف التلقائي */}
        {!isPermanent && expiredScans > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800/50">
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <Timer className="h-3 w-3" />
              <span>
                Scans older than{" "}
                <strong className="text-slate-400">{retentionDays} days</strong>{" "}
                are automatically deleted at midnight
              </span>
              <span className="text-emerald-400 ml-auto flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Auto-cleanup enabled
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // 🖥️ RENDER
  // ============================================================
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

  return (
    <div
      className="container mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl space-y-6 sm:space-y-8"
      dir="ltr"
    >
      {/* ✅ عرض معلومات التخزين */}
      {renderStorageInfo()}

      {/* ✅ تحذير انتهاء الاشتراك */}
      {renderSubscriptionWarning()}

      {/* ✅ Plan Banner */}
      {renderPlanBanner()}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
            <History className="h-5 w-5 sm:h-6 sm:w-6 text-sky-400 flex-shrink-0" />
            <span>Audit History</span>
            {isLoggedIn && <PlanBadge plan={userPlan} />}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1">
            {isLoggedIn
              ? `Review and manage your security scans (${
                  retentionDays === Infinity
                    ? "Permanent"
                    : `${retentionDays} days`
                } retention)`
              : "Review and manage all your security scan reports"}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          <div className="hidden lg:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition w-48 xl:w-64"
            />
          </div>

          <button
            onClick={handleExportCsv}
            disabled={exportingCsv || scans.length === 0 || !canExport}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium transition disabled:opacity-50 cursor-pointer whitespace-nowrap ${
              !canExport ? "cursor-not-allowed opacity-50" : ""
            }`}
            title={!canExport ? "Export not available on your plan" : ""}
          >
            <Download
              className={`h-4 w-4 ${exportingCsv ? "animate-bounce" : ""}`}
            />
            <span className="hidden sm:inline">
              {exportingCsv ? "Exporting..." : "Export CSV"}
            </span>
            <span className="sm:hidden">CSV</span>
          </button>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition disabled:opacity-50 cursor-pointer flex-shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden lg:flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-900/50 rounded-xl p-1 border border-slate-800">
          {[
            { value: "newest", label: "Newest" },
            { value: "oldest", label: "Oldest" },
            { value: "highest", label: "Highest" },
            { value: "lowest", label: "Lowest" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() =>
                setSortOrder(
                  option.value as "newest" | "oldest" | "highest" | "lowest",
                )
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                sortOrder === option.value
                  ? "bg-sky-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/50 rounded-xl p-1 border border-slate-800">
          {[
            { value: "all", label: "All" },
            { value: "passed", label: "✅ Passed" },
            { value: "warning", label: "⚠️ Warning" },
            { value: "failed", label: "❌ Failed" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() =>
                setStatusFilter(
                  option.value as "all" | "passed" | "failed" | "warning",
                )
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === option.value
                  ? "bg-sky-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono">
            {scoreRange[0]}–{scoreRange[1]}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={scoreRange[0]}
            onChange={(e) =>
              setScoreRange([parseInt(e.target.value), scoreRange[1]])
            }
            className="w-20 accent-sky-500"
          />
          <input
            type="range"
            min="0"
            max="100"
            value={scoreRange[1]}
            onChange={(e) =>
              setScoreRange([scoreRange[0], parseInt(e.target.value)])
            }
            className="w-20 accent-sky-500"
          />
        </div>

        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={fetchHistory} />
      ) : paginatedScans.length === 0 ? (
        <EmptyState searchQuery={searchQuery} />
      ) : (
        <>
          <div className="hidden lg:block rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 sm:px-6 py-4 font-medium">
                      Target Domain
                    </th>
                    <th className="px-4 sm:px-6 py-4 font-medium">Score</th>
                    <th className="px-4 sm:px-6 py-4 font-medium">Date</th>
                    <th className="px-4 sm:px-6 py-4 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedScans.map((scan, index) => (
                    <ScanRowDesktop
                      key={scan.id}
                      scan={scan}
                      onSelect={setSelectedScan}
                      onExportPdf={handleExportPdf}
                      onDelete={setConfirmDeleteScan}
                      exportingPdfId={exportingPdfId}
                      deletingId={deletingId}
                      index={index}
                      canDelete={canDelete}
                      canExport={canExport}
                      retentionDays={retentionDays}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:hidden space-y-3">
            {paginatedScans.map((scan) => (
              <ScanCardMobile
                key={scan.id}
                scan={scan}
                onSelect={setSelectedScan}
                onExportPdf={handleExportPdf}
                onDelete={setConfirmDeleteScan}
                exportingPdfId={exportingPdfId}
                deletingId={deletingId}
                canDelete={canDelete}
                canExport={canExport}
                retentionDays={retentionDays}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 disabled:opacity-50 disabled:hover:bg-slate-900 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-slate-400 font-mono px-3">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 disabled:opacity-50 disabled:hover:bg-slate-900 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="text-center text-[10px] text-slate-500 font-mono">
            Showing {paginatedScans.length} of {filteredScans.length} records
            {retentionDays !== Infinity && (
              <span className="block text-[9px] text-slate-600 mt-1">
                * Only showing scans from the last {retentionDays} days
              </span>
            )}
          </div>
        </>
      )}

      {/* ===== MODALS ===== */}
      <ScanDetailModal
        scan={selectedScan}
        onClose={() => setSelectedScan(null)}
      />

      {confirmDeleteScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 flex-shrink-0">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Delete Audit Log?
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Are you sure you want to delete the scan log for{" "}
              <strong className="text-slate-200 font-mono">
                {confirmDeleteScan.website?.domain ||
                  confirmDeleteScan.website?.url}
              </strong>
              ? This action cannot be undone.
            </p>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteScan(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={deletingId === confirmDeleteScan.id}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition disabled:opacity-50 shadow-lg shadow-rose-600/20"
              >
                {deletingId === confirmDeleteScan.id
                  ? "Deleting..."
                  : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {actionErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 flex-shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Action Failed
                </h3>
              </div>
              <button
                onClick={() => setActionErrorModal(null)}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono break-words">
              {actionErrorModal}
            </p>

            <div className="flex justify-end">
              <button
                onClick={() => setActionErrorModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition w-full sm:w-auto"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileFilterDrawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        scoreRange={scoreRange}
        setScoreRange={setScoreRange}
      />

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
          // ✅ تحديث retentionDays للخطة الجديدة
          if (userRole !== "admin") {
            const retention = getHistoryRetention(plan);
            setRetentionDays(retention);
          }
        }}
      />
    </div>
  );
}
