"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserRepository = createUserRepository;
const dynamoClient_1 = require("@@clients/dynamoClient");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const crypto_1 = require("crypto");
class UserRepositoryImpl {
    async save(user) {
        const TABLE = process.env.USERS_TABLE;
        const item = {
            id: (0, crypto_1.randomUUID)(),
            ...user,
            createdAt: new Date().toISOString(),
        };
        await dynamoClient_1.dynamo.send(new lib_dynamodb_1.PutCommand({
            TableName: TABLE,
            Item: item,
        }));
        return item;
    }
}
function createUserRepository() {
    return new UserRepositoryImpl();
}
