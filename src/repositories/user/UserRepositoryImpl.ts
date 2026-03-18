import { dynamo } from '@@clients/dynamoClient';
import { UserBody, UserResponse } from '@@schemas/user/userSchema';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { UserRepository } from './UserRepository';

class UserRepositoryImpl implements UserRepository {
  async save(user: UserBody): Promise<UserResponse> {
    const TABLE = process.env.USERS_TABLE;

    const item: UserResponse = {
      id: randomUUID(),
      ...user,
      createdAt: new Date().toISOString(),
    };

    await dynamo.send(
      new PutCommand({
        TableName: TABLE,
        Item: item,
      }),
    );
    return item;
  }
}

export function createUserRepository() {
  return new UserRepositoryImpl();
}
