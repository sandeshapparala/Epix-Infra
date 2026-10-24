"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  type User,
  onIdTokenChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
interface AuthContextProps {
  user: User | null;
  loading: boolean;
  publicSiteAdmin: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  publicSiteAdmin: false,
  authError: null,
  signOut: async () => {},
});
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true);
  const [publicSiteAdmin, setPublicSiteAdmin] = useState(false),
    [authError, setAuthError] = useState<string | null>(null);
  useEffect(() => {
    let generation = 0,
      active = true;
    const stop = onIdTokenChanged(auth, (current) => {
      const id = ++generation;
      setLoading(true);
      setUser(current);
      setPublicSiteAdmin(false);
      if (!current) {
        setLoading(false);
        return;
      }
      current
        .getIdTokenResult()
        .then((token) => {
          if (active && id === generation) {
            setPublicSiteAdmin(token.claims.publicSiteAdmin === true);
            setAuthError(null);
          }
        })
        .catch(() => {
          if (active && id === generation)
            setAuthError("Your session could not be verified. Sign in again.");
        })
        .finally(() => {
          if (active && id === generation) setLoading(false);
        });
    });
    return () => {
      active = false;
      generation++;
      stop();
    };
  }, []);
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        publicSiteAdmin,
        authError,
        signOut: async () => {
          setAuthError(null);
          await firebaseSignOut(auth);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);
