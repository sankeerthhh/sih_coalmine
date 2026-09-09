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

  return {
    user: savedUser ? JSON.parse(savedUser) : {
      id: 1,
      email: 'admin@coal.gov.in',
      full_name: 'Mine Safety Officer (SECL)',
      role: 'ADMIN'
    },
    token: savedToken || 'demo-admin-token',
    isAuthenticated: true, // Default to true for smooth immediate demo, can be logged out

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
