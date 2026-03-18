import { dynamo } from '@@clients/dynamoClient';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { faker } from '@faker-js/faker';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createUserRepository } from '../UserRepositoryImpl';

// mock dynamo client
vi.mock('@@clients/dynamoClient', () => ({
  dynamo: {
    send: vi.fn(),
  },
}));

describe('UserRepositoryImpl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('USERS_TABLE', 'test-table');
  });

  test('should save user to DynamoDB and return item', async () => {
    const repo = createUserRepository();

    const name = faker.person.firstName();
    const email = faker.internet.email();

    // mock dynamo response
    const mockSend = vi.mocked(dynamo.send).mockResolvedValue({} as any);

    const result = await repo.save({ name, email });

    expect(mockSend).toHaveBeenCalledTimes(1);

    const command = mockSend.mock.calls[0][0] as PutCommand;
    expect(command.input.TableName).toBe('test-table');
    expect(command.input.Item).toMatchObject({
      name,
      email,
    });

    expect(result).toMatchObject({
      name,
      email,
    });
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('createdAt');
  });
});
