import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("sunildemo:v1");
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed?.user) throw redirect({ to: "/auth" });
    } catch (e: any) {
      if (e?.isRedirect || e?.to) throw e;
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
