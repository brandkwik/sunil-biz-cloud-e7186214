import { createFileRoute, redirect } from "@tanstack/react-router";
import { hasSessionUser } from "@/lib/session";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: hasSessionUser() ? "/dashboard" : "/auth" });
  },
  component: () => null,
});
