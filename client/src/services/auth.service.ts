import Cookies from 'js-cookie';
import { apiService } from './api';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

class AuthService {
  async register(data: RegisterRequest): Promise<{ message: string }> {
    try {
      this.validateEmail(data.email);
      this.validatePassword(data.password);
      this.validateName(data.nome);

      const response = await apiService.post<{ message: string }>('/auth/register', data);

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  setAuthDataFromVerification(token: string, user: AuthResponse['user']): void {
    this.setAuthData(token, user);
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      this.validateEmail(data.email);

      const response = await apiService.post<AuthResponse>('/auth/login', data);

      this.setAuthData(response.access_token, response.user);

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  logout(): void {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(USER_KEY);
  }

  getToken(): string | null {
    return Cookies.get(TOKEN_KEY) || null;
  }

  getUser(): User | null {
    const userStr = Cookies.get(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch {
        this.logout();
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.parseJwt(token);
      if (payload.exp) {
        const isExpired = Date.now() >= payload.exp * 1000;
        if (isExpired) {
          this.logout();
          return false;
        }
      }
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  private setAuthData(token: string, user: User): void {
    const sanitizedUser = this.sanitizeUser(user);

    Cookies.set(TOKEN_KEY, token, {
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    Cookies.set(USER_KEY, JSON.stringify(sanitizedUser), {
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
  }

  private parseJwt(token: string): { exp?: number; [key: string]: unknown } {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      throw new Error('Invalid token format');
    }
  }

  private sanitizeUser(user: User): User {
    return {
      id: user.id,
      nome: this.sanitizeString(user.nome),
      email: this.sanitizeString(user.email),
      ...(user.created_at && { created_at: user.created_at }),
      idioma: user.idioma,
      moeda: user.moeda,
    };
  }

  private sanitizeString(str: string): string {
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('Email inválido');
    }
  }

  private validatePassword(password: string): void {
    if (!password || password.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres');
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim().length < 2) {
      throw new Error('Nome deve ter no mínimo 2 caracteres');
    }
  }

  private handleAuthError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error('Erro ao processar a requisição. Tente novamente');
  }
}

export const authService = new AuthService();
