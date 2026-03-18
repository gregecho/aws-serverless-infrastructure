"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const userService_1 = require("@@services/user/userService");
const faker_1 = require("@faker-js/faker");
const vitest_1 = require("vitest");
const create_user_handler_1 = require("../create-user-handler");
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
});
// Mock UserService.createUser
const mockCreateUser = vitest_1.vi.fn();
vitest_1.vi.spyOn(userService_1.UserService.prototype, 'createUser').mockImplementation(mockCreateUser);
(0, vitest_1.describe)('createUser handler', () => {
    (0, vitest_1.test)('should return 200 when user created', async () => {
        const name = faker_1.faker.person.firstName();
        const email = faker_1.faker.internet.email();
        // Type-safe mocking
        mockCreateUser.mockResolvedValue({
            id: faker_1.faker.string.uuid(),
            name: name,
            email: email,
            createdAt: faker_1.faker.date.anytime().toDateString(),
        });
        const userData = {
            name: name,
            email: email,
        };
        const event = {
            body: JSON.stringify(userData),
            headers: {
                'Content-Type': 'application/json',
            },
        };
        const response = await (0, create_user_handler_1.handler)(event, {});
        (0, vitest_1.expect)(mockCreateUser).toHaveBeenCalledWith({ name, email });
        (0, vitest_1.expect)(response).toBeDefined();
        // ?.: optional chaining: Only access if NOT null/undefined
        // !.: Non-null assertion: This is NOT null/undefined
        (0, vitest_1.expect)(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        (0, vitest_1.expect)(body.name).toBe(name);
        (0, vitest_1.expect)(body).toMatchObject({
            name: name,
        });
    });
    (0, vitest_1.test)('should return 400 when email is invalid', async () => {
        const userData = {
            name: faker_1.faker.person.firstName(),
            email: 'invalid-email-format',
        };
        const event = {
            body: JSON.stringify(userData),
            headers: {
                'Content-Type': 'application/json',
            },
        };
        const response = await (0, create_user_handler_1.handler)(event, {});
        (0, vitest_1.expect)(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        /**
         * {
              "message": "Validation Failed",
              "errors": [
                {
                  "path": "email",
                  "message": "invalid email"
                }
              ]
            }
         */
        (0, vitest_1.expect)(body.message).toBe('Validation Failed');
        (0, vitest_1.expect)(body.errors[0].path).toBe('email');
        (0, vitest_1.expect)(mockCreateUser).not.toHaveBeenCalled();
    });
});
