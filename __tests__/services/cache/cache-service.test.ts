import { cacheService, resetCacheService } from '../../../services/cache/service';

describe('CacheService background cleanup', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Date, 'now').mockReturnValue(0);
    cacheService.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    resetCacheService();
  });

  it('removes expired entries automatically', () => {
    (Date.now as jest.Mock).mockReturnValue(0);
    cacheService.set('foo', 'bar', 'memory', 1000);
    expect(cacheService.size()).toBe(1);

    (Date.now as jest.Mock).mockReturnValue(1000);
    jest.advanceTimersByTime(60000);

    expect(cacheService.size()).toBe(0);
  });
});
