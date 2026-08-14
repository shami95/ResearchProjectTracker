import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import axiosClient, { extractErrorMessage } from '../api/axiosClient';
import { decodeToken, isTokenExpired } from '../utils/jwt';
import { AuthResponse, AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  initializing: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    password: string,
    fullName: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function userFromDecoded(token: string): AuthUser | null {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  return {
    userId: decoded.userId,
    username: decoded.sub,
    fullName: decoded.fullName,
    role: decoded.role,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Rehydrate session from localStorage on first load.
  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored && !isTokenExpired(stored)) {
      setToken(stored);
      setUser(userFromDecoded(stored));
    } else if (stored) {
      localStorage.removeItem('token');
    }
    setInitializing(false);
  }, []);

  const applyAuthResponse = useCallback((data: AuthResponse) => {
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser({
      userId: data.userId,
      username: data.username,
      fullName: data.fullName,
      role: data.role,
    });
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const response = await axiosClient.post<AuthResponse>('/auth/login', {
          username,
          password,
        });
        applyAuthResponse(response.data);
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    [applyAuthResponse]
  );

  const register = useCallback(
    async (username: string, password: string, fullName: string) => {
      try {
        const response = await axiosClient.post<AuthResponse>(
          '/auth/signup',
          { username, password, fullName }
        );
        applyAuthResponse(response.data);
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    [applyAuthResponse]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        initializing,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
