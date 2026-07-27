import { describe, it, expect } from 'vitest';
import {
  encodeCursor,
  decodeCursor,
  parseCursorPaginationParams,
  createCursorPaginationMeta,
  createCursorPaginatedResponse,
} from '@/lib/api-helpers';
import {
  createTransactionCursor,
  encodeTransactionCursor,
  decodeCursor as decodeCursorUtil,
} from '@/lib/cursor-pagination';
import type { CursorData } from '@/lib/api-helpers';

// ============================================
// TEST SUITE: Cursor Encoding/Decoding
// ============================================

describe('Cursor Pagination', () => {

  describe('encodeCursor', () => {
    it('should encode cursor data to base64url string', () => {
      // Arrange
      const cursorData: CursorData = {
        id: 'tx-123',
        createdAt: '2026-06-10T12:00:00.000Z',
      };

      // Act
      const encoded = encodeCursor(cursorData);

      // Assert
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
      // Base64url should not contain +, /, or =
      expect(encoded).not.toMatch(/[+/=]/);
    });

    it('should produce different strings for different data', () => {
      // Arrange
      const cursor1: CursorData = { id: 'tx-1', createdAt: '2026-06-10T00:00:00.000Z' };
      const cursor2: CursorData = { id: 'tx-2', createdAt: '2026-06-10T00:00:00.000Z' };

      // Act
      const encoded1 = encodeCursor(cursor1);
      const encoded2 = encodeCursor(cursor2);

      // Assert
      expect(encoded1).not.toBe(encoded2);
    });

    it('should handle cursor with sort field', () => {
      // Arrange
      const cursorData: CursorData = {
        id: 'tx-123',
        createdAt: '2026-06-10T12:00:00.000Z',
        sortField: 'amount_desc',
      };

      // Act
      const encoded = encodeCursor(cursorData);
      const decoded = decodeCursor(encoded);

      // Assert
      expect(decoded?.sortField).toBe('amount_desc');
    });
  });

  describe('decodeCursor', () => {
    it('should decode valid cursor string', () => {
      // Arrange
      const original: CursorData = {
        id: 'tx-456',
        createdAt: '2026-07-15T08:30:00.000Z',
      };
      const encoded = encodeCursor(original);

      // Act
      const decoded = decodeCursor(encoded);

      // Assert
      expect(decoded).toEqual(original);
    });

    it('should return null for invalid base64', () => {
      // Arrange
      const invalidCursor = 'not-valid-base64!!!';

      // Act
      const decoded = decodeCursor(invalidCursor);

      // Assert
      expect(decoded).toBeNull();
    });

    it('should return null for valid base64 but invalid JSON', () => {
      // Arrange
      const invalidCursor = Buffer.from('not json').toString('base64url');

      // Act
      const decoded = decodeCursor(invalidCursor);

      // Assert
      expect(decoded).toBeNull();
    });

    it('should return null for JSON without required fields', () => {
      // Arrange
      const incompleteCursor = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64url');

      // Act
      const decoded = decodeCursor(incompleteCursor);

      // Assert
      expect(decoded).toBeNull();
    });

    it('should return null for cursor with missing id', () => {
      // Arrange
      const noIdCursor = Buffer.from(JSON.stringify({ createdAt: '2026-06-10' })).toString('base64url');

      // Act
      const decoded = decodeCursor(noIdCursor);

      // Assert
      expect(decoded).toBeNull();
    });

    it('should return null for cursor with missing createdAt', () => {
      // Arrange
      const noDateCursor = Buffer.from(JSON.stringify({ id: 'tx-123' })).toString('base64url');

      // Act
      const decoded = decodeCursor(noDateCursor);

      // Assert
      expect(decoded).toBeNull();
    });

    it('should handle round-trip encoding/decoding', () => {
      // Arrange
      const original: CursorData = {
        id: 'tx-roundtrip-test',
        createdAt: new Date().toISOString(),
        sortField: 'custom_sort',
      };

      // Act
      const encoded = encodeCursor(original);
      const decoded = decodeCursor(encoded);

      // Assert
      expect(decoded).toEqual(original);
    });
  });

  describe('parseCursorPaginationParams', () => {
    it('should parse valid cursor params', () => {
      // Arrange
      const cursor = encodeCursor({ id: 'tx-123', createdAt: '2026-06-10T00:00:00.000Z' });
      const searchParams = new URLSearchParams({
        cursor,
        limit: '30',
      });

      // Act
      const result = parseCursorPaginationParams(searchParams);

      // Assert
      expect(result.cursor).toBe(cursor);
      expect(result.limit).toBe(30);
    });

    it('should use default limit when not provided', () => {
      // Arrange
      const searchParams = new URLSearchParams();

      // Act
      const result = parseCursorPaginationParams(searchParams);

      // Assert
      expect(result.limit).toBe(20);
      expect(result.cursor).toBeUndefined();
    });

    it('should cap limit at 100', () => {
      // Arrange
      const searchParams = new URLSearchParams({ limit: '500' });

      // Act
      const result = parseCursorPaginationParams(searchParams);

      // Assert
      expect(result.limit).toBe(100);
    });

    it('should use default limit for invalid values', () => {
      // Arrange
      const searchParams = new URLSearchParams({ limit: 'abc' });

      // Act
      const result = parseCursorPaginationParams(searchParams);

      // Assert
      expect(result.limit).toBe(20);
    });

    it('should handle negative limit', () => {
      // Arrange
      const searchParams = new URLSearchParams({ limit: '-10' });

      // Act
      const result = parseCursorPaginationParams(searchParams);

      // Assert
      expect(result.limit).toBe(20);
    });
  });

  describe('createCursorPaginationMeta', () => {
    it('should indicate has_more when items.length equals limit', () => {
      // Arrange
      const items = Array.from({ length: 20 }, (_, i) => ({ id: `tx-${i}` }));
      const getLastItem = (items: unknown[]) => {
        const arr = items as { id: string }[];
        const last = arr[arr.length - 1];
        return { id: last.id, createdAt: '2026-06-10T00:00:00.000Z' };
      };

      // Act
      const meta = createCursorPaginationMeta(items, 20, getLastItem);

      // Assert
      expect(meta.has_more).toBe(true);
      expect(meta.next_cursor).toBeTruthy();
      expect(meta.limit).toBe(20);
    });

    it('should indicate no more when items.length < limit', () => {
      // Arrange
      const items = Array.from({ length: 5 }, (_, i) => ({ id: `tx-${i}` }));
      const getLastItem = (items: unknown[]) => {
        const arr = items as { id: string }[];
        const last = arr[arr.length - 1];
        return { id: last.id, createdAt: '2026-06-10T00:00:00.000Z' };
      };

      // Act
      const meta = createCursorPaginationMeta(items, 20, getLastItem);

      // Assert
      expect(meta.has_more).toBe(false);
      expect(meta.next_cursor).toBeNull();
    });

    it('should handle empty items array', () => {
      // Arrange
      const items: unknown[] = [];
      const getLastItem = () => null;

      // Act
      const meta = createCursorPaginationMeta(items, 20, getLastItem);

      // Assert
      expect(meta.has_more).toBe(false);
      expect(meta.next_cursor).toBeNull();
    });
  });

  describe('createCursorPaginatedResponse', () => {
    it('should create complete paginated response', () => {
      // Arrange
      const items = Array.from({ length: 10 }, (_, i) => ({
        id: `tx-${i}`,
        createdAt: new Date(),
      }));
      const getLastItem = (items: { id: string; createdAt: Date }[]) => {
        const last = items[items.length - 1];
        return { id: last.id, createdAt: last.createdAt.toISOString() };
      };

      // Act
      const response = createCursorPaginatedResponse(items, 20, getLastItem);

      // Assert
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(10);
      expect(response.meta.has_more).toBe(false);
      expect(response.meta.next_cursor).toBeNull();
    });
  });

  describe('createTransactionCursor', () => {
    it('should create cursor from transaction', () => {
      // Arrange
      const transaction = {
        id: 'tx-cursor-test',
        amount: 100000,
        createdAt: new Date('2026-06-15'),
      };

      // Act
      const cursor = createTransactionCursor(transaction as never);

      // Assert
      expect(cursor.id).toBe('tx-cursor-test');
      expect(cursor.createdAt).toBe('2026-06-15T00:00:00.000Z');
    });

    it('should handle transaction without createdAt', () => {
      // Arrange
      const transaction = {
        id: 'tx-no-date',
        amount: 50000,
      };

      // Act
      const cursor = createTransactionCursor(transaction as never);

      // Assert
      expect(cursor.id).toBe('tx-no-date');
      expect(cursor.createdAt).toBeDefined();
    });
  });

  describe('encodeTransactionCursor', () => {
    it('should create encoded cursor from transaction', () => {
      // Arrange
      const transaction = {
        id: 'tx-encode-test',
        createdAt: new Date('2026-06-20'),
      };

      // Act
      const cursorString = encodeTransactionCursor(transaction as never);
      const decoded = decodeCursorUtil(cursorString);

      // Assert
      expect(cursorString).toBeTruthy();
      expect(decoded?.id).toBe('tx-encode-test');
    });
  });
});

// ============================================
// TEST SUITE: Integration Scenarios
// ============================================

describe('Cursor Pagination Integration', () => {
  describe('pagination flow simulation', () => {
    it('should support multiple pages of pagination', () => {
      // Arrange - Simulate 50 transactions
      const allTransactions = Array.from({ length: 50 }, (_, i) => ({
        id: `tx-${i.toString().padStart(3, '0')}`,
        amount: (i + 1) * 10000,
        createdAt: new Date(2026, 5, Math.floor(i / 2) + 1),
      }));

      const getLastItem = (items: typeof allTransactions) => {
        const last = items[items.length - 1];
        return { id: last.id, createdAt: last.createdAt.toISOString() };
      };

      // Page 1
      const page1Items = allTransactions.slice(0, 20);
      const page1 = createCursorPaginatedResponse(page1Items, 20, getLastItem);

      expect(page1.data).toHaveLength(20);
      expect(page1.meta.has_more).toBe(true);
      expect(page1.meta.next_cursor).toBeTruthy();

      // Decode cursor for page 2
      const page2Cursor = decodeCursor(page1.meta.next_cursor!);
      expect(page2Cursor?.id).toBe('tx-019');

      // Page 2
      const page2Items = allTransactions.slice(20, 40);
      const page2 = createCursorPaginatedResponse(page2Items, 20, getLastItem);

      expect(page2.data).toHaveLength(20);
      expect(page2.meta.has_more).toBe(true);

      // Page 3 (last page)
      const page3Items = allTransactions.slice(40, 50);
      const page3 = createCursorPaginatedResponse(page3Items, 20, getLastItem);

      expect(page3.data).toHaveLength(10);
      expect(page3.meta.has_more).toBe(false);
      expect(page3.meta.next_cursor).toBeNull();
    });

    it('should handle empty results on first page', () => {
      // Arrange
      const emptyItems: { id: string; createdAt: Date }[] = [];
      const getLastItem = () => null;

      // Act
      const response = createCursorPaginatedResponse(emptyItems, 20, getLastItem);

      // Assert
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(0);
      expect(response.meta.has_more).toBe(false);
      expect(response.meta.next_cursor).toBeNull();
    });

    it('should handle single item result', () => {
      // Arrange
      const singleItem = [{ id: 'tx-single', createdAt: new Date() }];
      const getLastItem = (items: typeof singleItem) => ({
        id: items[0].id,
        createdAt: items[0].createdAt.toISOString(),
      });

      // Act
      const response = createCursorPaginatedResponse(singleItem, 20, getLastItem);

      // Assert
      expect(response.data).toHaveLength(1);
      expect(response.meta.has_more).toBe(false);
    });
  });
});
