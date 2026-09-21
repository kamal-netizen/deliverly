import { describe, it, expect } from 'vitest';
import { parseNextPageInfo } from '@/lib/shopify';

describe('test harness', () => {
  it('resolves the @/ alias', () => {
    expect(typeof parseNextPageInfo).toBe('function');
  });
});
