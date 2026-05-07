export type Moeda = "real" | "dolar" | "euro";
export type Idioma = "portugues" | "ingles" | "espanhol";

export interface User {
  id: number;
  nome: string;
  email: string;
  created_at?: string;
  idioma: Idioma;
  moeda: Moeda;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  password: string;
  idioma?: Idioma;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface AuthError {
  message: string;
  statusCode?: number;
}
