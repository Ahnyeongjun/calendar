export interface User {
  id: string;
  username: string;
  password?: string; // Optional for security reasons
  name: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Schedule {
  id: string;
  title: string;
  description?: string;
  date: Date;
  start_time?: string;
  end_time?: string;
  status: 'planned' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  project_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface AuthResult {
  user: Omit<User, 'password'>;
  token: string;
}

export interface JwtPayload {
  id: string;
  username: string;
  name: string;
  iat?: number;
  exp?: number;
}