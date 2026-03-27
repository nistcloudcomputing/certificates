"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as { success: boolean; message?: string };

      if (!response.ok || !data.success) {
        setError(data.message || "Login failed.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-black/74 via-black/78 to-black/92" />
      <div className="absolute inset-x-0 top-0 h-[40vh] bg-gradient-to-b from-black/96 via-black/84 to-transparent" />
      <main className="relative z-10 w-full max-w-md">
        <Card>
          <h1 className="text-center text-2xl font-semibold text-zinc-100">Admin Login</h1>
          <p className="mt-2 text-center text-sm text-zinc-300">Sign in to manage certificates.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              id="admin-email"
              label="Admin Email"
              icon={<Mail className="size-4" />}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              autoFocus
            />
            <Input
              id="admin-password"
              label="Password"
              icon={<Lock className="size-4" />}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <Button type="submit" loading={loading}>
              Login
            </Button>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
          </form>
        </Card>
      </main>
    </div>
  );
}
