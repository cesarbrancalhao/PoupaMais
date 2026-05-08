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
    it('should make a GET request with auth headers', async () => {
      (Cookies.get as jest.Mock).mockReturnValue('test-token');
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
            Authorization: 'Bearer test-token',
          },
        },
      );
      expect(result).toEqual({ data: 'test' });
    });

    it('should make a GET request without auth header when no token', async () => {
      (Cookies.get as jest.Mock).mockReturnValue(null);
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

      await expect(apiService.get('/error')).rejects.toThrow('Erro 500: Internal Server Error');
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
    it('should make a POST request with body', async () => {
      (Cookies.get as jest.Mock).mockReturnValue('token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1, name: 'created' }),
      });

      const result = await apiService.post('/create', { name: 'test' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/create'),
        {
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ name: 'test' }),
        },
      );
      expect(result).toEqual({ id: 1, name: 'created' });
    });
  });

  describe('put', () => {
    it('should make a PUT request', async () => {
      (Cookies.get as jest.Mock).mockReturnValue('token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1, updated: true }),
      });

      const result = await apiService.put('/update/1', { name: 'updated' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/update/1'),
        expect.objectContaining({ method: 'PUT' }),
      );
      expect(result).toEqual({ id: 1, updated: true });
    });
  });

  describe('delete', () => {
    it('should make a DELETE request', async () => {
      (Cookies.get as jest.Mock).mockReturnValue('token');
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ deleted: true }),
      });

      const result = await apiService.delete('/delete/1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/delete/1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(result).toEqual({ deleted: true });
    });
  });
});
