'use client';

import { create } from 'zustand';
import type { UserSession } from '@/lib/types';

interface UserStore {
  user: UserSession | null;
  setUser: (user: UserSession) => void;
  clearUser: () => void;
}

export const useUser = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));

export function createRoleSession(user: Pick<UserSession, 'name' | 'email' | 'firmName' | 'role'>) {
  document.cookie = `inspektiq-role=${encodeURIComponent(user.role)}; path=/`;
  document.cookie = `inspektiq-name=${encodeURIComponent(user.name)}; path=/`;
  document.cookie = `inspektiq-email=${encodeURIComponent(user.email)}; path=/`;
  document.cookie = `inspektiq-firm=${encodeURIComponent(user.firmName)}; path=/`;
}

export function clearRoleSession() {
  const expired = 'Max-Age=0; path=/';
  document.cookie = `inspektiq-role=; ${expired}`;
  document.cookie = `inspektiq-name=; ${expired}`;
  document.cookie = `inspektiq-email=; ${expired}`;
  document.cookie = `inspektiq-firm=; ${expired}`;
}
