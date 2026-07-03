"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginInputSchema, LoginInput } from "@zerox/shared";
import { authApi } from "../../features/auth/api";
import { useAuthStore } from "../../features/auth/store";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [needs2fa, setNeeds2fa] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authApi.login(data);

      // Check if 2FA is required
      if ("isTwoFactorRequired" in response && response.isTwoFactorRequired) {
        setTempToken((response as any).tempToken || null);
        setNeeds2fa(true);
        setIsLoading(false);
        return;
      }

      setUser(response.user);
      // Redirect to profile selection
      router.push("/profiles");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong during login";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handle2faVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await authApi.verifyTwoFactor({ tempToken: tempToken!, code: otpCode });
      setUser(response.user);
      router.push("/profiles");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid 2FA code";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/30 via-zinc-950 to-black" />

      <div className="relative z-10 w-full max-w-md p-8 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-800 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="text-red-600">ZERO</span>
            <span className="text-white">X</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-2">Sign in to your premium streaming dashboard</p>
        </div>

        {error && (
          <div className="p-3 mb-6 bg-red-900/40 border border-red-500 rounded-lg text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {needs2fa ? (
          /* 2FA verification screen */
          <form onSubmit={handle2faVerify} className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-4xl">🔐</div>
              <h2 className="text-lg font-bold text-white">Two-Factor Authentication</h2>
              <p className="text-zinc-400 text-sm">Enter the 6-digit code from your authenticator app</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Authentication Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors shadow-lg"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </button>
            <button
              type="button"
              onClick={() => { setNeeds2fa(false); setError(null); }}
              className="w-full text-sm text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to Login
            </button>
          </form>
        ) : (
          /* Main login form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                {...register("email")}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-red-500 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                {...register("password")}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                {...register("rememberMe")}
                className="h-4 w-4 rounded bg-zinc-950 border-zinc-800 text-red-600 focus:ring-red-500 focus:ring-offset-zinc-900"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-zinc-400">
                Remember me
              </label>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors shadow-lg"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-zinc-400">
          New to ZeroX?{" "}
          <Link href="/register" className="text-white font-semibold hover:underline">
            Sign up now
          </Link>
        </div>
      </div>
    </div>
  );
}
