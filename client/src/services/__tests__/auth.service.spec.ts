import { authService } from '../auth.service';
import { apiService } from '../api';
import Cookies from 'js-cookie';
import { AuthResponse, User } from '../../types/auth';

jest.mock('../api', () => ({
  apiService: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('js-cookie', () => ({
  get: jest.fn(),
  remove: jest.fn(),
  set: jest.fn(),
}));

const mockUser: User = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  language: 'portuguese',
  currency: 'real',
};

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      (apiService.post as jest.Mock).mockResolvedValue({ message: 'User registered' });

      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Passw0rd!',
      });

      expect(result).toEqual({ message: 'User registered' });
      expect(apiService.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Passw0rd!',
      });
    });

    it('should throw on invalid email', async () => {
      await expect(
        authService.register({
          name: 'Test',
          email: 'invalid-email',
          password: 'Passw0rd!',
        }),
      ).rejects.toThrow('Invalid email');
    });

    it('should throw on short password', async () => {
      await expect(
        authService.register({
          name: 'Test',
          email: 'test@example.com',
          password: 'Aa1!',
        }),
      ).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should throw on password missing complexity', async () => {
      await expect(
        authService.register({
          name: 'Test',
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(/uppercase|lowercase|digit|special/);
    });

    it('should throw on short name', async () => {
      await expect(
        authService.register({
          name: 'A',
          email: 'test@example.com',
          password: 'Passw0rd!',
        }),
      ).rejects.toThrow('Name must be at least 2 characters');
    });
  });

  describe('login', () => {
    it('should login and store user cookie', async () => {
      const authResponse: AuthResponse = {
        access_token: 'test-token',
        user: mockUser,
      };
      (apiService.post as jest.Mock).mockResolvedValue(authResponse);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Passw0rd!',
      });

      expect(result).toEqual(authResponse);
      expect(Cookies.set).toHaveBeenCalledWith('user', expect.any(String), expect.any(Object));
      expect(Cookies.set).not.toHaveBeenCalledWith('token', expect.anything(), expect.anything());
    });
  });

  describe('logout', () => {
    it('should call server logout and remove client cookies', async () => {
      (apiService.post as jest.Mock).mockResolvedValue({ message: 'Logged out' });

      await authService.logout();

      expect(apiService.post).toHaveBeenCalledWith('/auth/logout', {});
      expect(Cookies.remove).toHaveBeenCalledWith('user');
      expect(Cookies.remove).toHaveBeenCalledWith('csrf_token');
    });

    it('should still clear cookies if server call fails', async () => {
      (apiService.post as jest.Mock).mockRejectedValue(new Error('network'));

      await authService.logout();

      expect(Cookies.remove).toHaveBeenCalledWith('user');
    });
  });

  describe('getUser', () => {
    it('should return parsed user from cookies', () => {
      (Cookies.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      const user = authService.getUser();

      expect(user).toEqual(mockUser);
    });

    it('should return null and remove cookie on invalid JSON', () => {
      (Cookies.get as jest.Mock).mockReturnValue('invalid-json');

      const user = authService.getUser();

      expect(user).toBeNull();
      expect(Cookies.remove).toHaveBeenCalledWith('user');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user cookie exists', () => {
      (Cookies.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no user cookie', () => {
      (Cookies.get as jest.Mock).mockReturnValue(undefined);

      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('refreshUser', () => {
    it('should refresh user from /auth/me endpoint', async () => {
      (apiService.get as jest.Mock).mockResolvedValue(mockUser);

      const user = await authService.refreshUser();

      expect(apiService.get).toHaveBeenCalledWith('/auth/me');
      expect(user).toEqual(mockUser);
      expect(Cookies.set).toHaveBeenCalledWith('user', expect.any(String), expect.any(Object));
    });

    it('should return null and clear cookies if /auth/me fails', async () => {
      (apiService.get as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      const user = await authService.refreshUser();

      expect(user).toBeNull();
      expect(Cookies.remove).toHaveBeenCalledWith('user');
      expect(Cookies.remove).toHaveBeenCalledWith('csrf_token');
    });
  });

  describe('setAuthDataFromVerification', () => {
    it('should set user cookie (token is set server-side as httpOnly)', () => {
      authService.setAuthDataFromVerification('ignored', mockUser);

      expect(Cookies.set).toHaveBeenCalledWith('user', expect.any(String), expect.any(Object));
      expect(Cookies.set).not.toHaveBeenCalledWith('token', expect.anything(), expect.anything());
    });
  });

  describe('sanitization', () => {
    it('should sanitize user data with XSS prevention', () => {
      const maliciousUser: User = {
        id: 1,
        name: '<script>alert("xss")</script>',
        email: 'test@test.com',
        language: 'portuguese',
        currency: 'real',
      };
      authService.setAuthDataFromVerification('verify-token', maliciousUser);

      const userCall = (Cookies.set as jest.Mock).mock.calls.find(
        (call: string[]) => call[0] === 'user',
      );
      expect(userCall).toBeDefined();
      const storedUser = JSON.parse(userCall![1]);
      expect(storedUser.name).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });
  });
});
