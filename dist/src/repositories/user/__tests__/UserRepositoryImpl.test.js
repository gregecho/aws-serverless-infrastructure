"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dynamoClient_1 = require("@@clients/dynamoClient");
const faker_1 = require("@faker-js/faker");
const vitest_1 = require("vitest");
const UserRepositoryImpl_1 = require("../UserRepositoryImpl");
// mock dynamo client
vitest_1.vi.mock('@@clients/dynamoClient', () => ({
    dynamo: {
        send: vitest_1.vi.fn(),
    },
}));
(0, vitest_1.describe)('UserRepositoryImpl', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        vitest_1.vi.stubEnv('USERS_TABLE', 'test-table');
    });
    (0, vitest_1.test)('should save user to DynamoDB and return item', async () => {
        const repo = (0, UserRepositoryImpl_1.createUserRepository)();
        const name = faker_1.faker.person.firstName();
        const email = faker_1.faker.internet.email();
        // mock dynamo response
        const mockSend = vitest_1.vi.mocked(dynamoClient_1.dynamo.send).mockResolvedValue({});
        const result = await repo.save({ name, email });
        (0, vitest_1.expect)(mockSend).toHaveBeenCalledTimes(1);
        const command = mockSend.mock.calls[0][0];
        (0, vitest_1.expect)(command.input.TableName).toBe('test-table');
        (0, vitest_1.expect)(command.input.Item).toMatchObject({
            name,
            email,
        });
        (0, vitest_1.expect)(result).toMatchObject({
            name,
            email,
        });
        (0, vitest_1.expect)(result).toHaveProperty('id');
        (0, vitest_1.expect)(result).toHaveProperty('createdAt');
    });
});
