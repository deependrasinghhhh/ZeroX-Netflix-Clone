"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../../features/auth/api";
import { useAuthStore } from "../../features/auth/store";
import { ApiError } from "../../services/api-client";
import Link from "next/link";

interface Device {
  deviceId: string;
  deviceName: string;
  os: string;
  browser: string;
  ipAddress: string;
  lastActiveAt: string;
}

export default function SecurityPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [devicesError, setDevicesError] = useState<string | null>(null);

  // 2FA state
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [otpCode, setOtpCode] = useState("");
  const [twoFactorSetupStep, setTwoFactorSetupStep] = useState<"IDLE" | "GENERATED" | "ACTIVE">("IDLE");
  const [twoFactorMessage, setTwoFactorMessage] = useState<string | null>(null);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const fetchDevices = useCallback(async () => {
    setLoadingDevices(true);
    setDevicesError(null);
    try {
      const data = await authApi.getDevices();
      setDevices(data);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        router.push("/login");
        return;
      }
      const message = err instanceof Error ? err.message : "Failed to fetch active devices.";
      setDevicesError(message);
    } finally {
      setLoadingDevices(false);
    }
  }, [router]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    setIs2faEnabled(user.isTwoFactorEnabled);
    if (user.isTwoFactorEnabled) {
      setTwoFactorSetupStep("ACTIVE");
    }
    fetchDevices();
  }, [user, router, fetchDevices]);

  const handleRevokeDevice = async (deviceId: string) => {
    try {
      await authApi.revokeDevice(deviceId);
      setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to revoke session.";
      alert(message);
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm("Are you sure you want to terminate all other device sessions?")) return;
    try {
      await authApi.revokeAllDevices();
      // Keep only current device if possible or just refresh
      fetchDevices();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to revoke sessions.";
      alert(message);
    }
  };

  // Generate 2FA Secrets
  const handleSetup2FA = async () => {
    setTwoFactorError(null);
    setTwoFactorMessage(null);
    setActionLoading(true);
    try {
      const data = await authApi.generate2fa();
      setQrCode(data.qrCode);
      setTwoFactorSecret(data.secret);
      setRecoveryCodes(data.recoveryCodes);
      setTwoFactorSetupStep("GENERATED");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initiate 2FA setup.";
      setTwoFactorError(message);
    } finally {
      setActionLoading(false);
    }
  };

  // Verify and Enable 2FA
  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorError(null);
    setTwoFactorMessage(null);
    setActionLoading(true);
    try {
      await authApi.enable2fa(otpCode);
      setIs2faEnabled(true);
      setTwoFactorSetupStep("ACTIVE");
      setTwoFactorMessage("Two-Factor Authentication is now active.");
      if (user) {
        setUser({ ...user, isTwoFactorEnabled: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to verify code.";
      setTwoFactorError(message);
    } finally {
      setActionLoading(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to turn off Two-Factor Authentication?")) return;
    setTwoFactorError(null);
    setTwoFactorMessage(null);
    setActionLoading(true);
    try {
      await authApi.disable2fa(otpCode);
      setIs2faEnabled(false);
      setTwoFactorSetupStep("IDLE");
      setTwoFactorSecret(null);
      setQrCode(null);
      setRecoveryCodes([]);
      setOtpCode("");
      setTwoFactorMessage("Two-Factor Authentication has been disabled.");
      if (user) {
        setUser({ ...user, isTwoFactorEnabled: false });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to disable 2FA.";
      setTwoFactorError(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="border-b border-zinc-800 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Security & Sessions</h1>
            <p className="text-sm text-zinc-400 mt-1">Manage passwords, sessions, and active account settings</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-semibold">
            Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Two-Factor Section */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="p-6 bg-zinc-900 bg-opacity-40 border border-zinc-800 rounded-2xl backdrop-blur-md">
              <h2 className="text-xl font-semibold mb-2">Two-Factor Authentication (2FA)</h2>
              <p className="text-sm text-zinc-400 mb-6">
                Add an extra layer of protection by requiring a 6-digit verification code from your authenticator app (Google Authenticator, Authy, etc.) during login.
              </p>

              {twoFactorMessage && (
                <div className="p-3 mb-6 bg-emerald-950 bg-opacity-40 border border-emerald-500 rounded-lg text-emerald-200 text-sm">
                  {twoFactorMessage}
                </div>
              )}

              {twoFactorError && (
                <div className="p-3 mb-6 bg-red-950 bg-opacity-40 border border-red-500 rounded-lg text-red-200 text-sm">
                  {twoFactorError}
                </div>
              )}

              {twoFactorSetupStep === "IDLE" && (
                <button
                  onClick={handleSetup2FA}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                >
                  {actionLoading ? "Initializing..." : "Enable Two-Factor Authentication"}
                </button>
              )}

              {twoFactorSetupStep === "GENERATED" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    {qrCode && (
                      <div className="p-2 bg-white rounded-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrCode} alt="TOTP QR Code" className="w-40 h-40" />
                      </div>
                    )}
                    <div className="space-y-2 text-sm text-zinc-300">
                      <p className="font-semibold text-white">How to set up:</p>
                      <p>1. Scan the QR code or enter the secret key manually into your authenticator app.</p>
                      <p className="bg-zinc-950 p-2 font-mono text-xs rounded border border-zinc-800 select-all">
                        Secret Key: {twoFactorSecret}
                      </p>
                      <p>2. Enter the 6-digit code from the app below to activate 2FA.</p>
                    </div>
                  </div>

                  {/* Recovery Codes */}
                  {recoveryCodes.length > 0 && (
                    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
                      <p className="text-sm font-semibold text-amber-400">⚠️ Backup Recovery Codes</p>
                      <p className="text-xs text-zinc-400">Save these codes. Each code can only be used once if you lose access to your device.</p>
                      <div className="grid grid-cols-2 gap-2 font-mono text-xs text-zinc-300 bg-zinc-900 p-3 rounded border border-zinc-800">
                        {recoveryCodes.map((code, idx) => (
                          <div key={idx}>{code}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleEnable2FA} className="flex gap-4 max-w-sm">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="6-digit code"
                      className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                    >
                      {actionLoading ? "Verifying..." : "Verify & Enable"}
                    </button>
                  </form>
                </div>
              )}

              {twoFactorSetupStep === "ACTIVE" && is2faEnabled && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <span>✓</span> Two-Factor Authentication is Active
                  </div>
                  <form onSubmit={handleDisable2FA} className="flex gap-4 max-w-sm">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="6-digit code"
                      className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-colors"
                    >
                      {actionLoading ? "Disabling..." : "Disable 2FA"}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Active Sessions */}
            <div className="p-6 bg-zinc-900 bg-opacity-40 border border-zinc-800 rounded-2xl backdrop-blur-md">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Active Sessions</h2>
                  <p className="text-sm text-zinc-400">Devices currently authenticated to your account</p>
                </div>
                {devices.length > 1 && (
                  <button
                    onClick={handleRevokeAll}
                    className="text-xs font-semibold text-red-500 hover:underline"
                  >
                    Revoke All Other Devices
                  </button>
                )}
              </div>

              {loadingDevices ? (
                <div className="text-center py-6 text-zinc-500">Loading active sessions...</div>
              ) : devicesError ? (
                <div className="p-3 bg-red-950 bg-opacity-40 border border-red-500 rounded-lg text-red-200 text-sm">
                  {devicesError}
                </div>
              ) : devices.length === 0 ? (
                <div className="text-center py-6 text-zinc-500">No active sessions tracked.</div>
              ) : (
                <div className="space-y-4">
                  {devices.map((device) => (
                    <div
                      key={device.deviceId}
                      className="flex justify-between items-center p-4 bg-zinc-950 rounded-xl border border-zinc-800"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">{device.deviceName}</p>
                        <div className="flex gap-4 text-xs text-zinc-400">
                          <span>IP: {device.ipAddress}</span>
                          <span>Active: {new Date(device.lastActiveAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeDevice(device.deviceId)}
                        className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-semibold transition-colors"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar / Password Info */}
          <div className="space-y-6">
            <div className="p-6 bg-zinc-900 bg-opacity-40 border border-zinc-800 rounded-2xl backdrop-blur-md">
              <h2 className="text-lg font-semibold mb-4">Security Insights</h2>
              <div className="space-y-4 text-sm text-zinc-400">
                <p>
                  To keep your account secure, change your password regularly and do not share your credentials or authenticator secrets.
                </p>
                <p>
                  Revoking a session will instantly invalidate that device&apos;s refresh token, forcing them to re-authenticate at next request.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
