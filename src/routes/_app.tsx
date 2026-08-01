import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { hasSessionUser } from "@/lib/session";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!hasSessionUser()) throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
