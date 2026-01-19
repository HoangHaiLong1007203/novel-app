"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { API } from "@/lib/api";

export interface Provider {
  name: "local" | "google" | "facebook";
  providerId?: string;
}

export interface BankAccount {
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

export interface User {
  _id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  coins: number;
  role?: "user" | "admin";
  providers: Provider[];
  bankAccount?: BankAccount;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    API.get<User>("/api/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
