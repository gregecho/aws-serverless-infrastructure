"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@@middleware/api");
const vitest_1 = require("vitest");
const zod_1 = require("zod");
(0, vitest_1.describe)('handleApiErrors middleware', () => {
    const middleware = (0, api_1.handleApiErrors)();
    (0, vitest_1.test)('should return 400 for ZodError (via cause)', async () => {
        const zodError = new zod_1.ZodError([
            {
                code: 'invalid_format',
                path: ['email'],
                message: 'invalid email',
            },
        ]);
        const request = {
            error: {
                cause: zodError,
            },
        };
        //Non-null assertion (!) tells TypeScript that the value will definitely exist,
        //while optional chaining (?.) safely accesses a value only if it exists.
        await middleware.onError(request);
        (0, vitest_1.expect)(request.response.statusCode).toBe(400);
        const body = JSON.parse(request.response.body);
        (0, vitest_1.expect)(body.message).toBe('Validation Failed');
        (0, vitest_1.expect)(body.errors[0].path).toBe('email');
    });
    (0, vitest_1.test)('should return 400 for direct ZodError', async () => {
        const zodError = new zod_1.ZodError([
            {
                code: 'invalid_type',
                path: ['name'],
                message: 'Required',
            },
        ]);
        const request = {
            error: zodError,
        };
        await middleware.onError(request);
        (0, vitest_1.expect)(request.response.statusCode).toBe(400);
        const body = JSON.parse(request.response.body);
        (0, vitest_1.expect)(body.message).toBe('Validation Failed');
        (0, vitest_1.expect)(body.errors[0].path).toBe('name');
    });
    (0, vitest_1.test)('should return 400 for ParseError', async () => {
        const request = {
            error: {
                name: 'ParseError',
                message: 'Unexpected token',
            },
        };
        await middleware.onError(request);
        (0, vitest_1.expect)(request.response.statusCode).toBe(400);
        const body = JSON.parse(request.response.body);
        (0, vitest_1.expect)(body.message).toBe('Invalid JSON format');
    });
    (0, vitest_1.test)('should return 500 for unknown error', async () => {
        const request = {
            error: new Error('Something went wrong'),
        };
        await middleware.onError(request);
        (0, vitest_1.expect)(request.response.statusCode).toBe(500);
        const body = JSON.parse(request.response.body);
        (0, vitest_1.expect)(body.message).toBe('Internal Server Error');
    });
});
