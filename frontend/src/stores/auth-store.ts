import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { accessToken } = response.data;

          localStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return api(originalRequest);
        } catch (refreshError: any) {
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('workspaces');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
}

interface AuthState {
  user: User | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  googleLogin: () => void;
  handleGoogleCallback: (token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace) => void;
  fetchUserData: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      workspaces: [],
      currentWorkspace: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, workspaces, accessToken, refreshToken } = response.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('workspaces', JSON.stringify(workspaces));

          set({
            user,
            workspaces,
            currentWorkspace: workspaces[0],
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/register', { email, password, name });
          const { user, workspace, accessToken, refreshToken } = response.data;

          const workspaces = [workspace];

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('workspaces', JSON.stringify(workspaces));

          set({
            user,
            workspaces,
            currentWorkspace: workspace,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      googleLogin: () => {
        window.location.href = `${API_URL}/auth/google`;
      },

      handleGoogleCallback: async (token: string, refreshToken: string) => {
        set({ isLoading: true });
        try {
          localStorage.setItem('accessToken', token);
          localStorage.setItem('refreshToken', refreshToken);

          // Get user data
          const response = await api.get('/auth/me');
          const { user, workspaces } = response.data;

          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('workspaces', JSON.stringify(workspaces));

          set({
            user,
            workspaces,
            currentWorkspace: workspaces[0],
            accessToken: token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false
          });

          // Redirect to workspace dashboard
          window.location.href = `/workspace/${workspaces[0].slug}/dashboard`;
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          const refreshToken = get().refreshToken;
          if (refreshToken) {
            await api.post('/auth/logout', { refreshToken }).catch(() => {});
          }
        } catch (error: any) {
          console.error('Logout error:', error);
        } finally {
          localStorage.clear();
          set({
            user: null,
            workspaces: [],
            currentWorkspace: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false
          });
          window.location.href = '/login';
        }
      },

      setCurrentWorkspace: (workspace: Workspace) => {
        set({ currentWorkspace: workspace });
        localStorage.setItem('currentWorkspace', JSON.stringify(workspace));
      },

      fetchUserData: async () => {
        try {
          const response = await api.get('/auth/me');
          const { user, workspaces } = response.data;

          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('workspaces', JSON.stringify(workspaces));

          const savedWorkspace = localStorage.getItem('currentWorkspace');
          const currentWorkspace = savedWorkspace
            ? JSON.parse(savedWorkspace)
            : workspaces[0];

          set({
            user,
            workspaces,
            currentWorkspace,
            accessToken: localStorage.getItem('accessToken'),
            refreshToken: localStorage.getItem('refreshToken'),
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          set({ isLoading: false });
          // If 401, clear storage and redirect
          if (error.response?.status === 401) {
            localStorage.clear();
            set({
              user: null,
              workspaces: [],
              currentWorkspace: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false
            });
            window.location.href = '/login';
          }
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        workspaces: state.workspaces,
        currentWorkspace: state.currentWorkspace,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
        }
      }
    }
  )
);
