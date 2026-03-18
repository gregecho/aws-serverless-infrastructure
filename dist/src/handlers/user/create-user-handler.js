"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const api_1 = require("@@middleware/api");
const UserRepositoryImpl_1 = require("@@repositories/user/UserRepositoryImpl");
const userSchema_1 = require("@@schemas/user/userSchema");
const logger_1 = require("@aws-lambda-powertools/logger");
const userService_1 = require("../../services/user/userService");
const logger = new logger_1.Logger({
    serviceName: 'createUser',
});
const userService = (0, userService_1.createUserService)((0, UserRepositoryImpl_1.createUserRepository)());
exports.handler = (0, api_1.restApiHandler)({
    requestSchema: userSchema_1.userRequestSchema,
    responseSchema: userSchema_1.userResponseSchema,
}).handler(async (event) => {
    // event.body is ALREADY validated and typed in middleware
    const result = await userService.createUser(event);
    logger.info('user created', result);
    return {
        statusCode: 200,
        body: JSON.stringify(result),
    };
});
