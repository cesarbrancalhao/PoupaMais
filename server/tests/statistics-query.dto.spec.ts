import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { StatisticsQueryDto } from '../src/statistics/dto/statistics-query.dto';

describe('StatisticsQueryDto', () => {
  it('accepts a comma-separated list of integers for categories', async () => {
    const dto = plainToInstance(StatisticsQueryDto, { categories: '1,2,3' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a single integer for goals', async () => {
    const dto = plainToInstance(StatisticsQueryDto, { goals: '42' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects non-numeric categories values', async () => {
    const dto = plainToInstance(StatisticsQueryDto, { categories: '1,abc' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects sql-injection-like input in goals', async () => {
    const dto = plainToInstance(StatisticsQueryDto, { goals: "1' OR '1'='1" });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects trailing comma', async () => {
    const dto = plainToInstance(StatisticsQueryDto, { categories: '1,2,' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
