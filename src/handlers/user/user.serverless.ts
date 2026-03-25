import type { AWS } from '@serverless/typescript';

const base = 'src/handlers/user/index';
const path = '/users';
const pathWithId = `${path}/{id}`;

export const userFunctions: AWS['functions'] = {
  'user-create': {
    handler: `${base}.createUserHandler`,
    events: [{ http: { path, method: 'POST' } }],
  },
  'user-get': {
    handler: `${base}.getUserByIdHandler`,
    events: [{ http: { path: pathWithId, method: 'GET' } }],
  },
  'user-list': {
    handler: `${base}.listUsersHandler`,
    events: [{ http: { path, method: 'GET' } }],
  },
  'user-update': {
    handler: `${base}.updateUserHandler`,
    events: [{ http: { path: pathWithId, method: 'PATCH' } }],
  },
  'user-delete': {
    handler: `${base}.deleteUserHandler`,
    events: [{ http: { path: pathWithId, method: 'DELETE' } }],
  },
  'user-send-verification': {
    handler: `${base}.sendVerificationCodeHandler`,
    events: [{ http: { path: `${pathWithId}/verify/send`, method: 'POST' } }],
  },
  'user-verify-code': {
    handler: `${base}.verifyCodeHandler`,
    events: [{ http: { path: `${pathWithId}/verify/confirm`, method: 'POST' } }],
  },
};
