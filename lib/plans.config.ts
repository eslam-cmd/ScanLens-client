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
  historyRetention: number;
  maxScans: number;
  exportReports: boolean;
  aiFixes: boolean;
  deepScan: boolean;
  prioritySupport: boolean;
  maxWebsites: number;
  teamMembers: number;
  apiAccess: boolean;
  customRules: boolean;
  auditLogs: boolean; // ✅ إضافة هذه الخاصية
  whiteLabel: boolean; // ✅ إضافة هذه الخاصية
}

export interface PlanLimits {
  scansPerDay: number | string;
  concurrentScans: number | string;
  historyRetention: string;
  aiFixes: boolean;
  exportReports: boolean;
  deepScan: boolean;
  prioritySupport: boolean;
  customRules: boolean;
  teamMembers: number | string;
  apiAccess: boolean;
  maxWebsites: number | string;
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
// ✅ ميزات الخطط الأساسية
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
    historyRetention: 7,
    maxScans: 5,
    exportReports: true,
    aiFixes: false,
    deepScan: false,
    prioritySupport: false,
    maxWebsites: 1,
    teamMembers: 1,
    apiAccess: false,
    customRules: false,
    auditLogs: false, // ✅ إضافة
    whiteLabel: false, // ✅ إضافة
  },
  pro: {
    name: "Pro",
    icon: Crown,
    color: "text-sky-400",
    borderColor: "border-sky-500/30",
    bgColor: "bg-sky-950/30",
    badge: "Professional",
    badgeColor: "text-sky-400 bg-sky-500/20",
    historyRetention: 90,
    maxScans: 100,
    exportReports: true,
    aiFixes: true,
    deepScan: true,
    prioritySupport: true,
    maxWebsites: 25,
    teamMembers: 10,
    apiAccess: true,
    customRules: true,
    auditLogs: true, // ✅ إضافة
    whiteLabel: false, // ✅ إضافة
  },
  extra: {
    name: "Extra",
    icon: Gem,
    color: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-950/30",
    badge: "Elite",
    badgeColor: "text-purple-400 bg-purple-500/20",
    historyRetention: 365,
    maxScans: Infinity,
    exportReports: true,
    aiFixes: true,
    deepScan: true,
    prioritySupport: true,
    maxWebsites: Infinity,
    teamMembers: Infinity,
    apiAccess: true,
    customRules: true,
    auditLogs: true, // ✅ إضافة
    whiteLabel: true, // ✅ إضافة
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
      "5 scans per day",
      "1 concurrent scan",
      "7-day history retention",
      "Manual report export",
      "Standard scan only",
      "Community support",
    ],
    limits: {
      scansPerDay: 5,
      concurrentScans: 1,
      historyRetention: "7 days",
      aiFixes: false,
      exportReports: true,
      deepScan: false,
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
    price: 29,
    priceYearly: 290,
    description: "Ideal for professional developers and small teams",
    color: "from-sky-500 to-indigo-500",
    bgColor: "bg-sky-950/30",
    borderColor: "border-sky-500/30",
    badge: "Most Popular",
    recommended: true,
    features: [
      "100 scans per day",
      "5 concurrent scans",
      "90-day history retention",
      "Advanced AI fixes",
      "Automated report export",
      "Deep scan included",
      "Priority support",
      "10 team members",
      "Full API access",
    ],
    limits: {
      scansPerDay: 100,
      concurrentScans: 5,
      historyRetention: "90 days",
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
    price: 79,
    priceYearly: 790,
    description: "For enterprises and power users needing maximum capabilities",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-950/30",
    borderColor: "border-purple-500/30",
    badge: "Best Value",
    features: [
      "Unlimited scans",
      "Unlimited concurrent scans",
      "1-year history retention",
      "Unlimited AI fixes",
      "Automated report export",
      "Deep scan included",
      "24/7 priority support",
      "Unlimited team members",
      "Full API access",
      "White label",
    ],
    limits: {
      scansPerDay: "∞",
      concurrentScans: "∞",
      historyRetention: "1 year",
      aiFixes: true,
      exportReports: true,
      deepScan: true,
      prioritySupport: true,
      customRules: true,
      teamMembers: "∞",
      apiAccess: true,
      maxWebsites: "∞",
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
// ✅ دوال مساعدة للتحقق من الميزات
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

export const getMaxScans = (plan: PlanType): number => {
  const features = getPlanFeatures(plan);
  return features.maxScans;
};

export const getHistoryRetention = (plan: PlanType): number => {
  const features = getPlanFeatures(plan);
  return features.historyRetention;
};

export const checkUserCapability = (
  plan: PlanType,
  role: UserRole,
  action: "scan" | "deep_scan" | "ai_fix" | "export" | "delete" | "admin",
): { allowed: boolean; message?: string } => {
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
    case "delete":
      return {
        allowed: false,
        message: "Delete is only available for admin users.",
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

// ✅ 1. getPlanPrice - مُصححة
export const getPlanPrice = (
  planId: PlanType, // ✅ اسم مختلف
  cycle: BillingCycle = "monthly",
): string => {
  const plan = PLANS[planId];
  if (!plan) return "$0";

  const price = cycle === "monthly" ? plan.price : plan.priceYearly;
  return `$${price}`;
};

// ✅ 2. getAllPlans
export const getAllPlans = (): Plan[] => {
  return Object.values(PLANS);
};

// ✅ 3. isPaidPlan
export const isPaidPlan = (plan: PlanType): boolean => {
  return plan !== "free";
};

// ✅ 4. getPlanDisplayName - مُصححة
export const getPlanDisplayName = (planId: PlanType): string => {
  const features = getPlanFeatures(planId);
  return features.name;
};

// ✅ 5. getPlanIcon - مُصححة
export const getPlanIcon = (planId: PlanType): any => {
  const features = getPlanFeatures(planId);
  return features.icon;
};

// ============================================================
// ✅ تصدير كل شيء
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
  checkUserCapability,
  getPlanPrice,
  getAllPlans,
  isPaidPlan,
  getPlanDisplayName,
  getPlanIcon,
};
