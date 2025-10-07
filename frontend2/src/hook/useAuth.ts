"use client";
import { useState, useEffect } from "react";
import { API } from "@/lib/api";

// Type mô phỏng đúng với backend
export interface Provider {
  name: "local" | "google" | "facebook";
  providerId?: string;
}

export interface User {
  _id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  coins: number;
  providers: Provider[];
  createdAt?: string;
  updatedAt?: string;
}

// Hook chính
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get<User>("/api/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading, setUser };
}
