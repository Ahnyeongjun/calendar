export interface User {
  id: string;
  username: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}
