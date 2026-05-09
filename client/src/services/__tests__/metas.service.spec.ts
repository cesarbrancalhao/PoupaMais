import { goalsService } from '../goals.service';
import { apiService } from '../api';

jest.mock('../api', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('GoalsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGoals', () => {
    it('should fetch goals list', async () => {
      const mockGoals = {
        data: [{ id: 1, name: 'Goal 1', value: 1000 }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      (apiService.get as jest.Mock).mockResolvedValue(mockGoals);

      const result = await goalsService.getGoals(1, 20);

      expect(result).toEqual(mockGoals);
      expect(apiService.get).toHaveBeenCalledWith('/goals?page=1&limit=20');
    });
  });

  describe('getGoal', () => {
    it('should fetch a single goal', async () => {
      const mockGoal = { id: 1, name: 'Trip', value: 5000 };
      (apiService.get as jest.Mock).mockResolvedValue(mockGoal);

      const result = await goalsService.getGoal(1);

      expect(result).toEqual(mockGoal);
      expect(apiService.get).toHaveBeenCalledWith('/goals/1');
    });
  });

  describe('createGoal', () => {
    it('should create a new goal', async () => {
      const createDto = { name: 'New Goal', value: 3000, description: 'Desc' };
      (apiService.post as jest.Mock).mockResolvedValue(null);

      await goalsService.createGoal(createDto);

      expect(apiService.post).toHaveBeenCalledWith('/goals', createDto);
    });
  });

  describe('updateGoal', () => {
    it('should update a goal', async () => {
      const updateDto = { name: 'Updated Goal' };
      const mockUpdated = { id: 1, name: 'Updated Goal', value: 5000 };
      (apiService.put as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await goalsService.updateGoal(1, updateDto);

      expect(result).toEqual(mockUpdated);
      expect(apiService.put).toHaveBeenCalledWith('/goals/1', updateDto);
    });
  });

  describe('deleteGoal', () => {
    it('should delete a goal', async () => {
      (apiService.delete as jest.Mock).mockResolvedValue(null);

      await goalsService.deleteGoal(1);

      expect(apiService.delete).toHaveBeenCalledWith('/goals/1');
    });
  });
});
