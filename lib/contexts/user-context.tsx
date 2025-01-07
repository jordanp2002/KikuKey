"use client";

import { createContext, useContext } from "react";

type UserContextType = {
  displayName: string;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({
  children,
  displayName,
}: {
  children: React.ReactNode;
  displayName: string;
}) {
  return (
    <UserContext.Provider value={{ displayName }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
} 