import React, { createContext, useContext, useEffect, useState } from 'react';

// Shape of the institution object returned by the backend login response
export interface AuthInstitution {
  id: string;
  hierarchyPath: string;
  type: string;
  nameEn?: string | null;
  nameAm?: string | null;
  nameGez?: string | null;
}

// Full identity stored after a successful login
export interface AuthIdentity {
  userId: string;
  token: string;
  /** Backend field: ecclesiastical_role (PATRIARCH, ARCHBISHOP, BISHOP, PRIEST, DEACON, LAITY, TREASURER) */
  ecclesiasticalRole: string;
  /** Backend field: auth_role (SYSTEM_ADMIN, PARISH_ADMIN, PRIEST, MIMEN) */
  authRole: string;
  institutionId: string;
  fullName: string;
  institution: AuthInstitution | null;
}

interface AuthContextProps extends AuthIdentity {
  loading: boolean;
  setAuth: (identity: AuthIdentity) => void;
  clearAuth: () => void;
}

const DEFAULT_IDENTITY: AuthIdentity = {
  userId: '',
  token: '',
  ecclesiasticalRole: '',
  authRole: '',
  institutionId: '',
  fullName: '',
  institution: null,
};

const AuthContext = createContext<AuthContextProps>({
  ...DEFAULT_IDENTITY,
  loading: true,
  setAuth: () => {},
  clearAuth: () => {},
});

const STORAGE_KEY = 'orthodoxconnect_auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [identity, setIdentity] = useState<AuthIdentity>(DEFAULT_IDENTITY);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AuthIdentity = JSON.parse(stored);
        if (parsed.token && parsed.userId) {
          setIdentity(parsed);
        }
      }
    } catch {
      // Corrupted storage — clear it
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const setAuth = (newIdentity: AuthIdentity) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIdentity));
    setIdentity(newIdentity);
  };

  const clearAuth = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIdentity(DEFAULT_IDENTITY);
  };

  return (
    <AuthContext.Provider
      value={{
        ...identity,
        loading,
        setAuth,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
