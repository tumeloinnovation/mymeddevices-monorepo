import React, { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * AuthProvider now serves only as an initializer for useAuthStore,
 * preventing unnecessary full-tree React Context re-renders.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  return <>{children}</>;
};

/**
 * useAuth now delegates directly to useAuthStore
 */
export const useAuth = () => {
  return useAuthStore();
};

export default useAuth;

