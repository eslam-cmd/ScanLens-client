// client/components/Header.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Shield,
  User,
  LogIn,
  LogOut,
  History,
  Menu,
  X,
  Zap,
  Home,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronDown,
  Crown,
  Gem,
  ShieldCheck,
  LayoutDashboard,
  Key,
} from "lucide-react";
import { api } from "@/lib/api";

// ✅ استيراد من الملف المركزي للخطط
import {
  PlanType,
  getPlanFeatures,
  getPlan,
  getPlanDisplayName,
  getPlanIcon,
  isPaidPlan,
  hasMinPlan,
  PLAN_FEATURES,
} from "@/lib/plans.config";

// ✅ تعريف خريطة الألوان للخطط (تستخدم للعرض فقط)
const PLAN_CONFIG = {
  free: {
    label: "Free",
    icon: ShieldCheck,
    color: "text-slate-400",
    borderColor: "border-slate-700",
    bgColor: "bg-slate-900/50",
  },
  pro: {
    label: "Pro",
    icon: Crown,
    color: "text-sky-400",
    borderColor: "border-sky-500/30",
    bgColor: "bg-sky-950/30",
  },
  extra: {
    label: "Extra",
    icon: Gem,
    color: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-950/30",
  },
};

export default function Header() {
  const [user, setUser] = useState<{
    id: string;
    email: string;
    name?: string;
    role?: string;
    plan?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scansCount, setScansCount] = useState(0);
  const [userRole, setUserRole] = useState<string>("user");
  const [userPlan, setUserPlan] = useState<PlanType>("free");

  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ جلب بيانات المستخدم مع الدور والخطة
  const checkAuth = useCallback(async () => {
    try {
      const res = await api.post("/auth/me", { withCredentials: true });
      if (res.data?.user) {
        const userData = res.data.user;
        setUser(userData);
        setUserRole(userData.role || "user");
        setUserPlan(userData.plan || "free");
        setScansCount(userData.scanCount || 0);
      } else {
        setUser(null);
        setUserRole("user");
        setUserPlan("free");
      }
    } catch {
      setUser(null);
      setUserRole("user");
      setUserPlan("free");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth, pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // ✅ دالة تسجيل الخروج (المعدلة)
  const handleLogout = async () => {
    try {
      // ✅ محاولة إعلام السيرفر بتسجيل الخروج
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.log("Logout error:", error);
    } finally {
      // ✅ حذف التوكن من localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("token");

        // ✅ حذف الكوكيز
        document.cookie =
          "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie =
          "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }

      // ✅ تنظيف الـ State
      setUser(null);
      setUserRole("user");
      setUserPlan("free");
      setScansCount(0);
      setMobileMenuOpen(false);
      setDropdownOpen(false);

      // ✅ التوجيه إلى login مع تحديث الصفحة
      router.push("/login");
      router.refresh();
    }
  };

  const isActive = (path: string) => {
    if (path === "/") return pathname === path;
    return pathname?.startsWith(path);
  };

  // ✅ الحصول على معلومات الخطة من الملف المركزي
  const planInfo = userPlan
    ? getPlanFeatures(userPlan)
    : getPlanFeatures("free");
  const planData = userPlan ? getPlan(userPlan) : getPlan("free");
  const PlanIcon = planInfo.icon;

  // ✅ الحصول على معلومات العرض للخطة (للألوان والأنماط)
  const displayPlanInfo =
    PLAN_CONFIG[userPlan as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.free;

  // ✅ روابط التنقل حسب الصلاحية
  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/scan", label: "Quick Scan", icon: Zap, highlight: true },
  ];

  // ✅ روابط المستخدم العادي
  const userLinks = [
    { href: "/history", label: "Audit History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/help", label: "Help & Support", icon: HelpCircle },
  ];

  // ✅ روابط الأدمن
  const adminLinks = [
    {
      href: "/admin",
      label: "Admin Dashboard",
      icon: LayoutDashboard,
      highlight: true,
    },
  ];

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition hover:opacity-90 group"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-sky-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Shield className="h-7 w-7 text-sky-400 relative z-10 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
            Scan<span className="text-sky-400">Lens</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
            v2.0
          </span>
        </Link>

        {/* Navigation Links - Desktop */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 relative ${
                  active
                    ? "text-sky-400 bg-sky-500/10"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                } ${link.highlight ? "text-amber-400" : ""}`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    link.highlight ? "text-amber-400" : ""
                  }`}
                />
                <span>{link.label}</span>
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-sky-400 rounded-full" />
                )}
              </Link>
            );
          })}

          {/* ✅ إذا كان المستخدم أدمن، يعرض رابط Admin Dashboard */}
          {user && userRole === "admin" && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive("/admin")
                  ? "text-amber-400 bg-amber-500/10"
                  : "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Admin</span>
              {isActive("/admin") && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-400 rounded-full" />
              )}
            </Link>
          )}

          {/* ✅ إذا كان المستخدم عادي، يعرض History */}
          {user && userRole !== "admin" && (
            <Link
              href="/history"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive("/history")
                  ? "text-sky-400 bg-sky-500/10"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <History className="h-4 w-4" />
              <span>History</span>
            </Link>
          )}
        </nav>

        {/* Auth State */}
        <div className="flex items-center gap-2 sm:gap-3">
          {loading ? (
            <div className="h-9 w-24 rounded-lg bg-slate-900 animate-pulse border border-slate-800" />
          ) : user ? (
            <div className="flex items-center gap-2" ref={dropdownRef}>
              {/* User Info with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-200 group"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-sky-500/30 to-indigo-500/30 border border-sky-500/30 flex items-center justify-center text-xs font-bold text-sky-400">
                    {getInitials(user.name || user.email)}
                  </div>
                  <span className="hidden sm:inline text-xs font-medium text-slate-300 max-w-[100px] truncate">
                    {user.name || user.email}
                  </span>
                  {/* ✅ عرض خطة المستخدم باستخدام الملف المركزي */}
                  {userRole !== "admin" && (
                    <span
                      className={`hidden sm:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${displayPlanInfo.bgColor} ${displayPlanInfo.borderColor} ${displayPlanInfo.color}`}
                    >
                      <PlanIcon className="h-3 w-3" />
                      {displayPlanInfo.label}
                    </span>
                  )}
                  {/* ✅ عرض Role الأدمن */}
                  {userRole === "admin" && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <ShieldCheck className="h-3 w-3" />
                      Admin
                    </span>
                  )}
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/50 py-1 overflow-hidden animate-slide-down">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-slate-800">
                      <p className="text-sm font-medium text-white truncate">
                        {user.name || "User"}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {/* ✅ عرض الخطة باستخدام الملف المركزي */}
                        {userRole !== "admin" && (
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${displayPlanInfo.bgColor} ${displayPlanInfo.borderColor} ${displayPlanInfo.color}`}
                          >
                            <PlanIcon className="h-3 w-3 inline mr-1" />
                            {displayPlanInfo.label}
                          </span>
                        )}
                        {/* ✅ عرض Role */}
                        {userRole === "admin" && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            👑 Admin
                          </span>
                        )}
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {scansCount} scans
                        </span>
                      </div>
                    </div>

                    {/* ✅ روابط حسب الصلاحية */}
                    <div className="py-1">
                      {/* روابط الأدمن */}
                      {userRole === "admin" && (
                        <>
                          {adminLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                              <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setDropdownOpen(false)}
                                className={`flex items-center gap-2.5 px-4 py-2 text-xs transition ${
                                  link.highlight
                                    ? "text-amber-400 hover:bg-amber-500/10"
                                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                                }`}
                              >
                                <Icon
                                  className={`h-4 w-4 ${link.highlight ? "text-amber-400" : "text-slate-400"}`}
                                />
                                {link.label}
                              </Link>
                            );
                          })}
                          <div className="border-t border-slate-800 my-1" />
                        </>
                      )}

                      {/* ✅ روابط المستخدم العادي */}
                      {userRole !== "admin" && (
                        <>
                          {userLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                              <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800/50 hover:text-white transition"
                              >
                                <Icon className="h-4 w-4 text-slate-400" />
                                {link.label}
                              </Link>
                            );
                          })}
                          <div className="border-t border-slate-800 my-1" />
                        </>
                      )}
                    </div>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 w-full transition"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>

              {/* Logout Button (Mobile) */}
              <button
                onClick={handleLogout}
                className="md:hidden p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white transition rounded-lg hover:bg-slate-800/50"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden xs:inline">Login</span>
              </Link>

              <Link
                href="/register"
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-sky-500 px-3 sm:px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:scale-[1.02] transition-all duration-300"
              >
                <User className="h-4 w-4" />
                <span className="hidden xs:inline">Get Started</span>
                <span className="xs:hidden">Sign Up</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-sm px-4 py-4 space-y-2 animate-slide-down">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    active
                      ? "bg-sky-500/10 text-sky-400"
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      link.highlight ? "text-amber-400" : ""
                    }`}
                  />
                  <span>{link.label}</span>
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ✅ روابط الأدمن في الموبايل */}
          {user && userRole === "admin" && (
            <>
              <div className="border-t border-slate-800/50 my-2" />
              <div className="space-y-1">
                {adminLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                        link.highlight
                          ? "text-amber-400 bg-amber-500/10"
                          : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${link.highlight ? "text-amber-400" : "text-slate-400"}`}
                      />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {/* ✅ روابط المستخدم العادي في الموبايل */}
          {user && userRole !== "admin" && (
            <>
              <div className="border-t border-slate-800/50 my-2" />
              <div className="space-y-1">
                {userLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-white transition"
                    >
                      <Icon className="h-4 w-4 text-slate-400" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {user && (
            <div className="border-t border-slate-800/50 my-2 pt-2 px-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500/30 to-indigo-500/30 border border-sky-500/30 flex items-center justify-center text-xs font-bold text-sky-400">
                {getInitials(user.name || user.email)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name || "User"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
              {/* ✅ عرض الخطة في الموبايل باستخدام الملف المركزي */}
              {userRole !== "admin" && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${displayPlanInfo.bgColor} ${displayPlanInfo.borderColor} ${displayPlanInfo.color}`}
                >
                  <PlanIcon className="h-3 w-3 inline mr-0.5" />
                  {displayPlanInfo.label}
                </span>
              )}
              {userRole === "admin" && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  👑 Admin
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
