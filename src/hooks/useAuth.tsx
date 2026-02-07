import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '@/types';
import { db } from '@/lib/database';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  isAttendant: boolean;
  hasPermission: (permission: Permission) => boolean;
}

type Permission = 
  | 'view_pos'
  | 'view_products'
  | 'edit_products'
  | 'delete_products'
  | 'view_categories'
  | 'edit_categories'
  | 'view_sales'
  | 'view_reports'
  | 'view_settings'
  | 'edit_settings'
  | 'view_users'
  | 'edit_users'
  | 'view_discounts'
  | 'edit_discounts'
  | 'view_mpesa'
  | 'edit_mpesa'
  | 'view_printers'
  | 'edit_printers'
  | 'export_data'
  | 'import_data'
  | 'edit_prices';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'view_pos', 'view_products', 'edit_products', 'delete_products',
    'view_categories', 'edit_categories', 'view_sales', 'view_reports',
    'view_settings', 'edit_settings', 'view_users', 'edit_users',
    'view_discounts', 'edit_discounts', 'view_mpesa', 'edit_mpesa',
    'view_printers', 'edit_printers', 'export_data', 'import_data', 'edit_prices'
  ],
  attendant: [
    'view_pos', 'view_products', 'view_categories', 'view_sales', 'edit_prices'
  ]
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('pos_current_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('pos_current_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await db.init();
      const user = db.getUserByEmail(email);
      
      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }

      if (user.password !== password) {
        return { success: false, error: 'Invalid email or password' };
      }

      setUser(user);
      localStorage.setItem('pos_current_user', JSON.stringify(user));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pos_current_user');
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return PERMISSIONS[user.role].includes(permission);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isAttendant: user?.role === 'attendant',
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
