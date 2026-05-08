export type Currency = "real" | "dollar" | "euro";
export type Language = "portuguese" | "english" | "spanish";

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  language: Language;
  currency: Currency;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  language?: Language;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface AuthError {
  message: string;
  statusCode?: number;
}
