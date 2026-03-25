import { restApiHandler } from '@@middleware/api';
import { createUserRepository } from '@@repositories/user/UserRepositoryImpl';
import {
  createUserRequestSchema,
  listUsersQuerySchema,
  listUsersResponseSchema,
  sendVerificationCodeRequestSchema,
  updateUserRequestSchema,
  userIdPathSchema,
  userResponseSchema,
  verificationResponseSchema,
  verifyCodeRequestSchema,
} from '@@schemas/user/userSchema';
import { createUserService } from '@@services/user/userService';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'userHandlers' });
const userService = createUserService(createUserRepository());

export const createUserHandler = restApiHandler({
  body: createUserRequestSchema,
  response: userResponseSchema,
  openapi: {
    method: 'post',
    path: '/users',
    summary: 'Create user',
    tags: ['User'],
  },
}).handler(async ({ body }) => {
  const result = await userService.create(body);
  logger.info('user created', { userId: result.id });
  return result;
});

export const getUserByIdHandler = restApiHandler({
  path: userIdPathSchema,
  response: userResponseSchema,
  openapi: {
    method: 'get',
    path: '/users/{id}',
    summary: 'Get user by id',
    tags: ['User'],
  },
}).handler(async ({ path }) => {
  const result = await userService.getById(path.id);
  logger.info('user fetched', { userId: path.id });
  return result;
});

export const listUsersHandler = restApiHandler({
  query: listUsersQuerySchema,
  response: listUsersResponseSchema,
  openapi: {
    method: 'get',
    path: '/users',
    summary: 'List users',
    tags: ['User'],
  },
}).handler(async ({ query }) => {
  const result = await userService.list(query);
  logger.info('users listed', { count: result.length });
  return result;
});

export const updateUserHandler = restApiHandler({
  body: updateUserRequestSchema,
  path: userIdPathSchema,
  response: userResponseSchema,
  openapi: {
    method: 'patch',
    path: '/users/{id}',
    summary: 'Update user',
    tags: ['User'],
  },
}).handler(async ({ body, path }) => {
  const result = await userService.update(path.id, body);
  logger.info('user updated', { userId: path.id });
  return result;
});

export const deleteUserHandler = restApiHandler({
  path: userIdPathSchema,
  openapi: {
    method: 'delete',
    path: '/users/{id}',
    summary: 'Delete user',
    tags: ['User'],
  },
}).handler(async ({ path }) => {
  await userService.delete(path.id);
  logger.info('user deleted', { userId: path.id });
  return { success: true };
});

export const sendVerificationCodeHandler = restApiHandler({
  body: sendVerificationCodeRequestSchema,
  path: userIdPathSchema,
  response: verificationResponseSchema,
  openapi: {
    method: 'post',
    path: '/users/{id}/verify/send',
    summary: 'Send email verification code',
    tags: ['User'],
  },
}).handler(async ({ body, path }) => {
  await userService.sendVerificationCode(path.id, body.email);
  logger.info('verification code sent', { userId: path.id });
  return { message: 'Verification code sent' };
});

export const verifyCodeHandler = restApiHandler({
  body: verifyCodeRequestSchema,
  path: userIdPathSchema,
  response: verificationResponseSchema,
  openapi: {
    method: 'post',
    path: '/users/{id}/verify/confirm',
    summary: 'Verify email code',
    tags: ['User'],
  },
}).handler(async ({ body, path }) => {
  await userService.verifyCode(path.id, body.code);
  logger.info('user email verified', { userId: path.id });
  return { message: 'Email verified' };
});
