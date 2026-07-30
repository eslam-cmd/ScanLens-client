// client/lib/guards/withAuth.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  redirectTo: string = "/login"
) {
  return function WithAuthComponent(props: P) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const res = await api.get("/auth/me", { withCredentials: true });
          if (res.data?.user) {
            setUser(res.data.user);
          } else {
            router.push(redirectTo);
          }
        } catch {
          router.push(redirectTo);
        } finally {
          setLoading(false);
        }
      };

      checkAuth();
    }, [router, redirectTo]);

    if (loading) {
      return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-sky-400 animate-spin" />
            <p className="text-sm text-slate-400">Checking authentication...</p>
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