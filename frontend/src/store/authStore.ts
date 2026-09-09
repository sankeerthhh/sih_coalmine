import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedToken = localStorage.getItem('mine_subsidence_token');
  const savedUser = localStorage.getItem('mine_subsidence_user');

  // Only restore session if a real JWT token was previously saved
  const isValidSession = Boolean(savedToken && savedToken !== 'demo-admin-token' && savedUser);

  return {
    user: isValidSession ? JSON.parse(savedUser!) : null,
    token: isValidSession ? savedToken : null,
    isAuthenticated: isValidSession,

    login: (token: string, user: User) => {
      localStorage.setItem('mine_subsidence_token', token);
      localStorage.setItem('mine_subsidence_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem('mine_subsidence_token');
      localStorage.removeItem('mine_subsidence_user');
      set({ token: null, user: null, isAuthenticated: false });
    }
  };
});
