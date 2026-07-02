import { apiClient } from "../../services/api-client";
import {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  VerifyTwoFactorInput,
} from "@zerox/shared";

export const authApi = {
  register: async (data: RegisterInput) => {
    return apiClient<{ message: string; userId: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  login: async (data: LoginInput) => {
    return apiClient<{ message: string; user: { id: string; email: string; isTwoFactorEnabled: boolean } }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  refresh: async () => {
    return apiClient<{ message: string }>("/auth/refresh", {
      method: "POST",
    });
  },

  logout: async () => {
    return apiClient<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  },

  forgotPassword: async (email: string) => {
    return apiClient<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (data: ResetPasswordInput) => {
    return apiClient<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  verifyEmail: async (token: string) => {
    return apiClient<{ message: string }>(`/auth/verify-email?token=${token}`, {
      method: "GET",
    });
  },

  verifyTwoFactor: async (data: VerifyTwoFactorInput) => {
    return apiClient<{ message: string; user: { id: string; email: string; isTwoFactorEnabled: boolean } }>("/auth/2fa/verify", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getDevices: async () => {
    return apiClient<Array<{ deviceId: string; deviceName: string; os: string; browser: string; ipAddress: string; lastActiveAt: string }>>(
      "/auth/devices",
      { method: "GET" }
    );
  },

  revokeDevice: async (deviceId: string) => {
    return apiClient<{ message: string }>(`/auth/devices/revoke/${deviceId}`, {
      method: "POST",
    });
  },

  revokeAllDevices: async () => {
    return apiClient<{ message: string }>("/auth/devices/revoke-all", {
      method: "POST",
    });
  },

  generate2fa: async () => {
    return apiClient<{ qrCode: string; secret: string; recoveryCodes: string[] }>("/auth/2fa/generate", {
      method: "POST",
    });
  },

  enable2fa: async (code: string) => {
    return apiClient<{ message: string }>("/auth/2fa/enable", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  disable2fa: async (code: string) => {
    return apiClient<{ message: string }>("/auth/2fa/disable", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },
};
