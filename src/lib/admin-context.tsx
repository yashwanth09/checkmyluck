"use client";

import { createContext, useContext } from "react";

const AdminSecretContext = createContext<string>("");

export function AdminSecretProvider({
  children,
  secret,
}: {
  children: React.ReactNode;
  secret: string;
}) {
  return (
    <AdminSecretContext.Provider value={secret}>
      {children}
    </AdminSecretContext.Provider>
  );
}

export function useAdminSecret() {
  return useContext(AdminSecretContext);
}
