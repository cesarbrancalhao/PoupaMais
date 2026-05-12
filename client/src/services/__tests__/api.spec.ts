import { apiService } from '../api';
import Cookies from 'js-cookie';

global.fetch = jest.fn();
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  remove: jest.fn(),
  set: jest.fn(),
}));

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should make a GET request with credentials and no CSRF header', async () => {
      (Cookies.get as jest.Mock).mockReturnValue('csrf-abc');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      const result = await apiService.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        },
      );
      expect(result).toEqual({ data: 'test' });
    });

    it('should throw on non-ok response', async () => {
      (Cookies.get as jest.Mock).mockReturnValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Resource not found' }),
      });

      await expect(apiService.get('/missing')).rejects.toThrow('Resource not found');
    });

    it('should handle error response without json body', async () => {
      (Cookies.get as jest.Mock).mockReturnValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Not JSON');
        },
      });

      await expect(apiService.get('/error')).rejects.toThrow('Error 500: Internal Server Error');
    });

    it('should join array error messages', async () => {
      (Cookies.get as jest.Mock).mockReturnValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: ['Error 1', 'Error 2'] }),
      });

      await expect(apiService.get('/validation')).rejects.toThrow('Error 1, Error 2');
    });
  });

  describe('post', () => {
    it('should make a POST request with body, credentials, and CSRF header', async () => {
      (Cookies.get as jest.Mock).mockImplementation((key: string) =>
        key === 'csrf_token' ? 'csrf-token-value' : null,
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1, name: 'created' }),
      });

      const result = await apiService.post('/create', { name: 'test' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/create'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'csrf-token-value',
          },
          credentials: 'include',
          body: JSON.stringify({ name: 'test' }),
        },
      );
      expect(result).toEqual({ id: 1, name: 'created' });
    });

    it('should omit CSRF header when cookie is missing', async () => {
      (Cookies.get as jest.Mock).mockReturnValue(undefined);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await apiService.post('/x', {});

      const lastCall = (global.fetch as jest.Mock).mock.calls.pop();
      expect(lastCall?.[1].headers).toEqual({ 'Content-Type': 'application/json' });
    });
  });

  describe('put', () => {
    it('should make a PUT request', async () => {
      (Cookies.get as jest.Mock).mockReturnValue('csrf');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1, updated: true }),
      });

      const result = await apiService.put('/update/1', { name: 'updated' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/update/1'),
        expect.objectContaining({ method: 'PUT', credentials: 'include' }),
      );
      expect(result).toEqual({ id: 1, updated: true });
    });
  });

  describe('delete', () => {
    it('should make a DELETE request', async () => {
      (Cookies.get as jest.Mock).mockReturnValue('csrf');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ deleted: true }),
      });

      const result = await apiService.delete('/delete/1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/delete/1'),
        expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
      );
      expect(result).toEqual({ deleted: true });
    });
  });
});
