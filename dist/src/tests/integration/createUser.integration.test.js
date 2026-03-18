"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const create_user_handler_1 = require("@@handlers/user/create-user-handler");
const userService_1 = require("@@services/user/userService");
const faker_1 = require("@faker-js/faker");
const vitest_1 = require("vitest");
const mockCreateUser = vitest_1.vi.fn();
// Mock UserService.createUser
vitest_1.vi.spyOn(userService_1.UserService.prototype, 'createUser').mockImplementation(mockCreateUser);
vitest_1.vi.mock('@@clients/dynamoClient', () => ({
    dynamo: {
        send: vitest_1.vi.fn().mockResolvedValue({}),
    },
}));
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
});
const generateUser = () => ({
    name: faker_1.faker.person.firstName(),
    email: faker_1.faker.internet.email(),
});
(0, vitest_1.describe)('createUser API (integration)', () => {
    (0, vitest_1.test)('should return 200 when request is valid', async () => {
        const { name, email } = generateUser();
        mockCreateUser.mockResolvedValue({
            id: faker_1.faker.string.uuid(),
            name,
            email,
            createdAt: new Date().toISOString(),
        });
        const event = {
            body: JSON.stringify({ name, email }),
            headers: {
                'Content-Type': 'application/json',
            },
        };
        const response = await (0, create_user_handler_1.handler)(event, {});
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        (0, vitest_1.expect)(body).toMatchObject({
            name,
            email,
        });
        (0, vitest_1.expect)(mockCreateUser).toHaveBeenCalledWith({ name, email });
    });
    (0, vitest_1.test)('should return 400 when email invalid (Zod)', async () => {
        const event = {
            body: JSON.stringify({
                name: faker_1.faker.person.firstName(),
                email: 'invalid-email',
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        };
        const response = await (0, create_user_handler_1.handler)(event, {});
        (0, vitest_1.expect)(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        (0, vitest_1.expect)(body.message).toBe('Validation Failed');
        (0, vitest_1.expect)(body.errors[0].path).toBe('email');
        (0, vitest_1.expect)(mockCreateUser).not.toHaveBeenCalled();
    });
    (0, vitest_1.test)('should return 400 when body is invalid JSON', async () => {
        const event = {
            body: '{ invalid json }',
            headers: {
                'Content-Type': 'application/json',
            },
        };
        const response = await (0, create_user_handler_1.handler)(event, {});
        (0, vitest_1.expect)(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        (0, vitest_1.expect)(body.message).toBe('Invalid JSON format');
    });
    (0, vitest_1.test)('should return 500 when service throws', async () => {
        mockCreateUser.mockRejectedValue(new Error('DB down'));
        const event = {
            body: JSON.stringify({
                name: faker_1.faker.person.firstName(),
                email: faker_1.faker.internet.email(),
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        };
        const response = await (0, create_user_handler_1.handler)(event, {});
        (0, vitest_1.expect)(response.statusCode).toBe(500);
        const body = JSON.parse(response.body);
        (0, vitest_1.expect)(body.message).toBe('Internal Server Error');
    });
});
