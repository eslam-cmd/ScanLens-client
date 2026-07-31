// client/lib/api.ts
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Interceptor للطلب - إضافة Token من الكوكيز
api.interceptors.request.use(
  (config) => {
    // ✅ نترك الكوكيز ترسل تلقائياً مع withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ✅ Interceptor للاستجابة - التعامل مع 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ إذا كان 401 ولم يتم إعادة المحاولة
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("🔄 Attempting to refresh token...");

        // ✅ محاولة تجديد الـ Token
        const refreshResponse = await api.post(
          "/auth/refresh",
          {},
          { withCredentials: true },
        );

        if (refreshResponse.data.accessToken) {
          console.log("✅ Token refreshed successfully");
          // ✅ إعادة المحاولة مع الـ Token الجديد
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.log("❌ Token refresh failed, redirecting to login");
        // ✅ إذا فشل التجديد، إعادة التوجيه إلى تسجيل الدخول
        if (typeof window !== "undefined") {
          document.cookie =
            "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
        return Promise.reject(refreshError);
      }
    }

    // ✅ التعامل مع الأخطاء الأخرى
    if (error.response) {
      const status = error.response.status;

      if (status === 403) {
        console.log("❌ Forbidden - insufficient permissions");
      }

      if (status === 429) {
        console.warn("Rate limit exceeded. Please try again later.");
      }

      if (status === 500) {
        console.error("Server error. Please try again later.");
      }
    }

    if (error.code === "ERR_NETWORK") {
      console.error("Network error. Please check your internet connection.");
    }

    return Promise.reject(error);
  },
);

// ... باقي الدوال كما هي

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

// ✅ دالة مساعدة لتسجيل الخروج
export const logout = async () => {
  try {
    await api.post("/auth/logout", {}, { withCredentials: true });
  } finally {
    if (typeof window !== "undefined") {
      document.cookie =
        "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
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

// ✅ تصدير الـ api كـ default
export default api;
