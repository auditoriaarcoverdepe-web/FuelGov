

import React, { createContext, useContext } from 'react';
import type { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: async () => false,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = AuthContext.Provider;