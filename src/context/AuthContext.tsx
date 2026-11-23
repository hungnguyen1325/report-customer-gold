'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Account, DataTableInfo } from '@/lib/types';

interface AuthContextType {
  user: Account | null;
  tables: DataTableInfo[];
  selectedTable: string;
  setSelectedTable: (tableName: string) => void;
  loading: boolean;
  login: (token: string, userData: Account) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [tables, setTables] = useState<DataTableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setTables(data.tables || []);
        
        // Select first table if none selected or current not in list
        if (data.tables && data.tables.length > 0) {
          setSelectedTable((prev) => {
            const exists = data.tables.some((t: DataTableInfo) => t.name === prev);
            return exists ? prev : data.tables[0].name;
          });
        }
      } else {
        setUser(null);
        setTables([]);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to fetch user:', err);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = (token: string, userData: Account) => {
    setUser(userData);
    fetchCurrentUser();
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Logout error:', err);
      }
    } finally {
      setUser(null);
      setTables([]);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tables,
        selectedTable,
        setSelectedTable,
        loading,
        login,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
