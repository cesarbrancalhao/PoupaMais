import { metasService } from '../metas.service';
import { apiService } from '../api';

jest.mock('../api', () => ({
  apiService: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('metasService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch paginated metas', async () => {
      const mockResponse = {
        data: [{ id: 1, nome: 'Meta 1', valor: 1000 }],
        total: 1,
        page: 1,
        limit: 100,
      };
      (apiService.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await metasService.getAll();

      expect(apiService.get).toHaveBeenCalledWith('/metas?page=1&limit=100');
      expect(result).toEqual(mockResponse);
    });

    it('should use custom page and limit', async () => {
      (apiService.get as jest.Mock).mockResolvedValue({ data: [], total: 0, page: 2, limit: 10 });

      const result = await metasService.getAll(2, 10);

      expect(apiService.get).toHaveBeenCalledWith('/metas?page=2&limit=10');
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });
  });

  describe('getById', () => {
    it('should fetch a single meta by id', async () => {
      const mockMeta = { id: 1, nome: 'Viagem', valor: 5000 };
      (apiService.get as jest.Mock).mockResolvedValue(mockMeta);

      const result = await metasService.getById(1);

      expect(apiService.get).toHaveBeenCalledWith('/metas/1');
      expect(result).toEqual(mockMeta);
    });
  });

  describe('create', () => {
    it('should create a new meta', async () => {
      const createDto = { nome: 'Nova Meta', valor: 3000, descricao: 'Desc' };
      const mockCreated = { id: 2, ...createDto };
      (apiService.post as jest.Mock).mockResolvedValue(mockCreated);

      const result = await metasService.create(createDto);

      expect(apiService.post).toHaveBeenCalledWith('/metas', createDto);
      expect(result).toEqual(mockCreated);
    });
  });

  describe('update', () => {
    it('should update an existing meta', async () => {
      const updateDto = { nome: 'Meta Atualizada' };
      const mockUpdated = { id: 1, nome: 'Meta Atualizada', valor: 5000 };
      (apiService.put as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await metasService.update(1, updateDto);

      expect(apiService.put).toHaveBeenCalledWith('/metas/1', updateDto);
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('delete', () => {
    it('should delete a meta by id', async () => {
      (apiService.delete as jest.Mock).mockResolvedValue(undefined);

      await metasService.delete(1);

      expect(apiService.delete).toHaveBeenCalledWith('/metas/1');
    });
  });
});
