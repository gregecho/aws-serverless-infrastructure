"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const faker_1 = require("@faker-js/faker");
const vitest_1 = require("vitest");
const userService_1 = require("../userService");
(0, vitest_1.beforeAll)(() => {
    vitest_1.vi.stubEnv('USERS_TABLE', 'mock-USERS_TABLE');
});
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
});
// Mock DynamoDB client
vitest_1.vi.mock('@@clients/dynamoClient', () => {
    return {
        dynamo: {
            send: vitest_1.vi.fn().mockResolvedValue({}),
        },
    };
});
(0, vitest_1.describe)('createUser service', () => {
    (0, vitest_1.test)('should save user to dynamoDB', async () => {
        const mockRepo = {
            save: vitest_1.vi.fn().mockImplementation(async (user) => ({
                id: 'mock-id',
                ...user,
            })),
        };
        const userService = (0, userService_1.createUserService)(mockRepo);
        const name = faker_1.faker.person.firstName();
        const email = faker_1.faker.internet.email();
        const user = {
            name,
            email,
        };
        const result = await userService.createUser(user);
        (0, vitest_1.expect)(mockRepo.save).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(result.name).toBe(name);
        (0, vitest_1.expect)(result.email).toBe(email);
        (0, vitest_1.expect)(result).toHaveProperty('id');
    });
});
