import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { Platform, Alert } from 'react-native';

// Import localization files
import en from '../locales/en.json';
import hi from '../locales/hi.json';

// --- API Configuration ---
export const API_BASE_URL = Platform.OS === 'web' ? '' : 'http://51.20.116.238:4000';
export const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000, headers: { 'Content-Type': 'application/json' } });

// --- Theme Definition ---
export interface Theme {
  primary: string;
  secondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  tertiaryContainer: string;
  tertiaryFixed: string;
  surface: string;
  surfaceContainer: string;
  surfaceContainerLow: string;
  outline: string;
  outlineVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  error: string;
  errorContainer: string;
  cardBg: string;
  borderColor: string;
  glassShadow: string;
}

export const lightTheme: Theme = {
  primary: '#0a1422',
  secondary: '#416656',
  secondaryContainer: '#c3ecd7',
  onSecondaryContainer: '#002115',
  tertiary: '#665f3d',
  tertiaryContainer: '#b5ac84',
  tertiaryFixed: '#ede3b8',
  surface: '#fbf9fa',
  surfaceContainer: '#f0edee',
  surfaceContainerLow: '#f6f3f4',
  outline: '#75777c',
  outlineVariant: '#c5c6cc',
  onSurface: '#1b1b1d',
  onSurfaceVariant: '#44474c',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  cardBg: 'rgba(255, 255, 255, 0.85)',
  borderColor: 'rgba(228, 226, 227, 0.6)',
  glassShadow: 'rgba(10, 20, 34, 0.04)',
};

export const darkTheme: Theme = {
  primary: '#ffffff',
  secondary: '#82b39e',
  secondaryContainer: '#1c3d31',
  onSecondaryContainer: '#c3ecd7',
  tertiary: '#ede3b8',
  tertiaryContainer: '#4d4629',
  tertiaryFixed: '#ede3b8',
  surface: '#090f1d',
  surfaceContainer: '#151e2e',
  surfaceContainerLow: 'rgba(21, 30, 46, 0.5)',
  outline: '#94a3b8',
  outlineVariant: '#334155',
  onSurface: '#f8fafc',
  onSurfaceVariant: '#cbd5e1',
  error: '#f87171',
  errorContainer: '#7f1d1d',
  cardBg: 'rgba(21, 30, 46, 0.85)',
  borderColor: 'rgba(51, 65, 85, 0.4)',
  glassShadow: 'rgba(0, 0, 0, 0.25)',
};

// --- TypeScript Interfaces ---
export interface User {
  id?: string;
  userId: string;
  name: string;
  emailPhone: string;
  monthlyBudget: number;
  preferredLanguage: string;
  isFirstTimeUser: boolean;
  isEmailVerified?: boolean;
  savingsName?: string;
  savingsTarget?: number;
  savingsAchieved?: number;
  savingsGullakBalance?: number;
  rewardPoints?: number;
  lastSpinDate?: string;
}

export interface Expense {
  id: string;
  expenseId: string;
  amount: number;
  category: string;
  itemName: string;
  type: 'debit' | 'credit';
  date: string;
  notes?: string;
}

export interface Reminder {
  reminderId: string;
  title: string;
  amount: number;
  category: string;
  dueDate: string;
  status: 'paid' | 'unpaid';
}

export interface AppContextType {
  isLoggedIn: boolean;
  user: User | null;
  isFirstTimeUser: boolean;
  expenses: Expense[];
  reminders: Reminder[];
  savingsGullakBalance: number;
  loading: boolean;
  login: (phoneNumber: string, password: string) => Promise<boolean>;
  signUp: (phoneNumber: string, password: string) => Promise<boolean>;
  sendEmailOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyEmailOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  completeOnboarding: (data: { name: string; budgetLimit: string; language: string; currency?: string }) => Promise<void>;
  updateProfile: (data: { name: string; budgetLimit: string; language: string; savingsName?: string; savingsTarget?: string; savingsAchieved?: string }) => Promise<void>;
  addExpense: (title: string, amount: string, category: string, type?: 'debit' | 'credit') => Promise<void>;
  bulkSaveExpenses: (expensesList: Array<{ amount: number; itemName: string; category: string; date?: string; type?: 'debit' | 'credit' }>) => Promise<boolean>;
  payReminder: (reminderId: string) => Promise<void>;
  voiceParseExpense: (text: string) => Promise<{ amount: number; category: string; itemName: string } | null>;
  refreshAllData: () => Promise<void>;
  spinWheel: () => Promise<{ wonPoints: number; rewardPoints: number }>;
  prefilledAmount: string;
  setPrefilledAmount: (val: string) => void;
  t: (key: string, replacements?: { [key: string]: string | number }, langOverride?: string) => string;
  isDarkMode: boolean;
  toggleTheme: () => void;
  C: Theme;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Cross-platform Web/Native LocalStorage Storage helper ---
const storage = {
  get: (key: string): string | null => {
    try { return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null; }
    catch { return null; }
  },
  set: (key: string, val: string): void => {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, val); }
    catch { /* noop */ }
  },
  remove: (key: string): void => {
    try { if (typeof localStorage !== 'undefined') localStorage.removeItem(key); }
    catch { /* noop */ }
  },
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [savingsGullakBalance, setSavingsGullakBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [prefilledAmount, setPrefilledAmount] = useState('');

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const next = !prev;
      storage.set('hb_dark_mode', String(next));
      return next;
    });
  }, []);

  const C = isDarkMode ? darkTheme : lightTheme;

  // --- Localization Lookup Logic ---
  const t = useCallback((key: string, replacements?: { [key: string]: string | number }, langOverride?: string): string => {
    const lang = langOverride || user?.preferredLanguage || 'en';
    const dict = lang === 'hi' ? hi : en;
    let text = (dict as any)[key] || key;
    
    if (replacements) {
      Object.keys(replacements).forEach(k => {
        text = text.replace(new RegExp(`{${k}}`, 'g'), String(replacements[k]));
      });
    }
    return text;
  }, [user?.preferredLanguage]);

  // --- Network API Error Handler ---
  const handleNetworkError = useCallback((error: any, customMessage: string) => {
    console.error(error);
    const message = error.response?.data?.message || error.message || 'Unknown network error';
    
    const title = t('connection_error');
    const body = `${t(customMessage)}: ${message}`;

    if (Platform.OS === 'web') {
      alert(`${title}\n\n${body}`);
    } else {
      Alert.alert(title, body);
    }
  }, [t]);

  // --- Data Fetching Actions ---
  const fetchMonthlyData = useCallback(async () => {
    try {
      const res = await api.get('/api/expenses/monthly');
      if (res.data.success) {
        setExpenses(res.data.expenses);
        if (user) {
          setUser(prev => prev ? { ...prev, monthlyBudget: res.data.monthlyBudget } : null);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch monthly data:', error);
    }
  }, [user]);

  const fetchGullakBalance = useCallback(async () => {
    try {
      const res = await api.get('/api/savings/gullak');
      if (res.data.success) {
        setSavingsGullakBalance(res.data.savingsGullakBalance);
      }
    } catch (error) {
      console.warn('Failed to fetch Gullak balance:', error);
    }
  }, []);

  const fetchReminders = useCallback(async () => {
    try {
      const res = await api.get('/api/reminders');
      if (res.data.success) {
        setReminders(res.data.reminders);
      }
    } catch (error) {
      console.warn('Failed to fetch reminders:', error);
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchMonthlyData(),
      fetchGullakBalance(),
      fetchReminders()
    ]);
    setLoading(false);
  }, [fetchMonthlyData, fetchGullakBalance, fetchReminders]);

  // --- Initialize App State ---
  useEffect(() => {
    const savedTheme = storage.get('hb_dark_mode');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'true');
    }
    const initializeSession = async () => {
      const token = storage.get('hb_token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const res = await api.get('/api/user/profile');
          if (res.data.success) {
            setUser(res.data.user);
            setIsLoggedIn(true);
            setIsFirstTimeUser(res.data.user.isFirstTimeUser);
            
            const monthlyRes = await api.get('/api/expenses/monthly');
            setExpenses(monthlyRes.data.expenses);
            
            const remindersRes = await api.get('/api/reminders');
            setReminders(remindersRes.data.reminders);
            
            const gullakRes = await api.get('/api/savings/gullak');
            setSavingsGullakBalance(gullakRes.data.savingsGullakBalance);
          } else {
            throw new Error('Invalid response');
          }
        } catch (e) {
          console.log('Session restore failed, logging out:', e);
          storage.remove('hb_token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };
    initializeSession();
  }, []);

  // --- Auth Login Actions ---
  const login = useCallback(async (phoneNumber: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const isEmail = phoneNumber.includes('@');
      const payload = isEmail 
        ? { email: phoneNumber, password } 
        : { phone: phoneNumber, password };

      const res = await api.post('/api/auth/login', payload);
      
      if (res.data.success) {
        const { token, user: loggedUser, isFirstTimeUser: onboardFlag } = res.data;
        storage.set('hb_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(loggedUser);
        setIsLoggedIn(true);
        setIsFirstTimeUser(onboardFlag);

        await Promise.all([
          fetchMonthlyData(),
          fetchGullakBalance(),
          fetchReminders()
        ]);
        
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (error) {
      setLoading(false);
      handleNetworkError(error, 'connection_error');
      return false;
    }
  }, [fetchMonthlyData, fetchGullakBalance, fetchReminders, handleNetworkError]);

  const loginWithGoogle = useCallback(async (idToken: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setLoading(true);
      const res = await api.post('/api/auth/google', { idToken });
      
      if (res.data.success) {
        const { token, user: loggedUser, isFirstTimeUser: onboardFlag } = res.data;
        storage.set('hb_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(loggedUser);
        setIsLoggedIn(true);
        setIsFirstTimeUser(onboardFlag);

        await Promise.all([
          fetchMonthlyData(),
          fetchGullakBalance(),
          fetchReminders()
        ]);
        
        setLoading(false);
        return { success: true };
      }
      setLoading(false);
      return { success: false, message: 'Google Sign-in failed' };
    } catch (error: any) {
      setLoading(false);
      const errorMsg = error.response?.data?.message || error.message || 'Google Sign-in failed';
      return { success: false, message: errorMsg };
    }
  }, [fetchMonthlyData, fetchGullakBalance, fetchReminders]);

  const signUp = useCallback(async (phoneNumber: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const isEmail = phoneNumber.includes('@');
      const payload = isEmail 
        ? { email: phoneNumber, password } 
        : { phone: phoneNumber, password };

      const res = await api.post('/api/auth/register', payload);
      
      if (res.data.success) {
        const { token, user: loggedUser, isFirstTimeUser: onboardFlag } = res.data;
        storage.set('hb_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(loggedUser);
        setIsLoggedIn(true);
        setIsFirstTimeUser(onboardFlag);

        await Promise.all([
          fetchMonthlyData(),
          fetchGullakBalance(),
          fetchReminders()
        ]);
        
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [fetchMonthlyData, fetchGullakBalance, fetchReminders]);

  const sendEmailOtp = useCallback(async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.post('/api/auth/send-otp', { email });
      if (res.data.success) {
        return { success: true, message: res.data.message || 'OTP sent successfully' };
      }
      return { success: false, message: res.data.message || 'Failed to send OTP' };
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to send OTP';
      return { success: false, message: msg };
    }
  }, []);

  const verifyEmailOtp = useCallback(async (email: string, otp: string): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true);
      const res = await api.post('/api/auth/verify-otp', { email, otp });
      if (res.data.success) {
        const { token, user: loggedUser, isFirstTimeUser: onboardFlag } = res.data;
        if (token) {
          storage.set('hb_token', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(loggedUser);
          setIsLoggedIn(true);
          setIsFirstTimeUser(onboardFlag);
          await Promise.all([
            fetchMonthlyData(),
            fetchGullakBalance(),
            fetchReminders()
          ]);
        } else if (user) {
          setUser(prev => prev ? { ...prev, isEmailVerified: true } : null);
        }
        setLoading(false);
        return { success: true, message: res.data.message || 'Email verified successfully!' };
      }
      setLoading(false);
      return { success: false, message: res.data.message || 'Verification failed' };
    } catch (error: any) {
      setLoading(false);
      const msg = error.response?.data?.message || error.message || 'Verification failed';
      return { success: false, message: msg };
    }
  }, [fetchMonthlyData, fetchGullakBalance, fetchReminders, user]);

  const logout = useCallback(() => {
    storage.remove('hb_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsLoggedIn(false);
    setIsFirstTimeUser(true);
    setExpenses([]);
    setReminders([]);
    setSavingsGullakBalance(0);
  }, []);

  // --- Profile & Onboarding Actions ---
  const completeOnboarding = useCallback(async (data: { name: string; budgetLimit: string; language: string; currency?: string }) => {
    try {
      setLoading(true);
      const res = await api.put('/api/user/complete-onboarding', {
        name: data.name,
        monthlyBudget: parseInt(data.budgetLimit, 10) || 0,
        preferredLanguage: data.language
      });

      if (res.data.success) {
        setUser(res.data.user);
        setIsFirstTimeUser(false);
        await refreshAllData();
      }
    } catch (error) {
      handleNetworkError(error, 'onboard_title');
    } finally {
      setLoading(false);
    }
  }, [refreshAllData, handleNetworkError]);

  const updateProfile = useCallback(async (data: { 
    name: string; 
    budgetLimit: string; 
    language: string; 
    savingsName?: string; 
    savingsTarget?: string; 
    savingsAchieved?: string; 
  }) => {
    try {
      const res = await api.put('/api/user/profile', {
        name: data.name,
        monthlyBudget: parseInt(data.budgetLimit, 10) || 0,
        preferredLanguage: data.language,
        savingsName: data.savingsName,
        savingsTarget: data.savingsTarget ? parseInt(data.savingsTarget, 10) : undefined,
        savingsAchieved: data.savingsAchieved ? parseInt(data.savingsAchieved, 10) : undefined
      });

      if (res.data.success) {
        setUser(res.data.user);
        await refreshAllData();
      }
    } catch (error) {
      handleNetworkError(error, 'profile_title');
    }
  }, [refreshAllData, handleNetworkError]);

  // --- Expense Action (Automatically syncs monthly aggregates and Gullak balance) ---
  const addExpense = useCallback(async (title: string, amount: string, category: string, type: 'debit' | 'credit' = 'debit') => {
    try {
      const res = await api.post('/api/expenses', {
        itemName: title,
        amount: parseFloat(amount),
        category,
        type,
        notes: title
      });

      if (res.data.success) {
        if (res.data.rewardPoints !== undefined) {
          setUser(prev => prev ? { ...prev, rewardPoints: res.data.rewardPoints } : null);
        }
        await Promise.all([
          fetchMonthlyData(),
          fetchGullakBalance()
        ]);
      }
    } catch (error) {
      handleNetworkError(error, 'add_tx_title');
    }
  }, [fetchMonthlyData, fetchGullakBalance, handleNetworkError]);

  const bulkSaveExpenses = useCallback(async (expensesList: Array<{ amount: number; itemName: string; category: string; date?: string; type?: 'debit' | 'credit' }>): Promise<boolean> => {
    try {
      const res = await api.post('/api/expenses/bulk-save', { expenses: expensesList });
      if (res.data.success) {
        if (res.data.rewardPoints !== undefined) {
          setUser(prev => prev ? { ...prev, rewardPoints: res.data.rewardPoints } : null);
        }
        await Promise.all([
          fetchMonthlyData(),
          fetchGullakBalance()
        ]);
        return true;
      }
      return false;
    } catch (error) {
      handleNetworkError(error, 'add_tx_title');
      return false;
    }
  }, [fetchMonthlyData, fetchGullakBalance, handleNetworkError]);

  const spinWheel = useCallback(async (): Promise<{ wonPoints: number; rewardPoints: number }> => {
    try {
      const res = await api.post('/api/user/spin-wheel');
      if (res.data.success) {
        setUser(res.data.user);
        return {
          wonPoints: res.data.wonPoints,
          rewardPoints: res.data.rewardPoints
        };
      }
      return { wonPoints: 0, rewardPoints: user?.rewardPoints || 0 };
    } catch (error: any) {
      handleNetworkError(error, 'Rewards');
      throw error;
    }
  }, [user, handleNetworkError]);

  // --- Pay Reminder Action (Marks paid and creates expense item, re-fetches dashboard aggregates) ---
  const payReminder = useCallback(async (reminderId: string) => {
    try {
      const res = await api.put(`/api/reminders/${reminderId}/pay`);
      if (res.data.success) {
        await refreshAllData();
      }
    } catch (error) {
      handleNetworkError(error, 'reminders_title');
    }
  }, [refreshAllData, handleNetworkError]);

  // --- AI Voice Parse Action ---
  const voiceParseExpense = useCallback(async (text: string): Promise<{ amount: number; category: string; itemName: string } | null> => {
    try {
      const res = await api.post('/api/expenses/voice-parse', { text });
      if (res.data.success) {
        return {
          amount: res.data.amount,
          category: res.data.category,
          itemName: res.data.itemName
        };
      }
      return null;
    } catch (error) {
      handleNetworkError(error, 'voice_modal_title');
      return null;
    }
  }, [handleNetworkError]);

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        user,
        isFirstTimeUser,
        expenses,
        reminders,
        savingsGullakBalance,
        loading,
        login,
        signUp,
        sendEmailOtp,
        verifyEmailOtp,
        loginWithGoogle,
        logout,
        completeOnboarding,
        updateProfile,
        addExpense,
        bulkSaveExpenses,
        payReminder,
        voiceParseExpense,
        refreshAllData,
        spinWheel,
        prefilledAmount,
        setPrefilledAmount,
        t,
        isDarkMode,
        toggleTheme,
        C
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
