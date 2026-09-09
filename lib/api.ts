// client/lib/api.ts
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://scan-lens-server.vercel.app";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ إجباري — يخلي المتصفح يرسل ويستقبل الكوكيز مع كل طلب
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Interceptor للاستجابة - معالجة 401 وتجديد التوكن تلقائيًا عبر الكوكي
// client/lib/api.ts

// client/lib/api.ts

// ✅ Interceptor للاستجابة
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ لا تعيد محاولة طلبات التحقق (verify-otp) أو تسجيل الدخول (login)
    if (
      originalRequest.url?.includes('/verify-otp') ||
      originalRequest.url?.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("🔄 Attempting to refresh token...");
        await api.post("/auth/refresh", {}, { withCredentials: true });
        console.log("✅ Token refreshed successfully");
        return api(originalRequest);
      } catch (refreshError) {
        console.log("❌ Token refresh failed, redirecting to login");
        if (typeof window !== "undefined") {
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
// ✅ دالة مساعدة للتحقق من حالة المستخدم
export const getCurrentUser = async () => {
  try {
    const res = await api.get("/auth/me", { withCredentials: true });
    return res.data?.user || null;
  } catch {
    return null;
  }
};

// ✅ دالة مساعدة لتسجيل الدخول
export const login = async (email: string, password: string) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};

// ✅ دالة مساعدة للتسجيل
export const register = async (
  name: string,
  email: string,
  password: string,
) => {
  const res = await api.post("/auth/register", { name, email, password });
  return res.data;
};

export const logout = async () => {
  try {
    await api.post("/auth/logout", {}, { withCredentials: true });
  } catch (error) {
    console.log("Logout error:", error);
  } finally {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
};

// ✅ دالة مساعدة للتحقق من License Key
export const verifyLicense = async (licenseKey: string, email: string) => {
  const res = await api.post("/subscription/verify-license", {
    licenseKey,
    email,
  });
  return res.data;
};

// ✅ دالة مساعدة لجلب الخطط
export const getPlans = async () => {
  const res = await api.get("/subscription/plans");
  return res.data;
};

// ✅ دالة مساعدة للترقية
export const upgradePlan = async (
  planId: string,
  billingCycle: "monthly" | "yearly",
) => {
  const res = await api.post("/subscription/create-checkout", {
    plan: planId,
    billingCycle,
  });
  return res.data;
};

export default api;
