"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAccount } from "wagmi";
import { User, Badge } from "@/types/game";

const BASE_URL =
  process.env.NEXT_PUBLIC_NORMIES_API_BASE || "https://api.normies.art";

async function checkIsHolder(address: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/holders/${address}`);
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

function generateSessionToken(): string {
  return "guest_" + Math.random().toString(36).substring(2, 15);
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    loadUser();
  }, [address, isConnected]);

  async function loadUser() {
    setLoading(true);

    if (isConnected && address) {
      // Look up by wallet address
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("wallet_address", address.toLowerCase())
        .maybeSingle()

      if (data) {
        // Check holder status and update badge
        const isHolder = await checkIsHolder(address);
        const badge: Badge = isHolder ? "verified" : "adventurer";

        if (data.badge !== badge) {
          await supabase.from("users").update({ badge }).eq("id", data.id);
        }

        setUser({ ...data, badge });
        setLoading(false);
        return;
      }
    }

    // Fall back to session token for guests
    let token = localStorage.getItem("normie_session_token");
    if (!token) {
      token = generateSessionToken();
      localStorage.setItem("normie_session_token", token);
    }

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("session_token", token)
      .maybeSingle()

    if (data) {
      setUser(data);
    }

    setLoading(false);
  }

  async function createUser(username: string): Promise<User | null> {
    let badge: Badge = "adventurer";
    let walletAddress = null;

    if (isConnected && address) {
      walletAddress = address.toLowerCase();
      const isHolder = await checkIsHolder(address);
      badge = isHolder ? "verified" : "adventurer";
    }

    let token = localStorage.getItem("normie_session_token");
    if (!token) {
      token = generateSessionToken();
      localStorage.setItem("normie_session_token", token);
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        username,
        wallet_address: walletAddress,
        badge,
        session_token: token,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Supabase insert error:",
        error.message,
        error.details,
        error.hint,
      );
      return null;
    }

    if (!data) return null;

    setUser(data);
    return data;
  }

  return { user, loading, createUser, refetch: loadUser };
}
