// PRD: PublicLoopBoard
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/explore/route';
import { Loop, Reaction, Clone } from '@/models';
import mongoose from 'mongoose';

// Mock external dependencies
vi.mock('@/lib/db/mongoose', () => ({
    default: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/models', () => ({
    Loop: {
        find: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
    },
    Reaction: {
        countDocuments: vi.fn().mockResolvedValue(0),
    },
    Clone: {
        countDocuments: vi.fn().mockResolvedValue(0),
    },
}));

// Mock NextRequest
class MockNextRequest {
    private url: string;

    constructor(url: string) {
        this.url = url;
    }

    get url() {
        return this.url;
    }
}

describe('Explore API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('GET /api/explore', () => {
        it('should return empty loops array when no loops exist', async () => {
            // Arrange
            const req = new MockNextRequest('http://localhost:3000/api/explore');

            // Act
            const response = await GET(req as any);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(200);
            expect(data).toHaveProperty('loops');
            expect(data.loops).toEqual([]);
            expect(data.nextCursor).toBeNull();
        });

        it('should validate and parse query parameters', async () => {
            // Arrange
            const req = new MockNextRequest('http://localhost:3000/api/explore?limit=invalid');

            // Act
            const response = await GET(req as any);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(400);
            expect(data).toHaveProperty('error');
        });

        it('should handle cursor-based pagination', async () => {
            // Arrange
            const mockLoops = [
                {
                    _id: new mongoose.Types.ObjectId(),
                    ownerId: { _id: new mongoose.Types.ObjectId(), email: 'user1@example.com' },
                    title: 'Loop 1',
                    frequency: 'daily',
                    createdAt: new Date(),
                },
                {
                    _id: new mongoose.Types.ObjectId(),
                    ownerId: { _id: new mongoose.Types.ObjectId(), email: 'user2@example.com' },
                    title: 'Loop 2',
                    frequency: 'weekdays',
                    createdAt: new Date(),
                },
            ];

            // Mock Loop.find().sort().limit().populate().lean() to return mockLoops
            (Loop.find as any).mockReturnThis();
            (Loop.sort as any).mockReturnThis();
            (Loop.limit as any).mockReturnThis();
            (Loop.populate as any).mockReturnThis();
            (Loop.lean as any).mockResolvedValue(mockLoops);

            const req = new MockNextRequest('http://localhost:3000/api/explore?limit=2');

            // Act
            const response = await GET(req as any);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(200);
            expect(data).toHaveProperty('loops');
            expect(data.loops).toHaveLength(2);
            expect(Loop.find).toHaveBeenCalledWith({ visibility: 'public' });
        });
    });
}); 