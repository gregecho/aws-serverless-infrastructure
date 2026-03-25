import { UserRepository } from "@@repositories/user/UserRepository";
import { UserBody, UserResponse } from "@@schemas/user/userSchema";
import { Errors } from "@@utils/errors";
import { faker } from "@faker-js/faker";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { createUserService } from "../userService";

beforeAll(() => {
  vi.stubEnv("USERS_TABLE", "mock-USERS_TABLE");
  vi.stubEnv("PORTRAITS_BUCKET", "mock-portraits-bucket");
  vi.stubEnv(
    "VERIFICATION_TOPIC_ARN",
    "arn:aws:sns:us-east-1:123456789012:mock-topic",
  );
});

beforeEach(() => {
  vi.clearAllMocks();
});

// Mock DynamoDB client
vi.mock("@@clients/dynamoClient", () => {
  return {
    dynamo: {
      send: vi.fn().mockResolvedValue({}),
    },
  };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi
    .fn()
    .mockResolvedValue("https://s3.example.com/presigned-url"),
}));

vi.mock("@aws-sdk/client-sns", () => ({
  SNSClient: vi.fn().mockImplementation(function () {
    return { send: vi.fn().mockResolvedValue({}) };
  }),
  PublishCommand: vi.fn(),
}));
const makeUser = (): UserResponse => ({
  id: faker.string.uuid(),
  name: faker.person.firstName(),
  email: faker.internet.email(),
  createdAt: new Date().toISOString(),
});

const makeRepo = (overrides: Partial<UserRepository> = {}): UserRepository => ({
  save: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
  saveVerificationCode: vi.fn(),
  verifyAndMarkVerified: vi.fn(),
  ...overrides,
});
describe("User service", () => {
  describe("createUser", () => {
    test("should save user to dynamoDB", async () => {
      const mockRepo: UserRepository = {
        save: vi.fn().mockImplementation(async (user) => ({
          id: "mock-id",
          ...user,
        })),
        getById: vi.fn(),
        update: function (
          userId: string,
          user: Partial<UserBody>,
        ): Promise<UserResponse> {
          throw new Error("Function not implemented.");
        },
        delete: function (userId: string): Promise<void> {
          throw new Error("Function not implemented.");
        },
        list: function (
          query?: Record<string, string | undefined>,
        ): Promise<UserResponse[]> {
          throw new Error("Function not implemented.");
        },
        saveVerificationCode: vi.fn(),
        verifyAndMarkVerified: vi.fn(),
      };

      const userService = createUserService(mockRepo);
      const name = faker.person.firstName();
      const email = faker.internet.email();

      const user = {
        name,
        email,
      };

      const result = await userService.create(user);
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
      expect(result.name).toBe(name);
      expect(result.email).toBe(email);
      expect(result).toHaveProperty("id");
    });
  });

  describe("getById", () => {
    test("should return user when found", async () => {
      const user = makeUser();
      const repo = makeRepo({ getById: vi.fn().mockResolvedValue(user) });
      const result = await createUserService(repo).getById(user.id);
      expect(repo.getById).toHaveBeenCalledWith(user.id);
      expect(result).toEqual(user);
    });

    test("should throw NOT_FOUND when user does not exist", async () => {
      const repo = makeRepo({
        getById: vi.fn().mockRejectedValue(Errors.NOT_FOUND("user")),
      });
      await expect(
        createUserService(repo).getById(faker.string.uuid()),
      ).rejects.toMatchObject({
        statusCode: 404,
        errorCode: "RESOURCE_NOT_FOUND",
      });
    });
  });

  describe("list", () => {
    test("should return list of users", async () => {
      const users = [makeUser(), makeUser()];
      const repo = makeRepo({ list: vi.fn().mockResolvedValue(users) });
      const result = await createUserService(repo).list();
      expect(result).toHaveLength(2);
    });

    test("should pass query params to repository", async () => {
      const repo = makeRepo({ list: vi.fn().mockResolvedValue([]) });
      const query = { page: "1", limit: "10" };
      await createUserService(repo).list(query);
      expect(repo.list).toHaveBeenCalledWith(query);
    });
  });

  describe("update", () => {
    test("should return updated user", async () => {
      const user = makeUser();
      const repo = makeRepo({ update: vi.fn().mockResolvedValue(user) });
      const result = await createUserService(repo).update(user.id, {
        name: "New Name",
      });
      expect(repo.update).toHaveBeenCalledWith(user.id, { name: "New Name" });
      expect(result).toEqual(user);
    });

    test("should throw NOT_FOUND when user does not exist", async () => {
      const repo = makeRepo({
        update: vi.fn().mockRejectedValue(Errors.NOT_FOUND("user")),
      });
      await expect(
        createUserService(repo).update(faker.string.uuid(), { name: "x" }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("delete", () => {
    test("should call repository delete", async () => {
      const repo = makeRepo({ delete: vi.fn().mockResolvedValue(undefined) });
      const id = faker.string.uuid();
      await createUserService(repo).delete(id);
      expect(repo.delete).toHaveBeenCalledWith(id);
    });

    test("should throw NOT_FOUND when user does not exist", async () => {
      const repo = makeRepo({
        delete: vi.fn().mockRejectedValue(Errors.NOT_FOUND("user")),
      });
      await expect(
        createUserService(repo).delete(faker.string.uuid()),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("create service", () => {
    test("should return portraitUploadUrl and portraitKey", async () => {
      const user = makeUser();
      const repo = makeRepo({ save: vi.fn().mockResolvedValue(user) });
      const result = await createUserService(repo).create({
        name: user.name,
        email: user.email,
      });
      expect(result.portraitUploadUrl).toBe(
        "https://s3.example.com/presigned-url",
      );
      expect(result.portraitKey).toBe(`portraits/${user.id}.jpg`);
    });
  });

  describe("sendVerificationCode service", () => {
    test("should save code and publish SNS", async () => {
      const user = makeUser();
      const repo = makeRepo({
        getById: vi.fn().mockResolvedValue(user),
        saveVerificationCode: vi.fn().mockResolvedValue(undefined),
      });
      await createUserService(repo).sendVerificationCode(user.id, user.email);
      expect(repo.getById).toHaveBeenCalledWith(user.id);
      expect(repo.saveVerificationCode).toHaveBeenCalledWith(
        user.id,
        expect.stringMatching(/^\d{6}$/),
        expect.any(Number),
      );
    });

    test("should throw NOT_FOUND when user does not exist", async () => {
      const repo = makeRepo({
        getById: vi.fn().mockRejectedValue(Errors.NOT_FOUND("user")),
      });
      await expect(
        createUserService(repo).sendVerificationCode(
          faker.string.uuid(),
          faker.internet.email(),
        ),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("verifyCode service", () => {
    test("should call verifyAndMarkVerified", async () => {
      const repo = makeRepo({
        verifyAndMarkVerified: vi.fn().mockResolvedValue(undefined),
      });
      const id = faker.string.uuid();
      await createUserService(repo).verifyCode(id, "123456");
      expect(repo.verifyAndMarkVerified).toHaveBeenCalledWith(id, "123456");
    });

    test("should throw BAD_REQUEST when code is invalid", async () => {
      const repo = makeRepo({
        verifyAndMarkVerified: vi
          .fn()
          .mockRejectedValue(Errors.BAD_REQUEST("Invalid verification code")),
      });
      await expect(
        createUserService(repo).verifyCode(faker.string.uuid(), "000000"),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});
