"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { SessionUser, SupportedOAuthProvider } from "@/types/auth";

export interface AuthContextType {
  user: SessionUser | null;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (provider: SupportedOAuthProvider, redirectUrl?: string) => void;
  devLogin: (
    provider?: SupportedOAuthProvider,
    displayName?: string,
    link?: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
  linkProvider: (provider: SupportedOAuthProvider) => void;
  unlinkProvider: (provider: SupportedOAuthProvider) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * 認証状態を管理・配信するReact Context Provider
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.user) {
          setUser(json.data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // URLのクエリパラメータに ?login=true がある場合は自動でモーダルを開く
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("login") === "true") {
        setIsAuthModalOpen(true);
      }
    }
  }, []);

  const openAuthModal = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const login = useCallback((provider: SupportedOAuthProvider, redirectUrl?: string) => {
    const url = new URL(`/api/auth/${provider}`, window.location.origin);
    if (redirectUrl) {
      url.searchParams.set("redirectUrl", redirectUrl);
    }
    window.location.href = url.toString();
  }, []);

  const devLogin = useCallback(
    async (provider: SupportedOAuthProvider = "twitter", displayName?: string, link?: boolean) => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/dev-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, displayName, link }),
        });

        if (res.ok) {
          await refreshUser();
          setIsAuthModalOpen(false);
        } else {
          const errData = await res.json();
          alert(errData.error || "モックログイン・連携に失敗しました。");
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "ログイン・連携エラー");
      } finally {
        setIsLoading(false);
      }
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      setUser(null);
      window.location.href = "/";
    } finally {
      setIsLoading(false);
    }
  }, []);

  const linkProvider = useCallback((provider: SupportedOAuthProvider) => {
    const url = new URL(`/api/auth/${provider}`, window.location.origin);
    url.searchParams.set("link", "true");
    url.searchParams.set("redirectUrl", window.location.pathname);
    window.location.href = url.toString();
  }, []);

  const unlinkProvider = useCallback(
    async (provider: SupportedOAuthProvider) => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/auth/unlink/${provider}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          await refreshUser();
        } else {
          alert(data.error || "連携解除に失敗しました。");
        }
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "連携解除エラー");
      } finally {
        setIsLoading(false);
      }
    },
    [refreshUser]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loading: isLoading,
        isAuthenticated: Boolean(user),
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        login,
        devLogin,
        logout,
        linkProvider,
        unlinkProvider,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 認証Contextを利用するためのカスタムフック
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
