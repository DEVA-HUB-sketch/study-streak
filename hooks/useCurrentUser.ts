"use client";

import { useState, useEffect } from "react";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  college?: string;
  department?: string;
  totalRubies: number;
  rank: string;
  createdAt: string;
  updatedAt: string;
}

export function useCurrentUser() {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: AuthUser | null) => { if (d) setUser(d); })
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
