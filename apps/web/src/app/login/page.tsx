"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginInputSchema, LoginInput } from "@zerox/shared";
import { authApi } from "../../features/auth/api";
import { useAuthStore } from "../../features/auth/store";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
      setUser(response.user);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong during login";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black bg-opacity-90 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900 via-zinc-950 to-black opacity-60" />

      <div className="relative z-10 w-full max-w-md p-8 bg-zinc-900 bg-opacity-70 backdrop-blur-md rounded-2xl border border-zinc-800 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-red-600">ZERO<span className="text-white">X</span></h1>
          <p className="text-sm text-zinc-400 mt-2">Sign in to your premium streaming dashboard</p>
        </div>

        {error && (
          <div className="p-3 mb-6 bg-red-900 bg-opacity-40 border border-red-500 rounded-lg text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-6">
            <div className="text-emerald-500 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-bold text-white mb-2">Welcome Back!</h2>
            <p className="text-zinc-400 text-sm mb-6">Successfully authenticated.</p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              Go to Home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                {...register("email")}
                placeholder="you@example.com"
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
                type="password"
                {...register("password")}
                placeholder="••••••••"
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
