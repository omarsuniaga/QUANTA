import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cacheManager } from './cacheManager';
import { geminiRateLimiter } from '../services/apiRateLimiter';
import { storageService } from '../services/storageService';

// Mock dependencies
vi.mock('../services/apiRateLimiter', () => ({
  geminiRateLimiter: {
    clearCache: vi.fn()
  }
}));

vi.mock('../services/storageService', () => ({
  storageService: {
    clearLocalData: vi.fn()
  }
}));

describe('cacheManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should clear all keys that match CACHE_PATTERNS when no userId is provided', () => {
    localStorage.setItem('quanta_ai_test', 'data');
    localStorage.setItem('gemini_test', 'data');
    localStorage.setItem('other_key', 'keep_me');

    cacheManager.clearUserCache();

    expect(localStorage.getItem('quanta_ai_test')).toBeNull();
    expect(localStorage.getItem('gemini_test')).toBeNull();
    expect(localStorage.getItem('other_key')).toBe('keep_me');
    expect(geminiRateLimiter.clearCache).toHaveBeenCalled();
    expect(storageService.clearLocalData).toHaveBeenCalled();
  });

  it('should only clear keys containing userId when userId is provided', () => {
    const userA = 'user_A';
    const userB = 'user_B';
    
    localStorage.setItem(`quanta_ai_${userA}_key`, 'dataA');
    localStorage.setItem(`quanta_ai_${userB}_key`, 'dataB');

    cacheManager.clearUserCache(userA);

    expect(localStorage.getItem(`quanta_ai_${userA}_key`)).toBeNull();
    expect(localStorage.getItem(`quanta_ai_${userB}_key`)).toBe('dataB');
  });

  it('should detect user change and trigger cleanup', () => {
    const userA = 'user_A';
    const userB = 'user_B';
    
    // First session
    cacheManager.handleUserSessionTransition(userA);
    expect(localStorage.getItem('quanta_last_session_user')).toBe(userA);

    // Second session with change
    localStorage.setItem(`quanta_ai_${userA}_key`, 'dataA');
    cacheManager.handleUserSessionTransition(userB);

    expect(localStorage.getItem(`quanta_ai_${userA}_key`)).toBeNull();
    expect(localStorage.getItem('quanta_last_session_user')).toBe(userB);
  });

  it('should not clear anything if same user logs in again', () => {
    const userA = 'user_A';
    localStorage.setItem(`quanta_ai_${userA}_key`, 'dataA');
    
    cacheManager.handleUserSessionTransition(userA);
    cacheManager.handleUserSessionTransition(userA);

    expect(localStorage.getItem(`quanta_ai_${userA}_key`)).toBe('dataA');
  });
});
