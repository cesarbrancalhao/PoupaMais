import Cookies from 'js-cookie';
import { apiService } from './api';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';
import {
  PASSWORD_COMPLEXITY_MESSAGE,
  PASSWORD_COMPLEXITY_REGEX,
  PASSWORD_MIN_LENGTH,
} from '../utils/password';

const USER_KEY = 'user';
const CSRF_COOKIE_NAME = 'csrf_token';

class AuthService {
  async register(data: RegisterRequest): Promise<{ message: string }> {
    try {
      this.validateEmail(data.email);
      this.validatePassword(data.password);
      this.validateName(data.name);

      const response = await apiService.post<{ message: string }>('/auth/register', data);

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  setAuthDataFromVerification(_token: string, user: AuthResponse['user']): void {
    this.setUserCookie(user);
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      this.validateEmail(data.email);

      const response = await apiService.post<AuthResponse>('/auth/login', data);

      this.setUserCookie(response.user);

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout', {});
    } catch {
      /* ignore network errors on logout */
    }
    Cookies.remove(USER_KEY);
    Cookies.remove(CSRF_COOKIE_NAME);
  }

  getUser(): User | null {
    const userStr = Cookies.get(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch {
        Cookies.remove(USER_KEY);
        return null;
      }
    }
    return null;
  }

  async refreshUser(): Promise<User | null> {
    try {
      const user = await apiService.get<User>('/auth/me');
      this.setUserCookie(user);
      return user;
    } catch {
      Cookies.remove(USER_KEY);
      Cookies.remove(CSRF_COOKIE_NAME);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getUser();
  }

  private setUserCookie(user: User): void {
    const sanitizedUser = this.sanitizeUser(user);
    const secure = process.env.NODE_ENV === 'production';

    Cookies.set(USER_KEY, JSON.stringify(sanitizedUser), {
      expires: 7,
      secure,
      sameSite: 'strict',
      path: '/',
    });
  }

  private sanitizeUser(user: User): User {
    return {
      id: user.id,
      name: this.sanitizeString(user.name),
      email: this.sanitizeString(user.email),
      ...(user.created_at && { created_at: user.created_at }),
      language: user.language,
      currency: user.currency,
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
      throw new Error('Invalid email');
    }
  }

  private validatePassword(password: string): void {
    if (!password || password.length < PASSWORD_MIN_LENGTH) {
      throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }
    if (!PASSWORD_COMPLEXITY_REGEX.test(password)) {
      throw new Error(PASSWORD_COMPLEXITY_MESSAGE);
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
  }

  private handleAuthError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error('Error processing request. Please try again');
  }
}

export const authService = new AuthService();
