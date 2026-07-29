"use client";

import { LogIn, UserPlus } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

interface AuthGateProps {
  children: ReactNode;
}

export const AuthGate = ({ children }: AuthGateProps) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const user = useAuthStore((state) => state.user);
  const isReady = useAuthStore((state) => state.isReady);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (!isReady) {
    return (
      <main className="grid h-screen place-items-center bg-zinc-100 text-sm font-medium text-zinc-600">
        Loading
      </main>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === "login") {
      await login(username, password);
      return;
    }

    await register(username, password);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-100 p-6 text-zinc-950">
      <form
        className="w-full max-w-sm rounded-md border border-zinc-300 bg-white p-5 shadow-panel"
        onSubmit={(event) => void submit(event)}
      >
        <div className="mb-5">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-teal-700 text-sm font-semibold text-white">
            FE
          </div>
          <h1 className="mt-4 text-lg font-semibold text-zinc-900">
            {mode === "login" ? "Sign in to FlowEngine" : "Create FlowEngine account"}
          </h1>
        </div>

        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-normal text-zinc-500">
              Username
            </span>
            <input
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              minLength={3}
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-normal text-zinc-500">
              Password
            </span>
            <input
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              required
            />
          </label>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
          {isLoading ? "Working" : mode === "login" ? "Sign in" : "Create account"}
        </button>

        <button
          type="button"
          className="mt-3 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-teal-600 hover:text-teal-700"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Create an account" : "Use existing account"}
        </button>
      </form>
    </main>
  );
};
