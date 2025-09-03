export interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  groups: number[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  message: string;
}