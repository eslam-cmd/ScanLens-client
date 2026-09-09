// client/app/history/ScanDetailModal.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  Printer,
  Lock,
  Globe,
  ShieldCheck,
  ExternalLink,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  Server,
  Shield,
  Zap,
  Eye,
  EyeOff,
  Copy,
  Check,
  Clock,
  Calendar,
  Award,
  BarChart3,
  FileText,
  Share2,
  Crown,
  Gem,
} from "lucide-react";
import { api } from "@/lib/api";

// ✅ استيراد من الملف المركزي للخطط
import {
  PlanType,
  getPlanFeatures,
  getPlan,
  hasMinPlan,
  hasFeature,
  checkUserCapability,
  getPlanDisplayName,
  getPlanIcon,
  isPaidPlan,
} from "@/lib/plans.config";
import Link from "next/link";

interface ScanDetailModalProps {
  scan: any | null;
  onClose: () => void;
}

interface MetricDetail {
  name: string;
  value: string | number;
  status: "pass" | "fail" | "warning" | "info";
  description: string;
  icon: any;
  suggestion?: string;
}

export default function ScanDetailModal({
  scan,
  onClose,
}: ScanDetailModalProps) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "metrics" | "details"
  >("overview");

  // ✅ User & Plan State
  const [userPlan, setUserPlan] = useState<PlanType>("free");
  const [userRole, setUserRole] = useState<string>("user");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  const modalRef = useRef<HTMLDivElement>(null);

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
        } else {
          setIsLoggedIn(false);
          setUserPlan("free");
          setUserRole("user");
        }
      } catch {
        setIsLoggedIn(false);
        setUserPlan("free");
        setUserRole("user");
      }
    };
    checkAuth();
  }, []);

  // ✅ الحصول على ميزات الخطة
  const planFeatures = useMemo(() => {
    if (userRole === "admin") {
      return {
        name: "Admin",
        icon: Crown,
        color: "text-amber-400",
        borderColor: "border-amber-500/30",
        exportReports: true,
        aiFixes: true,
        deepScan: true,
        prioritySupport: true,
      };
    }
    return getPlanFeatures(userPlan);
  }, [userPlan, userRole]);

  // ✅ التحقق من صلاحية التصدير
  const canExport = useMemo(() => {
    if (userRole === "admin") return true;
    return planFeatures.exportReports;
  }, [userRole, planFeatures]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!scan) return null;

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const score = scan.score ?? 0;
  const getScoreColor = (s: number) => {
    if (s >= 80)
      return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
    if (s >= 50) return "text-amber-400 border-amber-500/20 bg-amber-500/10";
    return "text-rose-400 border-rose-500/20 bg-rose-500/10";
  };

  const getScoreIcon = (s: number) => {
    if (s >= 80) return <CheckCircle className="h-5 w-5 text-emerald-400" />;
    if (s >= 50) return <AlertTriangle className="h-5 w-5 text-amber-400" />;
    return <X className="h-5 w-5 text-rose-400" />;
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 70) return "Good";
    if (s >= 50) return "Fair";
    return "Needs Improvement";
  };

  const handleDownloadPdf = async () => {
    // ✅ التحقق من صلاحية التصدير
    if (!canExport) {
      alert(
        "Export reports are not available on your current plan. Please upgrade to Pro or Extra.",
      );
      return;
    }

    setDownloadingPdf(true);
    try {
      const response = await api.get(`/scans/${scan.id}/export/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      const domain = scan.website?.domain || "report";
      link.setAttribute(
        "download",
        `ScanLens_Report_${domain}_${Date.now()}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          "Failed to download PDF report. Please try again.",
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyUrl = () => {
    if (scan.website?.url) {
      navigator.clipboard.writeText(scan.website.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ✅ Generate dynamic metrics with AI suggestions based on plan
  const generateMetrics = (): MetricDetail[] => {
    const metrics: MetricDetail[] = [];

    // SSL/TLS
    metrics.push({
      name: "SSL/TLS Certificate",
      value: scan.sslValid ? "Valid" : "Invalid",
      status: scan.sslValid ? "pass" : "fail",
      description: scan.sslValid
        ? "SSL certificate is valid and properly configured"
        : "SSL certificate is invalid or expired",
      icon: Lock,
      suggestion: scan.sslValid
        ? undefined
        : "Renew your SSL certificate immediately to secure your domain",
    });

    // HTTPS
    metrics.push({
      name: "HTTPS Enforcement",
      value: scan.httpsEnforced ? "Enforced" : "Not Enforced",
      status: scan.httpsEnforced ? "pass" : "warning",
      description: scan.httpsEnforced
        ? "HTTPS is properly enforced across the domain"
        : "HTTPS is not enforced, consider redirecting HTTP to HTTPS",
      icon: Shield,
      suggestion: scan.httpsEnforced
        ? undefined
        : "Configure your server to redirect all HTTP traffic to HTTPS",
    });

    // CORS
    metrics.push({
      name: "CORS Configuration",
      value: scan.corsSecure ? "Secure" : "Insecure",
      status: scan.corsSecure ? "pass" : "fail",
      description: scan.corsSecure
        ? "CORS headers are properly configured"
        : "CORS headers are misconfigured or missing",
      icon: Globe,
      suggestion: scan.corsSecure
        ? undefined
        : "Review and update your CORS headers to prevent cross-origin attacks",
    });

    // Security Headers
    metrics.push({
      name: "Security Headers",
      value: scan.securityHeaders ? "Present" : "Missing",
      status: scan.securityHeaders ? "pass" : "warning",
      description: scan.securityHeaders
        ? "Security headers are properly set"
        : "Security headers are missing or incomplete",
      icon: ShieldCheck,
      suggestion: scan.securityHeaders
        ? undefined
        : "Add security headers like CSP, X-Frame-Options, and HSTS",
    });

    // Server Info
    metrics.push({
      name: "Server Information",
      value: scan.serverInfo || "Unknown",
      status: "info",
      description: "Server software and version information",
      icon: Server,
      suggestion: undefined,
    });

    // Response Time
    metrics.push({
      name: "Response Time",
      value: scan.responseTime ? `${scan.responseTime}ms` : "N/A",
      status: scan.responseTime && scan.responseTime < 500 ? "pass" : "warning",
      description:
        scan.responseTime && scan.responseTime < 500
          ? "Good response time"
          : "Response time could be improved",
      icon: Zap,
      suggestion:
        scan.responseTime && scan.responseTime >= 500
          ? "Consider optimizing your server configuration or using a CDN"
          : undefined,
    });

    return metrics;
  };

  const metrics = generateMetrics();

  // ✅ Get AI suggestion badge based on plan
  const getAISuggestionBadge = () => {
    if (userRole === "admin" || planFeatures.aiFixes) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-semibold border border-purple-500/30">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-400"></span>
          </span>
          AI Available
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 text-[10px] font-semibold border border-slate-700">
        <Crown className="h-2.5 w-2.5" />
        Upgrade for AI
      </span>
    );
  };

  // Render tabs
  const renderTabs = () => (
    <div className="flex gap-1 bg-slate-950/60 rounded-xl p-1 border border-slate-800">
      {[
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "metrics", label: "Metrics", icon: ShieldCheck },
        { id: "details", label: "Details", icon: FileText },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
            activeTab === tab.id
              ? "bg-sky-600 text-white shadow-lg shadow-sky-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <tab.icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );

  // Render overview tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Score Circle */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-950/40 border border-slate-800">
        <div className="relative">
          <svg className="w-32 h-32 sm:w-40 sm:h-40 transform -rotate-90">
            <circle
              className="text-slate-800"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="56"
              cx="64"
              cy="64"
            />
            <circle
              className={`${score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-rose-400"} transition-all duration-1000`}
              strokeWidth="8"
              strokeDasharray={352}
              strokeDashoffset={352 - (352 * score) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="56"
              cx="64"
              cy="64"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
              {score}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">/ 100</span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            {getScoreIcon(score)}
            <span
              className={`text-xl font-bold ${getScoreColor(score).split(" ")[0]}`}
            >
              {getScoreLabel(score)}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Security assessment for{" "}
            <span className="text-white font-mono">{scan.website?.domain}</span>
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(scan.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(scan.createdAt).toLocaleTimeString()}
            </span>
          </div>
          {/* ✅ Plan Badge */}
          {isLoggedIn && (
            <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
              <span
                className={`text-[10px] font-semibold ${planFeatures.color}`}
              >
                {userRole === "admin" ? "👑 Admin" : planFeatures.name} Plan
              </span>
              {getAISuggestionBadge()}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Checks", value: metrics.length, icon: ShieldCheck },
          {
            label: "Passed",
            value: metrics.filter((m) => m.status === "pass").length,
            icon: CheckCircle,
            color: "text-emerald-400",
          },
          {
            label: "Warnings",
            value: metrics.filter((m) => m.status === "warning").length,
            icon: AlertTriangle,
            color: "text-amber-400",
          },
          {
            label: "Failed",
            value: metrics.filter((m) => m.status === "fail").length,
            icon: X,
            color: "text-rose-400",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-center"
          >
            <div
              className={`flex items-center justify-center ${stat.color || "text-sky-400"} mb-1`}
            >
              <stat.icon className="h-4 w-4" />
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {stat.value}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render metrics tab
  const renderMetrics = () => (
    <div className="space-y-3">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        const statusColors = {
          pass: "border-emerald-500/20 bg-emerald-500/5",
          fail: "border-rose-500/20 bg-rose-500/5",
          warning: "border-amber-500/20 bg-amber-500/5",
          info: "border-sky-500/20 bg-sky-500/5",
        };
        const statusBadges = {
          pass: (
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
              Pass
            </span>
          ),
          fail: (
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-semibold">
              Fail
            </span>
          ),
          warning: (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-semibold">
              Warning
            </span>
          ),
          info: (
            <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 text-[10px] font-semibold">
              Info
            </span>
          ),
        };

        const showSuggestion =
          metric.suggestion && (userRole === "admin" || planFeatures.aiFixes);

        return (
          <div
            key={index}
            className={`p-4 rounded-xl border ${statusColors[metric.status]} transition hover:border-opacity-100`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-1.5 rounded-lg bg-slate-800/50 flex-shrink-0 mt-0.5">
                  <IconComponent className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">
                      {metric.name}
                    </span>
                    {statusBadges[metric.status]}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {metric.description}
                  </p>
                  {/* ✅ AI Suggestion - Only for eligible users */}
                  {showSuggestion && (
                    <div className="mt-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="flex items-start gap-1.5">
                        <span className="text-purple-400 text-[10px] font-semibold flex items-center gap-1">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-400"></span>
                          </span>
                          AI Suggestion:
                        </span>
                        <span className="text-xs text-purple-300">
                          {metric.suggestion}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs font-mono text-slate-300 bg-slate-800/50 px-2 py-1 rounded-lg whitespace-nowrap">
                {metric.value}
              </span>
            </div>
          </div>
        );
      })}

      {/* ✅ Plan Upgrade Prompt for AI Features */}
      {!planFeatures.aiFixes && userRole !== "admin" && isLoggedIn && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/30 to-sky-950/30 border border-purple-500/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Gem className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-white">
                  Upgrade for AI-Powered Suggestions
                </p>
                <p className="text-[10px] text-slate-400">
                  Get intelligent recommendations to improve your security
                  posture
                </p>
              </div>
            </div>
            <Link
              href="/subscription"
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white text-xs font-semibold transition shadow-lg shadow-purple-500/20 whitespace-nowrap"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  // Render details tab
  const renderDetails = () => (
    <div className="space-y-4">
      {/* Raw Data Toggle */}
      <button
        onClick={() => setShowRawData(!showRawData)}
        className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
      >
        {showRawData ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
        {showRawData ? "Hide" : "Show"} Raw Data
      </button>

      {showRawData && (
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 overflow-x-auto">
          <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap break-all">
            {JSON.stringify(scan, null, 2)}
          </pre>
        </div>
      )}

      {/* Domain Info */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
            Domain
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-white truncate">
              {scan.website?.domain}
            </span>
            <button
              onClick={handleCopyUrl}
              className="p-1 rounded-lg hover:bg-slate-800 transition flex-shrink-0"
              title="Copy URL"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
            Full URL
          </span>
          <a
            href={scan.website?.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-sky-400 hover:underline flex items-center gap-1 truncate"
          >
            {scan.website?.url}
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Scan ID", value: scan.id?.slice(0, 8) || "N/A" },
          { label: "Status", value: scan.status || "COMPLETED" },
          {
            label: "Created",
            value: new Date(scan.createdAt).toLocaleDateString(),
          },
        ].map((item, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-slate-950/40 border border-slate-800"
          >
            <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
              {item.label}
            </span>
            <span className="text-xs font-mono text-white truncate block">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:bg-white print:backdrop-blur-none"
      dir="ltr"
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col print:bg-white print:border print:border-gray-200 print:shadow-none"
      >
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 border-b border-slate-800 bg-slate-950/40 print:bg-gray-50 print:border-gray-200">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 print:text-gray-900">
              <ShieldCheck className="h-5 w-5 text-sky-400 print:text-gray-600" />
              <span>Audit Report Details</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono print:text-gray-500 truncate">
              Target: {scan.website?.domain || scan.website?.url}
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Download PDF Button - with plan check */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || !canExport}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition shadow-lg disabled:opacity-50 print:hidden ${
                canExport
                  ? "bg-sky-600 hover:bg-sky-500 shadow-sky-600/20"
                  : "bg-slate-700 cursor-not-allowed"
              }`}
              title={
                !canExport
                  ? "Export not available on your plan"
                  : "Download PDF Report"
              }
            >
              <Download
                className={`h-3.5 w-3.5 ${downloadingPdf ? "animate-bounce" : ""}`}
              />
              <span className="hidden sm:inline">
                {downloadingPdf ? "Generating..." : "Download PDF"}
              </span>
              <span className="sm:hidden">
                {downloadingPdf ? "..." : "PDF"}
              </span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 print:hidden"
              title="Print Report"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition print:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 print:p-4">
          {/* Tabs - Hidden in print */}
          <div className="print:hidden">{renderTabs()}</div>

          {/* Tab Content */}
          <div className="print:block">
            <div className="print:hidden">
              {activeTab === "overview" && renderOverview()}
              {activeTab === "metrics" && renderMetrics()}
              {activeTab === "details" && renderDetails()}
            </div>
            {/* Print view - show everything */}
            <div className="hidden print:block space-y-6">
              {renderOverview()}
              <hr className="border-gray-200" />
              {renderMetrics()}
              <hr className="border-gray-200" />
              {renderDetails()}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/40 flex justify-between print:hidden">
          {/* ✅ Plan Info in Footer */}
          {isLoggedIn && (
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-semibold ${planFeatures.color}`}
              >
                {userRole === "admin" ? (
                  "👑"
                ) : (
                  <planFeatures.icon className="h-3 w-3" />
                )}
              </span>
              <span className="text-[10px] text-slate-400">
                {userRole === "admin"
                  ? "Admin Access"
                  : `${planFeatures.name} Plan`}
              </span>
            </div>
          )}
          <button
            onClick={onClose}
            className="px-4 sm:px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
