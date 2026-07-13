import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("sunildemo:v1");
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.user) throw redirect({ to: "/dashboard" });
    } catch (e) {
      // rethrow redirect
      if (e && (e as any).isRedirect) throw e;
    }
    throw redirect({ to: "/auth" });
  },
  component: () => null,
});
