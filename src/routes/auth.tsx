import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { actions, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck, TrendingUp, Zap } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("sunil@demo.co");
  const [password, setPassword] = useState("demo1234");
  const [name, setName] = useState("Sunil Kumar");
  const [business, setBusiness] = useState("SunilDemo Traders");

  useEffect(() => {
    if (user) router.navigate({ to: "/dashboard", replace: true });
  }, [user, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Enter email and password");
      return;
    }
    actions.login(email, name || "Sunil", business || "SunilDemo");
    toast.success(mode === "signup" ? "Account created" : "Welcome back");
    router.navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen md:grid md:grid-cols-2">
      {/* Brand panel */}
      <div className="brand-gradient relative flex flex-col justify-between p-6 text-white md:p-12">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 font-display text-xl font-bold backdrop-blur">S</div>
          <span className="font-display text-lg font-bold">SunilDemo</span>
        </div>
        <div className="hidden md:block">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Run your business.<br />Not your paperwork.
          </h2>
          <p className="mt-4 max-w-md text-white/85">
            Invoices, proforma, sales, expenses and reports — designed for Indian small businesses. Enterprise-grade, mobile-first.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex items-center gap-3"><Zap className="h-4 w-4" /> GST-ready invoices in seconds</li>
            <li className="flex items-center gap-3"><TrendingUp className="h-4 w-4" /> Live sales & expense reports</li>
            <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4" /> Secure, on-device data</li>
          </ul>
        </div>
        <p className="text-xs text-white/70">© {new Date().getFullYear()} SunilDemo. All rights reserved.</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-6 text-center">
            <h1 className="font-display text-2xl font-bold">Welcome to SunilDemo</h1>
            <p className="mt-1 text-sm text-muted-foreground">Business manager for small businesses</p>
          </div>
          <div className="mb-6 hidden md:block">
            <h1 className="font-display text-3xl font-bold">{mode === "login" ? "Sign in" : "Create account"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Continue to your SunilDemo dashboard</p>
          </div>

          <div className="mb-4 grid grid-cols-2 rounded-lg bg-muted p-1 text-sm font-medium">
            <button
              onClick={() => setMode("login")}
              className={`rounded-md py-2 transition ${mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >Sign in</button>
            <button
              onClick={() => setMode("signup")}
              className={`rounded-md py-2 transition ${mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >Sign up</button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="biz">Business name</Label>
                  <Input id="biz" value={business} onChange={(e) => setBusiness(e.target.value)} className="mt-1.5" />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
            </div>
            <Button type="submit" className="w-full brand-gradient font-semibold text-white hover:opacity-95">
              {mode === "login" ? "Sign in" : "Create account"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Demo build — data stays in your browser.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
