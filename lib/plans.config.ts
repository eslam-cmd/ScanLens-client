// client/lib/plans.config.ts

import {
  Shield,
  Crown,
  Gem,
  ShieldCheck,
  User,
  Users,
  Clock,
  Zap,
  FileText,
  Download,
  Lock,
  Globe,
  Code2,
  Terminal,
  Database,
  Server,
  Cloud,
  Settings,
  BarChart3,
  LineChart,
  PieChart,
  Layers,
  Award,
  Star,
  Sparkles,
} from "lucide-react";

// ============================================================
// ✅ تعريف الأنواع
// ============================================================

export type PlanType = "free" | "pro" | "extra";
export type UserRole = "user" | "admin";
export type BillingCycle = "monthly" | "yearly";

// ✅ نوع يسمح بـ Infinity
export type UnlimitedNumber = number | typeof Infinity;

// ============================================================
// ✅ واجهات (Interfaces)
// ============================================================

export interface PlanFeatures {
  name: string;
  icon: any;
  color: string;
  borderColor: string;
  bgColor: string;
  badge: string;
  badgeColor: string;
  historyRetention: UnlimitedNumber; // ✅ يسمح بـ Infinity
  maxScans: UnlimitedNumber; // ✅ يسمح بـ Infinity
  maxStoredScans: UnlimitedNumber; // ✅ جديد
  exportReports: boolean;
  aiFixes: boolean;
  deepScan: boolean;
  prioritySupport: boolean;
  maxWebsites: UnlimitedNumber; // ✅ يسمح بـ Infinity
  teamMembers: UnlimitedNumber; // ✅ يسمح بـ Infinity
  apiAccess: boolean;
  customRules: boolean;
  auditLogs: boolean;
  whiteLabel: boolean;
}

export interface PlanLimits {
  scansPerDay: UnlimitedNumber;
  concurrentScans: UnlimitedNumber;
  historyRetention: string;
  deepScanLimit: UnlimitedNumber;
  maxStoredScans: UnlimitedNumber; // ✅ جديد
  unlimitedScans: boolean;
  aiFixes: boolean;
  exportReports: boolean;
  deepScan: boolean;
  prioritySupport: boolean;
  customRules: boolean;
  teamMembers: UnlimitedNumber;
  apiAccess: boolean;
  maxWebsites: UnlimitedNumber;
  scanTimeout: number;
  advancedAnalytics: boolean;
  customReports: boolean;
  webhookIntegration: boolean;
  ssoEnabled: boolean;
  auditLogs: boolean;
  whiteLabel: boolean;
}

export interface Plan {
  id: PlanType;
  name: string;
  icon: any;
  price: number;
  priceYearly: number;
  description: string;
  features: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  badge?: string;
  recommended?: boolean;
  limits: PlanLimits;
}

// ============================================================
// ✅ ميزات الخطط الأساسية (موحّدة مع server)
// ============================================================

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  free: {
    name: "Free",
    icon: Shield,
    color: "text-slate-400",
    borderColor: "border-slate-700",
    bgColor: "bg-slate-900/50",
    badge: "Starter",
    badgeColor: "text-slate-400 bg-slate-800/50",
    historyRetention: 7, // ✅ 7 أيام
    maxScans: 10, // ✅ موحّد مع server (10)
    maxStoredScans: 50, // ✅ 50 فحص مخزن
    exportReports: true,
    aiFixes: false,
    deepScan: true,
    prioritySupport: false,
    maxWebsites: 1,
    teamMembers: 1,
    apiAccess: false,
    customRules: false,
    auditLogs: false,
    whiteLabel: false,
  },
  pro: {
    name: "Pro",
    icon: Crown,
    color: "text-sky-400",
    borderColor: "border-sky-500/30",
    bgColor: "bg-sky-950/30",
    badge: "Professional",
    badgeColor: "text-sky-400 bg-sky-500/20",
    historyRetention: 90, // ✅ 90 يوم
    maxScans: 50, // ✅ 50 فحص يومياً
    maxStoredScans: 500, // ✅ 500 فحص مخزن
    exportReports: true,
    aiFixes: true,
    deepScan: true,
    prioritySupport: true,
    maxWebsites: 25,
    teamMembers: 10,
    apiAccess: true,
    customRules: true,
    auditLogs: true,
    whiteLabel: false,
  },
  extra: {
    name: "Extra",
    icon: Gem,
    color: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-950/30",
    badge: "Elite",
    badgeColor: "text-purple-400 bg-purple-500/20",
    historyRetention: 365, // ✅ سنة
    maxScans: Infinity, // ✅ غير محدود
    maxStoredScans: 2000, // ✅ 2000 فحص مخزن
    exportReports: true,
    aiFixes: true,
    deepScan: true,
    prioritySupport: true,
    maxWebsites: Infinity,
    teamMembers: Infinity,
    apiAccess: true,
    customRules: true,
    auditLogs: true,
    whiteLabel: true,
  },
};

// ============================================================
// ✅ الخطط الكاملة
// ============================================================

export const PLANS: Record<PlanType, Plan> = {
  free: {
    id: "free",
    name: "Free",
    icon: Shield,
    price: 0,
    priceYearly: 0,
    description: "Perfect for getting started with basic security scanning",
    color: "from-slate-600 to-slate-500",
    bgColor: "bg-slate-900/50",
    borderColor: "border-slate-700",
    features: [
      "10 scans per day", // ✅ موحّد
      "5 deep scans per day",
      "1 concurrent scan",
      "7-day history retention",
      "Up to 50 stored scans", // ✅ جديد
      "Manual report export",
      "Community support",
    ],
    limits: {
      scansPerDay: 10, // ✅ موحّد
      concurrentScans: 1,
      historyRetention: "7 days",
      deepScanLimit: 5,
      maxStoredScans: 50, // ✅ جديد
      unlimitedScans: false,
      aiFixes: false,
      exportReports: true,
      deepScan: true,
      prioritySupport: false,
      customRules: false,
      teamMembers: 1,
      apiAccess: false,
      maxWebsites: 1,
      scanTimeout: 60,
      advancedAnalytics: false,
      customReports: false,
      webhookIntegration: false,
      ssoEnabled: false,
      auditLogs: false,
      whiteLabel: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    icon: Crown,
    price: 29.99,
    priceYearly: 299.99,
    description: "Ideal for professional developers and small teams",
    color: "from-sky-500 to-indigo-500",
    bgColor: "bg-sky-950/30",
    borderColor: "border-sky-500/30",
    badge: "Most Popular",
    recommended: true,
    features: [
      "50 scans per day",
      "Unlimited deep scans",
      "5 concurrent scans",
      "90-day history retention",
      "Up to 500 stored scans", // ✅ جديد
      "Advanced AI fixes",
      "Automated report export",
      "Deep scan included",
      "Priority support",
      "10 team members",
      "Full API access",
    ],
    limits: {
      scansPerDay: 50,
      concurrentScans: 5,
      historyRetention: "90 days",
      deepScanLimit: Infinity,
      maxStoredScans: 500, // ✅ جديد
      unlimitedScans: false,
      aiFixes: true,
      exportReports: true,
      deepScan: true,
      prioritySupport: true,
      customRules: true,
      teamMembers: 10,
      apiAccess: true,
      maxWebsites: 25,
      scanTimeout: 120,
      advancedAnalytics: true,
      customReports: true,
      webhookIntegration: true,
      ssoEnabled: false,
      auditLogs: true,
      whiteLabel: false,
    },
  },
  extra: {
    id: "extra",
    name: "Extra",
    icon: Gem,
    price: 49.99,
    priceYearly: 499.99,
    description: "For enterprises and power users needing maximum capabilities",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-950/30",
    borderColor: "border-purple-500/30",
    badge: "Best Value",
    features: [
      "Unlimited scans",
      "Unlimited deep scans",
      "Unlimited concurrent scans",
      "1-year history retention",
      "Up to 2000 stored scans", // ✅ جديد
      "Unlimited AI fixes",
      "Automated report export",
      "Deep scan included",
      "24/7 priority support",
      "Unlimited team members",
      "Full API access",
      "White label",
    ],
    limits: {
      scansPerDay: Infinity,
      concurrentScans: Infinity,
      historyRetention: "1 year",
      deepScanLimit: Infinity,
      maxStoredScans: 2000, // ✅ جديد
      unlimitedScans: true,
      aiFixes: true,
      exportReports: true,
      deepScan: true,
      prioritySupport: true,
      customRules: true,
      teamMembers: Infinity,
      apiAccess: true,
      maxWebsites: Infinity,
      scanTimeout: 300,
      advancedAnalytics: true,
      customReports: true,
      webhookIntegration: true,
      ssoEnabled: true,
      auditLogs: true,
      whiteLabel: true,
    },
  },
};

// ============================================================
// ✅ دوال مساعدة
// ============================================================

export const hasMinPlan = (
  currentPlan: PlanType,
  requiredPlan: PlanType,
): boolean => {
  const planLevels: Record<PlanType, number> = {
    free: 0,
    pro: 1,
    extra: 2,
  };
  return planLevels[currentPlan] >= planLevels[requiredPlan];
};

export const getPlanFeatures = (plan: PlanType): PlanFeatures => {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.free;
};

export const getPlan = (planId: PlanType): Plan => {
  return PLANS[planId] || PLANS.free;
};

export const hasFeature = (
  plan: PlanType,
  feature: keyof PlanFeatures,
): boolean => {
  const features = getPlanFeatures(plan);
  return features[feature] as boolean;
};

// ✅ يُرجع number أو Infinity
export const getMaxScans = (plan: PlanType): UnlimitedNumber => {
  const features = getPlanFeatures(plan);
  return features.maxScans;
};

// ✅ يُرجع number أو Infinity
export const getHistoryRetention = (plan: PlanType): UnlimitedNumber => {
  const features = getPlanFeatures(plan);
  return features.historyRetention;
};

// ✅ دالة جديدة
export const getMaxStoredScans = (plan: PlanType): UnlimitedNumber => {
  const features = getPlanFeatures(plan);
  return features.maxStoredScans;
};

export const checkUserCapability = (
  plan: PlanType,
  role: UserRole,
  action: "scan" | "deep_scan" | "ai_fix" | "export" | "delete" | "admin",
): { allowed: boolean; message?: string } => {
  // ✅ الأدمن يملك كل الصلاحيات
  if (role === "admin") {
    return { allowed: true };
  }

  const features = getPlanFeatures(plan);

  switch (action) {
    case "scan":
      return { allowed: true };

    case "deep_scan":
      return {
        allowed: features.deepScan,
        message: features.deepScan
          ? undefined
          : "Deep scan is not available on your plan. Please upgrade.",
      };

    case "ai_fix":
      return {
        allowed: features.aiFixes,
        message: features.aiFixes
          ? undefined
          : "AI fixes are not available on your plan. Please upgrade.",
      };

    case "export":
      return {
        allowed: features.exportReports,
        message: features.exportReports
          ? undefined
          : "Export reports are not available on your plan. Please upgrade.",
      };

    // ✅ الحذف متاح لـ Pro و Extra
    case "delete":
      return {
        allowed: plan !== "free",
        message:
          plan !== "free"
            ? undefined
            : "Delete is only available for Pro, Extra, or Admin users.",
      };

    case "admin":
      return {
        allowed: false,
        message: "Admin access required.",
      };

    default:
      return { allowed: false, message: "Unknown action." };
  }
};

export const getPlanPrice = (
  planId: PlanType,
  cycle: BillingCycle = "monthly",
): string => {
  const plan = PLANS[planId];
  if (!plan) return "$0";

  const price = cycle === "monthly" ? plan.price : plan.priceYearly;
  return `$${price}`;
};

export const getAllPlans = (): Plan[] => {
  return Object.values(PLANS);
};

export const isPaidPlan = (plan: PlanType): boolean => {
  return plan !== "free";
};

export const getPlanDisplayName = (planId: PlanType): string => {
  const features = getPlanFeatures(planId);
  return features.name;
};

export const getPlanIcon = (planId: PlanType): any => {
  const features = getPlanFeatures(planId);
  return features.icon;
};

// ============================================================
// ✅ دوال مساعدة إضافية
// ============================================================

/**
 * ✅ يُرجع نصاً مقروءاً لعدد غير محدود
 */
export const formatUnlimited = (
  value: UnlimitedNumber,
  suffix: string = "",
): string => {
  if (value === Infinity) return `Unlimited${suffix ? " " + suffix : ""}`;
  return `${value}${suffix ? " " + suffix : ""}`;
};

/**
 * ✅ يُرجع نسبة استخدام التخزين (0-100)
 */
export const getStorageUsagePercent = (
  used: number,
  max: UnlimitedNumber,
): number => {
  if (max === Infinity || max === 0) return 0;
  return Math.min(100, (used / max) * 100);
};

// ============================================================
// ✅ تصدير افتراضي
// ============================================================

export default {
  PLAN_FEATURES,
  PLANS,
  hasMinPlan,
  getPlanFeatures,
  getPlan,
  hasFeature,
  getMaxScans,
  getHistoryRetention,
  getMaxStoredScans,
  checkUserCapability,
  getPlanPrice,
  getAllPlans,
  isPaidPlan,
  getPlanDisplayName,
  getPlanIcon,
  formatUnlimited,
  getStorageUsagePercent,
};
