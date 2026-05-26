"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

async function quickSignIn(
  email: string,
  setLoading: (v: boolean) => void,
  setError: (v: string | null) => void,
  push: (path: string) => void
) {
  setLoading(true);
  setError(null);
  const result = await signIn("credentials", { email, password: "password", redirect: false });
  if (result?.error) { setError("Sign in failed."); setLoading(false); }
  else push("/dashboard");
}

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) { setError("Invalid email or password."); setLoading(false); }
    else router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Audit Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">Choose an account to continue</p>
        </div>

        {error && (
          <p className="text-red-600 text-sm text-center bg-red-50 rounded py-2">{error}</p>
        )}

        {/* One-click demo accounts */}
        <div className="space-y-2">
          <button
            disabled={loading}
            onClick={() => quickSignIn("auditor@example.com", setLoading, setError, router.push)}
            className="w-full flex items-center gap-3 border rounded-lg px-4 py-3 hover:bg-gray-50 disabled:opacity-50 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
              V
            </div>
            <div>
              <p className="font-medium text-sm">Vincent</p>
              <p className="text-xs text-gray-400">Auditor</p>
            </div>
          </button>

          <button
            disabled={loading}
            onClick={() => quickSignIn("admin@example.com", setLoading, setError, router.push)}
            className="w-full flex items-center gap-3 border rounded-lg px-4 py-3 hover:bg-gray-50 disabled:opacity-50 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
              A
            </div>
            <div>
              <p className="font-medium text-sm">Admin User</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
          </button>
        </div>

        {/* Manual login (collapsed by default) */}
        <div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full text-xs text-gray-400 hover:text-gray-600 py-1"
          >
            {showForm ? "▲ Hide manual login" : "▼ Sign in with email instead"}
          </button>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-3 mt-3">
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors text-sm"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
