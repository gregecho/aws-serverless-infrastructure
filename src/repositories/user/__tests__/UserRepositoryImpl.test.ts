import { dynamo } from '@@clients/dynamoClient';
import { DeleteCommand, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
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

  test('getById should return user when found', async () => {
    const repo = createUserRepository();
    const id = faker.string.uuid();
    const item = {
      id,
      name: faker.person.firstName(),
      email: faker.internet.email(),
      createdAt: new Date().toISOString(),
    };

    vi.mocked(dynamo.send).mockResolvedValue({ Item: item } as any);

    const result = await repo.getById(id);

    const command = vi.mocked(dynamo.send).mock.calls[0][0] as GetCommand;
    expect(command.input.Key).toEqual({ PK: `USER#${id}`, SK: 'PROFILE' });
    expect(result).toMatchObject({ id, name: item.name, email: item.email });
  });

  test('getById should throw NOT_FOUND when item missing', async () => {
    const repo = createUserRepository();
    vi.mocked(dynamo.send).mockResolvedValue({ Item: undefined } as any);

    await expect(repo.getById(faker.string.uuid())).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'RESOURCE_NOT_FOUND',
    });
  });

  test('update should return updated user', async () => {
    const repo = createUserRepository();
    const id = faker.string.uuid();
    const updatedItem = {
      id,
      name: 'Updated',
      email: faker.internet.email(),
      createdAt: new Date().toISOString(),
    };

    vi.mocked(dynamo.send).mockResolvedValue({ Attributes: updatedItem } as any);

    const result = await repo.update(id, { name: 'Updated' });

    const command = vi.mocked(dynamo.send).mock.calls[0][0] as UpdateCommand;
    expect(command.input.Key).toEqual({ PK: `USER#${id}`, SK: 'PROFILE' });
    expect(result.name).toBe('Updated');
  });

  test('update with empty body should call getById instead', async () => {
    const repo = createUserRepository();
    const id = faker.string.uuid();
    const item = {
      id,
      name: faker.person.firstName(),
      email: faker.internet.email(),
      createdAt: new Date().toISOString(),
    };

    vi.mocked(dynamo.send).mockResolvedValue({ Item: item } as any);

    const result = await repo.update(id, {});

    const command = vi.mocked(dynamo.send).mock.calls[0][0] as GetCommand;
    expect(command.input.Key).toEqual({ PK: `USER#${id}`, SK: 'PROFILE' });
    expect(result).toMatchObject({ id });
  });

  test('delete should send DeleteCommand', async () => {
    const repo = createUserRepository();
    const id = faker.string.uuid();
    vi.mocked(dynamo.send).mockResolvedValue({} as any);

    await repo.delete(id);

    const command = vi.mocked(dynamo.send).mock.calls[0][0] as DeleteCommand;
    expect(command.input.Key).toEqual({ PK: `USER#${id}`, SK: 'PROFILE' });
  });

  test('list should return all users', async () => {
    const repo = createUserRepository();
    const items = [
      { id: faker.string.uuid(), name: faker.person.firstName(), email: faker.internet.email(), createdAt: new Date().toISOString() },
      { id: faker.string.uuid(), name: faker.person.firstName(), email: faker.internet.email(), createdAt: new Date().toISOString() },
    ];

    vi.mocked(dynamo.send).mockResolvedValue({ Items: items } as any);

    const result = await repo.list();

    expect(result).toHaveLength(2);
  });

  test('list should return empty array when no items', async () => {
    const repo = createUserRepository();
    vi.mocked(dynamo.send).mockResolvedValue({ Items: [] } as any);

    const result = await repo.list();
    expect(result).toEqual([]);
  });

  test('saveVerificationCode should send UpdateCommand with code and expiry', async () => {
    const repo = createUserRepository();
    const id = faker.string.uuid();
    vi.mocked(dynamo.send).mockResolvedValue({} as any);

    await repo.saveVerificationCode(id, '123456', 9999999999);

    const command = vi.mocked(dynamo.send).mock.calls[0][0] as UpdateCommand;
    expect(command.input.Key).toEqual({ PK: `USER#${id}`, SK: 'PROFILE' });
    expect(command.input.ExpressionAttributeValues).toMatchObject({
      ':code': '123456',
      ':expiry': 9999999999,
    });
  });

  test('verifyAndMarkVerified should mark user verified when code matches', async () => {
    const repo = createUserRepository();
    const id = faker.string.uuid();
    const item = {
      id,
      name: faker.person.firstName(),
      email: faker.internet.email(),
      createdAt: new Date().toISOString(),
      VerificationCode: '654321',
      VerificationExpiry: Date.now() + 60_000,
    };

    vi.mocked(dynamo.send)
      .mockResolvedValueOnce({ Item: item } as any) // GetCommand
      .mockResolvedValueOnce({} as any); // UpdateCommand

    await repo.verifyAndMarkVerified(id, '654321');

    expect(vi.mocked(dynamo.send)).toHaveBeenCalledTimes(2);
    const updateCmd = vi.mocked(dynamo.send).mock.calls[1][0] as UpdateCommand;
    expect(updateCmd.input.ExpressionAttributeValues).toMatchObject({ ':verified': true });
  });

  test('verifyAndMarkVerified should throw BAD_REQUEST when code is wrong', async () => {
    const repo = createUserRepository();
    const id = faker.string.uuid();
    const item = {
      id,
      name: faker.person.firstName(),
      email: faker.internet.email(),
      createdAt: new Date().toISOString(),
      VerificationCode: '111111',
      VerificationExpiry: Date.now() + 60_000,
    };

    vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: item } as any);

    await expect(repo.verifyAndMarkVerified(id, '999999')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  test('verifyAndMarkVerified should throw BAD_REQUEST when code is expired', async () => {
    const repo = createUserRepository();
    const id = faker.string.uuid();
    const item = {
      id,
      name: faker.person.firstName(),
      email: faker.internet.email(),
      createdAt: new Date().toISOString(),
      VerificationCode: '123456',
      VerificationExpiry: Date.now() - 1, // already expired
    };

    vi.mocked(dynamo.send).mockResolvedValueOnce({ Item: item } as any);

    await expect(repo.verifyAndMarkVerified(id, '123456')).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
