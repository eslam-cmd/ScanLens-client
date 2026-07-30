// client/lib/guards/withAdmin.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield } from "lucide-react";
import { api } from "@/lib/api";

export function withAdmin<P extends object>(
  WrappedComponent: React.ComponentType<P>,
) {
  return function WithAdminComponent(props: P) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const res = await api.get("/auth/me", { withCredentials: true });
          if (res.data?.user?.role === "admin") {
            setUser(res.data.user);
          } else {
            router.push("/");
          }
        } catch {
          router.push("/");
        } finally {
          setLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    if (loading) {
      return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
            <p className="text-sm text-slate-400">Verifying admin access...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="text-center">
            <Shield className="h-16 w-16 text-rose-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">Access Denied</h2>
            <p className="text-sm text-slate-400">
              You need admin privileges to view this page.
            </p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
