"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRequestSchema = exports.updateUserRequestSchema = exports.userResponseSchema = exports.baseUserSchema = void 0;
const zod_to_openapi_1 = require("@asteasolutions/zod-to-openapi");
const zod_1 = require("zod");
(0, zod_to_openapi_1.extendZodWithOpenApi)(zod_1.z);
exports.baseUserSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(2, 'name too short')
        .describe('user name')
        .meta({ example: 'first name' }),
    email: zod_1.z
        .email('invalid email')
        .describe('users email')
        .meta({ example: 'test@test.com' }),
});
// extend: Use extend to add additional createAt
// omit: Use omit to remove additional properties
exports.userResponseSchema = exports.baseUserSchema.extend({
    id: zod_1.z.uuid().describe('user id'),
    createdAt: zod_1.z
        .string()
        .describe('User created at')
        .meta({ example: '1900-01-01' }),
});
// partial: Make all fields to optional
exports.updateUserRequestSchema = exports.baseUserSchema.partial();
exports.userRequestSchema = exports.baseUserSchema;
