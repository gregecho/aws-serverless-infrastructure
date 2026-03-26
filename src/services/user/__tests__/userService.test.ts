import { UserRepository } from "@@repositories/user/UserRepository";
import { UserResponse } from "@@schemas/user/userSchema";
import { BedrockService } from "@@services/ai/BedrockService";
import { Errors } from "@@utils/errors";
import { faker } from "@faker-js/faker";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { createUserService } from "../userServiceImpl";

beforeAll(() => {
  vi.stubEnv("USERS_TABLE", "mock-USERS_TABLE");
  vi.stubEnv("PORTRAITS_BUCKET", "mock-portraits-bucket");
  vi.stubEnv("VERIFICATION_TOPIC_ARN", "arn:aws:sns:us-east-1:123456789012:mock-topic");
});

beforeEach(() => {
  vi.clearAllMocks();
});

vi.mock("@@clients/aws.client", () => ({
  dynamo: { send: vi.fn().mockResolvedValue({}) },
  s3Client: {},
  sns: { send: vi.fn().mockResolvedValue({}) },
  bedrock: {},
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://s3.example.com/presigned-url"),
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

const makeBedrock = (overrides: Partial<BedrockService> = {}): BedrockService => ({
  enrichUserProfile: vi.fn().mockResolvedValue({ bio: "A great professional.", tags: ["tech"] }),
  ...overrides,
});

describe("User service", () => {
  describe("create", () => {
    test("should save user and enrich with bio/tags", async () => {
      const user = makeUser();
      const repo = makeRepo({
        save: vi.fn().mockResolvedValue(user),
        update: vi.fn().mockResolvedValue({ ...user, bio: "A great professional.", tags: ["tech"] }),
      });
      const bedrock = makeBedrock();
      const result = await createUserService(repo, bedrock).create({ name: user.name, email: user.email });
      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(bedrock.enrichUserProfile).toHaveBeenCalledWith(user.name, user.email);
      expect(repo.update).toHaveBeenCalledWith(user.id, { bio: "A great professional.", tags: ["tech"] });
      expect(result.bio).toBe("A great professional.");
      expect(result.tags).toEqual(["tech"]);
    });

    test("should return user without enrichment if Bedrock fails", async () => {
      const user = makeUser();
      const repo = makeRepo({ save: vi.fn().mockResolvedValue(user), update: vi.fn() });
      const bedrock = makeBedrock({
        enrichUserProfile: vi.fn().mockRejectedValue(new Error("Bedrock unavailable")),
      });
      const result = await createUserService(repo, bedrock).create({ name: user.name, email: user.email });
      expect(repo.update).not.toHaveBeenCalled();
      expect(result).toEqual(user);
    });
  });

  describe("getPortraitUploadUrl", () => {
    test("should return uploadUrl and portraitKey for existing user", async () => {
      const user = makeUser();
      const repo = makeRepo({ getById: vi.fn().mockResolvedValue(user) });
      const result = await createUserService(repo, makeBedrock()).getPortraitUploadUrl(user.id);
      expect(repo.getById).toHaveBeenCalledWith(user.id);
      expect(result.uploadUrl).toBe("https://s3.example.com/presigned-url");
      expect(result.portraitKey).toBe(`portraits/${user.id}.jpg`);
    });

    test("should throw NOT_FOUND when user does not exist", async () => {
      const repo = makeRepo({ getById: vi.fn().mockRejectedValue(Errors.NOT_FOUND("user")) });
      await expect(
        createUserService(repo, makeBedrock()).getPortraitUploadUrl(faker.string.uuid()),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("getById", () => {
    test("should return user when found", async () => {
      const user = makeUser();
      const repo = makeRepo({ getById: vi.fn().mockResolvedValue(user) });
      const result = await createUserService(repo, makeBedrock()).getById(user.id);
      expect(repo.getById).toHaveBeenCalledWith(user.id);
      expect(result).toEqual(user);
    });

    test("should throw NOT_FOUND when user does not exist", async () => {
      const repo = makeRepo({ getById: vi.fn().mockRejectedValue(Errors.NOT_FOUND("user")) });
      await expect(
        createUserService(repo, makeBedrock()).getById(faker.string.uuid()),
      ).rejects.toMatchObject({ statusCode: 404, errorCode: "RESOURCE_NOT_FOUND" });
    });
  });

  describe("list", () => {
    test("should return list of users", async () => {
      const users = [makeUser(), makeUser()];
      const repo = makeRepo({ list: vi.fn().mockResolvedValue(users) });
      const result = await createUserService(repo, makeBedrock()).list();
      expect(result).toHaveLength(2);
    });

    test("should pass query params to repository", async () => {
      const repo = makeRepo({ list: vi.fn().mockResolvedValue([]) });
      const query = { page: "1", limit: "10" };
      await createUserService(repo, makeBedrock()).list(query);
      expect(repo.list).toHaveBeenCalledWith(query);
    });
  });

  describe("update", () => {
    test("should return updated user", async () => {
      const user = makeUser();
      const repo = makeRepo({ update: vi.fn().mockResolvedValue(user) });
      const result = await createUserService(repo, makeBedrock()).update(user.id, { name: "New Name" });
      expect(repo.update).toHaveBeenCalledWith(user.id, { name: "New Name" });
      expect(result).toEqual(user);
    });

    test("should throw NOT_FOUND when user does not exist", async () => {
      const repo = makeRepo({ update: vi.fn().mockRejectedValue(Errors.NOT_FOUND("user")) });
      await expect(
        createUserService(repo, makeBedrock()).update(faker.string.uuid(), { name: "x" }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("delete", () => {
    test("should call repository delete", async () => {
      const repo = makeRepo({ delete: vi.fn().mockResolvedValue(undefined) });
      const id = faker.string.uuid();
      await createUserService(repo, makeBedrock()).delete(id);
      expect(repo.delete).toHaveBeenCalledWith(id);
    });

    test("should throw NOT_FOUND when user does not exist", async () => {
      const repo = makeRepo({ delete: vi.fn().mockRejectedValue(Errors.NOT_FOUND("user")) });
      await expect(
        createUserService(repo, makeBedrock()).delete(faker.string.uuid()),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("sendVerificationCode", () => {
    test("should save code and publish SNS", async () => {
      const user = makeUser();
      const repo = makeRepo({
        getById: vi.fn().mockResolvedValue(user),
        saveVerificationCode: vi.fn().mockResolvedValue(undefined),
      });
      await createUserService(repo, makeBedrock()).sendVerificationCode(user.id, user.email);
      expect(repo.getById).toHaveBeenCalledWith(user.id);
      expect(repo.saveVerificationCode).toHaveBeenCalledWith(
        user.id,
        expect.stringMatching(/^\d{6}$/),
        expect.any(Number),
      );
    });

    test("should throw NOT_FOUND when user does not exist", async () => {
      const repo = makeRepo({ getById: vi.fn().mockRejectedValue(Errors.NOT_FOUND("user")) });
      await expect(
        createUserService(repo, makeBedrock()).sendVerificationCode(faker.string.uuid(), faker.internet.email()),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("verifyCode", () => {
    test("should call verifyAndMarkVerified", async () => {
      const repo = makeRepo({ verifyAndMarkVerified: vi.fn().mockResolvedValue(undefined) });
      const id = faker.string.uuid();
      await createUserService(repo, makeBedrock()).verifyCode(id, "123456");
      expect(repo.verifyAndMarkVerified).toHaveBeenCalledWith(id, "123456");
    });

    test("should throw BAD_REQUEST when code is invalid", async () => {
      const repo = makeRepo({
        verifyAndMarkVerified: vi.fn().mockRejectedValue(Errors.BAD_REQUEST("Invalid verification code")),
      });
      await expect(
        createUserService(repo, makeBedrock()).verifyCode(faker.string.uuid(), "000000"),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});
