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

const validJwtPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, sub: 1 }));
const validJwtToken = `header.${validJwtPayload}.signature`;

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
        password: 'password123',
      });

      expect(result).toEqual({ message: 'User registered' });
      expect(apiService.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should throw on invalid email', async () => {
      await expect(
        authService.register({
          name: 'Test',
          email: 'invalid-email',
          password: 'password123',
        }),
      ).rejects.toThrow('Invalid email');
    });

    it('should throw on short password', async () => {
      await expect(
        authService.register({
          name: 'Test',
          email: 'test@example.com',
          password: '12345',
        }),
      ).rejects.toThrow('Password must be at least 6 characters');
    });

    it('should throw on short name', async () => {
      await expect(
        authService.register({
          name: 'A',
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Name must be at least 2 characters');
    });
  });

  describe('login', () => {
    it('should login and store auth data', async () => {
      const authResponse: AuthResponse = {
        access_token: 'test-token',
        user: mockUser,
      };
      (apiService.post as jest.Mock).mockResolvedValue(authResponse);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(authResponse);
      expect(Cookies.set).toHaveBeenCalledTimes(2);
      expect(Cookies.set).toHaveBeenCalledWith('token', 'test-token', expect.any(Object));
    });
  });

  describe('logout', () => {
    it('should remove token and user cookies', () => {
      authService.logout();

      expect(Cookies.remove).toHaveBeenCalledWith('token');
      expect(Cookies.remove).toHaveBeenCalledWith('user');
    });
  });

  describe('getToken', () => {
    it('should return token from cookies', () => {
      (Cookies.get as jest.Mock).mockReturnValue('my-token');

      expect(authService.getToken()).toBe('my-token');
    });

    it('should return null when no token', () => {
      (Cookies.get as jest.Mock).mockReturnValue(undefined);

      expect(authService.getToken()).toBeNull();
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

    it('should return null and logout on invalid JSON', () => {
      (Cookies.get as jest.Mock).mockReturnValue('invalid-json');

      const user = authService.getUser();

      expect(user).toBeNull();
      expect(Cookies.remove).toHaveBeenCalledWith('token');
      expect(Cookies.remove).toHaveBeenCalledWith('user');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true for valid non-expired token', () => {
      (Cookies.get as jest.Mock).mockReturnValue(validJwtToken);

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      (Cookies.get as jest.Mock).mockReturnValue(undefined);

      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return false and logout for expired token', () => {
      const expiredPayload = btoa(JSON.stringify({ exp: 1, sub: 1 }));
      const expiredToken = `header.${expiredPayload}.signature`;

      (Cookies.get as jest.Mock).mockReturnValue(expiredToken);

      expect(authService.isAuthenticated()).toBe(false);
      expect(Cookies.remove).toHaveBeenCalled();
    });
  });

  describe('setAuthDataFromVerification', () => {
    it('should set auth data from verification', () => {
      authService.setAuthDataFromVerification('verify-token', mockUser);

      expect(Cookies.set).toHaveBeenCalledWith('token', 'verify-token', expect.any(Object));
      expect(Cookies.set).toHaveBeenCalledWith('user', expect.any(String), expect.any(Object));
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
