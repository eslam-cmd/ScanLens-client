// client/components/UpgradeModal.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Crown,
  Gem,
  Shield,
  Star,
  Sparkles,
  Check,
  Key,
  Loader2,
  AlertCircle,
  Lock,
  Zap,
  Users,
  Clock,
  Database,
  FileText,
  Award,
  BadgeCheck,
  Rocket,
  ArrowRight,
  Infinity,
} from "lucide-react";
import { api } from "@/lib/api";

// ✅ استيراد من الملف المركزي للخطط
import {
  PlanType,
  BillingCycle,
  getPlanFeatures,
  getPlan,
  getPlanPrice,
  getAllPlans,
  getPlanDisplayName,
  getPlanIcon,
  isPaidPlan,
  hasMinPlan,
  PLANS as CENTRAL_PLANS,
} from "@/lib/plans.config";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: PlanType;
  userEmail?: string;
  onUpgradeSuccess?: (plan: PlanType) => void;
}

// ✅ استخدام الخطط من الملف المركزي
const PLANS = CENTRAL_PLANS;

export default function UpgradeModal({
  isOpen,
  onClose,
  currentPlan = "free",
  userEmail,
  onUpgradeSuccess,
}: UpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [licenseKey, setLicenseKey] = useState("");
  const [verifyingLicense, setVerifyingLicense] = useState(false);
  const [licenseError, setLicenseError] = useState("");
  const [licenseSuccess, setLicenseSuccess] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  // ✅ الحصول على جميع الخطط
  const allPlans = useMemo(() => getAllPlans(), []);

  // ✅ معلومات الخطة الحالية
  const currentPlanFeatures = useMemo(() => {
    return getPlanFeatures(currentPlan);
  }, [currentPlan]);

  const currentPlanData = useMemo(() => {
    return getPlan(currentPlan);
  }, [currentPlan]);

  // ✅ التحقق مما إذا كانت الخطة الحالية هي الأعلى (Extra)
  const isMaxPlan = useMemo(() => {
    return currentPlan === "extra";
  }, [currentPlan]);

  // ✅ الحصول على الخطط المتاحة للترقية (استبعاد الخطة الحالية)
  const availablePlans = useMemo(() => {
    return allPlans.filter((plan) => plan.id !== currentPlan);
  }, [allPlans, currentPlan]);

  // ✅ تحديد الخطة الموصى بها (Pro أو Extra حسب الخطة الحالية)
  const recommendedPlan = useMemo(() => {
    if (currentPlan === "free") return "pro";
    if (currentPlan === "pro") return "extra";
    return null;
  }, [currentPlan]);

  // ✅ حساب التوفير السنوي
  const savings = useMemo(() => {
    const proPlan = getPlan("pro");
    const extraPlan = getPlan("extra");
    return {
      pro: Math.round(
        ((proPlan.price * 12 - proPlan.priceYearly) / (proPlan.price * 12)) *
          100,
      ),
      extra: Math.round(
        ((extraPlan.price * 12 - extraPlan.priceYearly) /
          (extraPlan.price * 12)) *
          100,
      ),
    };
  }, []);

  // ✅ إعادة تعيين الحالة عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      // ✅ تعيين الخطة الموصى بها كلما فتح المودال
      if (currentPlan === "free") {
        setSelectedPlan("pro");
      } else if (currentPlan === "pro") {
        setSelectedPlan("extra");
      } else {
        setSelectedPlan(null);
      }
      setLicenseKey("");
      setLicenseError("");
      setLicenseSuccess("");
    }
  }, [isOpen, currentPlan]);

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
        email: userEmail,
      });

      if (res.data.valid) {
        const plan = res.data.plan as PlanType;
        setLicenseSuccess(
          `License verified! Upgrading to ${getPlanDisplayName(plan)} plan...`,
        );
        setTimeout(() => {
          onUpgradeSuccess?.(plan);
          onClose();
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      setLicenseError(err.response?.data?.message || "Invalid license key");
    } finally {
      setVerifyingLicense(false);
    }
  };

  // ✅ الترقية عبر Stripe
  const handleUpgrade = async (planId: PlanType) => {
    if (planId === currentPlan) {
      setLicenseError("You are already on this plan");
      return;
    }

    setProcessing(true);
    setLicenseError("");
    setLicenseSuccess("");

    try {
      const res = await api.post("/subscription/create-checkout", {
        plan: planId,
        billingCycle,
        email: userEmail,
      });

      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      setLicenseError(
        err.response?.data?.message || "Failed to initiate checkout",
      );
    } finally {
      setProcessing(false);
    }
  };

  // ✅ إذا كان المودال مغلقاً أو المستخدم لديه أعلى خطة
  if (!isOpen) return null;

  // ✅ إذا كانت الخطة الحالية هي Extra (أعلى خطة) - نعرض رسالة خاصة
  if (isMaxPlan) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20">
                <Gem className="h-6 w-6 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">
                You're on the Best Plan!
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
            <Gem className="h-12 w-12 text-purple-400 mx-auto mb-3" />
            <p className="text-sm text-white font-semibold">
              You are already on the{" "}
              <span className="text-purple-400">Extra</span> plan
            </p>
            <p className="text-xs text-slate-400 mt-1">
              You have access to all premium features and unlimited
              capabilities.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>Unlimited scans</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>Unlimited team members</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>1-year history retention</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>AI fixes & deep scan</span>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
              <Rocket className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {currentPlan === "free"
                  ? "Upgrade Your Plan"
                  : "Take It Further"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                {currentPlan === "free"
                  ? "Unlock more features and capabilities"
                  : `Upgrade from ${currentPlanFeatures.name} to get even more power`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Plan Badge */}
        <div
          className={`p-3 rounded-xl ${currentPlanFeatures.bgColor} border ${currentPlanFeatures.borderColor}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <currentPlanData.icon
                className={`h-5 w-5 ${currentPlanFeatures.color}`}
              />
              <div>
                <p className="text-sm font-medium text-white">
                  Current: {currentPlanFeatures.name} Plan
                </p>
                <p className="text-xs text-slate-400">
                  {currentPlan === "free"
                    ? "Upgrade to unlock premium features"
                    : `You're on the ${currentPlanFeatures.name} plan`}
                </p>
              </div>
            </div>
            {currentPlan !== "free" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active
              </span>
            )}
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4">
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

        {/* Plans Grid - عرض الخطط المتاحة للترقية فقط */}
        <div className="grid md:grid-cols-2 gap-4">
          {availablePlans.map((plan) => {
            const Icon = plan.icon;
            const planFeatures = getPlanFeatures(plan.id);
            const isSelected = selectedPlan === plan.id;
            const isRecommended = recommendedPlan === plan.id;
            const price = getPlanPrice(plan.id, billingCycle);

            return (
              <div
                key={plan.id}
                className={`relative p-5 rounded-2xl border transition-all duration-300 ${
                  isSelected
                    ? "border-sky-500/50 bg-sky-500/5 shadow-lg shadow-sky-500/10"
                    : "border-slate-800 bg-slate-900/40 hover:scale-[1.02] hover:border-slate-700"
                } ${isRecommended ? "ring-2 ring-sky-500/30" : ""}`}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-[10px] font-semibold">
                    RECOMMENDED
                  </div>
                )}

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

                <p className="text-xs text-slate-400 mb-4">
                  {plan.description}
                </p>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">{price}</span>
                  <span className="text-sm text-slate-400">
                    {" "}
                    / {billingCycle === "monthly" ? "mo" : "yr"}
                  </span>
                  {billingCycle === "yearly" && (
                    <p className="text-[10px] text-emerald-400 mt-0.5">
                      Save ${(plan.price * 12 - plan.priceYearly).toFixed(0)}/yr
                    </p>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  {/* ✅ عرض الميزات الإضافية مقارنة بالخطة الحالية */}
                  {plan.features.slice(0, 5).map((feature, i) => {
                    // ✅ التحقق مما إذا كانت هذه الميزة موجودة في الخطة الحالية
                    const isNewFeature =
                      !currentPlanData.features.includes(feature);
                    return (
                      <li
                        key={i}
                        className={`flex items-center gap-2 text-xs ${
                          isNewFeature ? "text-white" : "text-slate-400"
                        }`}
                      >
                        {isNewFeature ? (
                          <Sparkles className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                        )}
                        <span>{feature}</span>
                        {isNewFeature && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            NEW
                          </span>
                        )}
                      </li>
                    );
                  })}
                  {plan.features.length > 5 && (
                    <li className="text-[10px] text-slate-500 pl-5">
                      +{plan.features.length - 5} more features
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => {
                    setSelectedPlan(plan.id);
                    handleUpgrade(plan.id);
                  }}
                  disabled={processing}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-sm font-semibold transition shadow-lg shadow-sky-500/20 disabled:opacity-50"
                >
                  {processing && selectedPlan === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : (
                    `Upgrade to ${planFeatures.name}`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* License Key Section */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Key className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Have a License Key?
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Enter your license key to activate or upgrade your subscription
            instantly.
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
            <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {licenseError}
            </p>
          )}
          {licenseSuccess && (
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
              <Check className="h-3 w-3" />
              {licenseSuccess}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="flex items-center gap-4">
            <p className="text-[10px] text-slate-500">
              🔒 Secure payment • Cancel anytime
            </p>
            <span className="text-[10px] text-slate-600">•</span>
            <p className="text-[10px] text-slate-500">
              <span className="text-emerald-400">✓</span> 30-day money-back
              guarantee
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
