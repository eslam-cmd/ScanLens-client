// client/lib/guards/withSubscription.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Crown } from "lucide-react";
import { api } from "@/lib/api";

type RequiredPlan = "free" | "pro" | "extra";

export function withSubscription<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPlan: RequiredPlan,
  redirectTo: string = "/subscription"
) {
  return function WithSubscriptionComponent(props: P) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const planLevels = { free: 0, pro: 1, extra: 2 };
    const requiredLevel = planLevels[requiredPlan];

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const res = await api.get("/auth/me", { withCredentials: true });
          if (res.data?.user) {
            const userPlan = res.data.user.plan || "free";
            const userLevel = planLevels[userPlan as keyof typeof planLevels] || 0;

            if (userLevel >= requiredLevel) {
              setUser(res.data.user);
            } else {
              router.push(redirectTo);
            }
          } else {
            router.push("/login");
          }
        } catch {
          router.push("/login");
        } finally {
          setLoading(false);
        }
      };

      checkAuth();
    }, [router, redirectTo, requiredLevel]);

    if (loading) {
      return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-sky-400 animate-spin" />
            <p className="text-sm text-slate-400">Checking subscription...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <WrappedComponent {...props} user={user} />;
  };
}