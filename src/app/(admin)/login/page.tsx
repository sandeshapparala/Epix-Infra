// src/pages/login.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  hasPublicSiteAdminClaim,
  PUBLIC_ADMIN_ACCESS_ERROR,
} from "@/lib/public-admin-auth";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { user, publicSiteAdmin, authError } = useAuth();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user && publicSiteAdmin) router.replace("/admin");
  }, [router, user, publicSiteAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const authorized = await hasPublicSiteAdminClaim(credential.user);
      if (!authorized) {
        await firebaseSignOut(auth);
        setError(PUBLIC_ADMIN_ACCESS_ERROR);
        return;
      }
      router.replace("/admin");
    } catch (cause: unknown) {
      await firebaseSignOut(auth).catch(() => undefined);
      setError(
        cause instanceof Error
          ? cause.message
          : "Sign-in failed. Check your credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const visibleError = error ?? authError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        {visibleError && (
          <p role="alert" className="text-red-500 text-sm mb-4">
            {visibleError}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Email:</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700">Password:</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
