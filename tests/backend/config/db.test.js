import { jest } from '@jest/globals';

describe('connectDB', () => {
    beforeEach(() => {
        jest.resetModules();
        process.env.MONGO_URL = 'mock-uri';
        console.log = jest.fn();
    });

    it('connects and logs success', async () => {
        const connectFn = jest.fn().mockResolvedValue({ connection: { host: 'localhost' } });

        jest.doMock('mongoose', () => ({
            __esModule: true,
            default: { connect: connectFn },
        }));

        const connectDB = require('@config/db.js').default;

        await connectDB();

        expect(connectFn).toHaveBeenCalledWith('mock-uri');
        expect(console.log).toHaveBeenCalledWith('Connected To Mongodb Database localhost'.bgMagenta.white);
    });

    it('logs error on failure', async () => {
        const connectFn = jest.fn().mockRejectedValue(new Error('failed'));

        jest.doMock('mongoose', () => ({
            __esModule: true,
            default: { connect: connectFn },
        }));

        const connectDB = require('@config/db.js').default;

        await connectDB();

        expect(console.log).toHaveBeenCalledWith('Error in Mongodb Error: failed'.bgRed.white);
    });
});
