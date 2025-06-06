// PRD: Auth - Development mock DB
import { EventEmitter } from 'events';

// A simple in-memory store for development without MongoDB
class MockDB extends EventEmitter {
    private store: Map<string, Map<string, any>>;

    constructor() {
        super();
        this.store = new Map();
        console.warn('Using MockDB for development. Data will not persist between server restarts.');
    }

    // Get a collection
    collection(name: string) {
        if (!this.store.has(name)) {
            this.store.set(name, new Map());
        }
        return this.store.get(name);
    }

    // CRUD operations
    async findOne(collection: string, query: any) {
        const coll = this.collection(collection);
        // Simple implementation: just match the first property
        const queryKey = Object.keys(query)[0];

        if (!queryKey || !coll) return null;

        // Convert to array first to avoid iterator issues
        const entries = Array.from(coll.entries());
        for (const [id, doc] of entries) {
            if (doc[queryKey] === query[queryKey]) {
                return { _id: id, ...doc };
            }
        }
        return null;
    }

    async findById(collection: string, id: string) {
        const coll = this.collection(collection);
        if (!coll) return null;

        const doc = coll.get(id);
        return doc ? { _id: id, ...doc } : null;
    }

    async create(collection: string, data: any) {
        const coll = this.collection(collection);
        if (!coll) throw new Error('Collection not found');

        const id = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Check for uniqueness if email exists
        if (data.email) {
            const entries = Array.from(coll.values());
            for (const doc of entries) {
                if (doc.email === data.email) {
                    throw new Error('Duplicate key error');
                }
            }
        }

        coll.set(id, { ...data, createdAt: new Date() });
        return { _id: id, ...data, createdAt: new Date() };
    }

    async updateOne(collection: string, query: any, update: any) {
        const doc = await this.findOne(collection, query);
        if (!doc) return { matchedCount: 0, modifiedCount: 0 };

        const coll = this.collection(collection);
        if (!coll) return { matchedCount: 0, modifiedCount: 0 };

        const id = doc._id;

        // Handle $set operator
        if (update.$set) {
            coll.set(id, { ...doc, ...update.$set, updatedAt: new Date() });
        } else {
            coll.set(id, { ...doc, ...update, updatedAt: new Date() });
        }

        return { matchedCount: 1, modifiedCount: 1 };
    }

    async deleteOne(collection: string, query: any) {
        const doc = await this.findOne(collection, query);
        if (!doc) return { deletedCount: 0 };

        const coll = this.collection(collection);
        if (!coll) return { deletedCount: 0 };

        coll.delete(doc._id);

        return { deletedCount: 1 };
    }

    async deleteMany(collection: string, query: any) {
        const coll = this.collection(collection);
        let deletedCount = 0;

        // Simple implementation
        const queryKey = Object.keys(query)[0];

        if (!queryKey || !coll) return { deletedCount: 0 };

        const idsToDelete: string[] = [];

        // Convert to array first to avoid iterator issues
        const entries = Array.from(coll.entries());
        for (const [id, doc] of entries) {
            if (doc[queryKey] === query[queryKey]) {
                idsToDelete.push(id);
            }
        }

        for (const id of idsToDelete) {
            coll.delete(id);
            deletedCount++;
        }

        return { deletedCount };
    }
}

// Singleton instance
const mockDB = new MockDB();
export default mockDB; 