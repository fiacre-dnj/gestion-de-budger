import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  currency?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Category {
  _id: string;
  name: string;
  type: 'income' | 'expense';
  userId: string;
  isDefault: boolean;
  monthlyBudget?: number;
}

export interface Wallet {
  _id: string;
  name: string;
  type: 'bank' | 'cash' | 'savings';
  initialBalance: number;
  currentBalance?: number;
}

export interface Transaction {
  _id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category?: Category;
  walletId: string;
  toWalletId?: string;
  date: string;
  description?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { name, email, password }),
  
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  
  logoutAll: () =>
    api.post('/auth/logout-all'),
  
  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),
  
  getMe: () =>
    api.get<User>('/auth/me'),

  getProfile: () =>
    api.get<User & { currency: string }>('/users/profile'),

  updateSettings: (settings: { currency?: string }) =>
    api.patch('/users/settings', settings),

  updateProfile: (data: { name?: string; password?: string }) =>
    api.patch<User>('/users/profile', data),

  verifyPassword: (password: string) =>
    api.post<{ isValid: boolean }>('/users/verify-password', { password }),
};

// Currencies API
export const currenciesApi = {
  getRates: () =>
    api.get<Record<string, number>>('/currencies/rates'),
};

// Categories API
export const categoriesApi = {
  getAll: (type?: string) =>
    api.get<Category[]>('/categories', { params: { type } }),
  
  getById: (id: string) =>
    api.get<Category>(`/categories/${id}`),
  
  create: (data: Partial<Category>) =>
    api.post<Category>('/categories', data),
  
  update: (id: string, data: Partial<Category>) =>
    api.patch<Category>(`/categories/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/categories/${id}`),
};

// Transactions API
export const transactionsApi = {
  getAll: (params?: { type?: string; category?: string; walletId?: string; startDate?: string; endDate?: string }) =>
    api.get<Transaction[]>('/transactions', { params }),
  
  getById: (id: string) =>
    api.get<Transaction>(`/transactions/${id}`),
  
  create: (data: {
    title: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    walletId?: string;
    date: string;
    description?: string;
  }) => api.post<Transaction>('/transactions', data),
  
  createBulk: (data: any[]) => api.post<Transaction[]>('/transactions/bulk', data),
  
  update: (id: string, data: Partial<Transaction>) =>
    api.patch<Transaction>(`/transactions/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/transactions/${id}`),
  
  getSummary: (walletId?: string) =>
    api.get<TransactionSummary>('/transactions/summary', { params: { walletId } }),
  
  export: (params?: { type?: string; startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const url = `${API_URL}/transactions/export?${queryParams.toString()}`;
    const token = localStorage.getItem('accessToken');
    
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Analysis API
export interface MonthlyAnalysis {
  month: number;
  year: number;
  totals: {
    income: number;
    expenses: number;
    balance: number;
  };
  prediction: {
    endOfMonthBalance: number;
  };
  categoryBreakdown: Array<{
    name: string;
    amount: number;
    type: 'income' | 'expense';
    monthlyBudget?: number;
  }>;
  comparison: {
    prevMonthExpenses: number;
    diffPercentage: number;
  };
}

export interface AnnualAnalysis {
  month: number;
  income: number;
  expenses: number;
}

export interface FinancialHealth {
  rule503020: {
    needsPct: number;
    wantsPct: number;
    savingsPct: number;
  };
  remainingToLive: number;
  topExpenses: Array<{
    name: string;
    amount: number;
  }>;
  tips: Array<{
    title: string;
    message: string;
    type: 'success' | 'warning' | 'info';
  }>;
}

export const analysisApi = {
  getMonthly: (month: number, year: number, walletId?: string) =>
    api.get<MonthlyAnalysis>('/analysis/monthly', { params: { month, year, walletId } }),
  getAnnual: (year: number, walletId?: string) =>
    api.get<AnnualAnalysis[]>('/analysis/annual', { params: { year, walletId } }),
  getHealth: () =>
    api.get<FinancialHealth>('/analysis/health'),
};

// Wallets API
export const walletsApi = {
  getAll: () =>
    api.get<Wallet[]>('/wallets'),
  create: (data: Partial<Wallet>) =>
    api.post<Wallet>('/wallets', data),
  update: (id: string, data: Partial<Wallet>) =>
    api.patch<Wallet>(`/wallets/${id}`, data),
  delete: (id: string) =>
    api.delete(`/wallets/${id}`),
};

// Savings API
export interface SavingGoal {
  _id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
  category: string;
  estimatedDate?: string;
  monthlySpeed?: number;
}

export const savingsApi = {
  getGoals: () =>
    api.get<SavingGoal[]>('/savings/goals'),
  createGoal: (data: Partial<SavingGoal>) =>
    api.post<SavingGoal>('/savings/goals', data),
  updateGoal: (id: string, data: Partial<SavingGoal>) =>
    api.patch<SavingGoal>(`/savings/goals/${id}`, data),
  deleteGoal: (id: string) =>
    api.delete(`/savings/goals/${id}`),
  addContribution: (id: string, amount: number) =>
    api.post<SavingGoal>(`/savings/goals/${id}/contribute`, { amount }),
};

// Subscriptions API
export interface Subscription {
  _id: string;
  name: string;
  amount: number;
  categoryId: Category;
  walletId: Wallet;
  billingDate: number;
  isActive: boolean;
  description?: string;
}

export const subscriptionsApi = {
  getAll: () =>
    api.get<Subscription[]>('/subscriptions'),
  getSummary: () =>
    api.get<{ totalMonthly: number; count: number; nextPayments: Subscription[] }>('/subscriptions/summary'),
  create: (data: any) =>
    api.post<Subscription>('/subscriptions', data),
  update: (id: string, data: any) =>
    api.patch<Subscription>(`/subscriptions/${id}`, data),
  delete: (id: string) =>
    api.delete(`/subscriptions/${id}`),
};

export const importApi = {
  uploadCsv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<any[]>('/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const reportsApi = {
  getMonthly: (month: number, year: number) =>
    api.get<any>('/reports/monthly', { params: { month, year } }),
  getAnnual: (year: number) =>
    api.get<any>('/reports/annual', { params: { year } }),
};

export interface AiChatAction {
  tool: string;
  success: boolean;
  summary?: string;
}

export interface AiChatResponse {
  reply: string;
  conversationId: string;
  actions: AiChatAction[];
  provider: string;
}

export interface AiProviderInfo {
  provider: string | null;
  configured: boolean;
  hint?: string;
}

export const aiApi = {
  chat: (message: string, conversationId?: string) =>
    api.post<AiChatResponse>('/ai/chat', { message, conversationId }),
  getProvider: () => api.get<AiProviderInfo>('/ai/provider'),
  listConversations: () =>
    api.get<{ _id: string; title: string; updatedAt: string }[]>('/ai/conversations'),
};

export default api;
