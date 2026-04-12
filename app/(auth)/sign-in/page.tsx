"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? "Sign in failed");
      return;
    }
    router.push("/overview");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Welcome back to Cazura. Enter your email and password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? (
              <p className="text-destructive text-sm">{error}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              No account?{" "}
              <Link href="/sign-up" className="text-primary underline">
                Create one
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
