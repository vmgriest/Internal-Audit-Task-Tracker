"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  // TODO: [Login-1] Wire up the form submit handler:
  //   1. Call signIn("credentials", { email, password, redirect: false })
  //   2. If result.error is set, show it in the `error` state
  //   3. On success, router.push("/dashboard")
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // TODO: [Login-1] replace this placeholder with the real signIn call
    // console.log("TODO: call signIn with", { email, password });
     const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-center">Audit Tracker</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Sign in to your account</p>

        {/* TODO: [Login-2] Show the error message when `error` is non-null */}
        {error && (
          <p className="text-red-600 text-sm mb-4 text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            {/* TODO: [Login-3] Bind value + onChange to the email state */}
            <input
              id="email"
              type="email"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="auditor@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">
              Password
            </label>
            {/* TODO: [Login-4] Bind value + onChange to the password state */}
            <input
              id="password"
              type="password"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Demo: auditor@example.com / password
        </p>
      </div>
    </main>
  );
}
