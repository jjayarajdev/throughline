export type UserRole = 'admin' | 'partner' | 'hiring_manager' | 'candidate';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}