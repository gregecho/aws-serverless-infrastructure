import { Errors } from "@@utils/errors";
import { UserServiceImpl } from "@@services/user/userServiceImpl";
import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  createUserHandler,
  deleteUserHandler,
  getPortraitUploadUrlHandler,
  getUserByIdHandler,
  listUsersHandler,
  sendVerificationCodeHandler,
  updateUserHandler,
  verifyCodeHandler,
} from "..";

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://s3.example.com/presigned-url"),
}));

vi.mock("@aws-sdk/client-sns", () => ({
  SNSClient: vi.fn().mockImplementation(function () {
    return { send: vi.fn().mockResolvedValue({}) };
  }),
  PublishCommand: vi.fn(),
}));

vi.mock("@@clients/aws.client", () => ({
  dynamo: { send: vi.fn().mockResolvedValue({}) },
  s3Client: {},
  sns: { send: vi.fn().mockResolvedValue({}) },
  bedrock: {},
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("User handler", () => {
  describe("createUser handler", () => {
    const mockCreate = vi.fn();
    vi.spyOn(UserServiceImpl.prototype, "create").mockImplementation(mockCreate);

    test("should return 200 when user created", async () => {
      const name = faker.person.firstName();
      const email = faker.internet.email();
      mockCreate.mockResolvedValue({
        id: faker.string.uuid(),
        name,
        email,
        createdAt: faker.date.anytime().toDateString(),
        bio: "A great professional.",
        tags: ["tech"],
      });

      const event = {
        body: JSON.stringify({ name, email }),
        headers: { "Content-Type": "application/json" },
      } as any;

      const response = await createUserHandler(event, {} as any);
      expect(mockCreate).toHaveBeenCalledWith({ name, email });
      expect(response!.statusCode).toBe(200);
      const body = JSON.parse(response!.body);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({ name, email, bio: "A great professional.", tags: ["tech"] });
    });

    test("should return 400 when email is invalid", async () => {
      const event = {
        body: JSON.stringify({ name: faker.person.firstName(), email: "invalid-email-format" }),
        headers: { "Content-Type": "application/json" },
      } as any;

      const response = await createUserHandler(event, {} as any);
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("getPortraitUploadUrl handler", () => {
    const mockGetUrl = vi.fn();
    vi.spyOn(UserServiceImpl.prototype, "getPortraitUploadUrl").mockImplementation(mockGetUrl);

    test("should return 200 with uploadUrl and portraitKey", async () => {
      const userId = faker.string.uuid();
      mockGetUrl.mockResolvedValue({
        uploadUrl: "https://s3.example.com/presigned-url",
        portraitKey: `portraits/${userId}.jpg`,
      });

      const event = {
        pathParameters: { id: userId },
        body: null,
        headers: { "Content-Type": "application/json" },
      } as any;

      const response = await getPortraitUploadUrlHandler(event, {} as any);
      expect(mockGetUrl).toHaveBeenCalledWith(userId);
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.uploadUrl).toBe("https://s3.example.com/presigned-url");
      expect(body.data.portraitKey).toBe(`portraits/${userId}.jpg`);
    });

    test("should return 404 when user does not exist", async () => {
      mockGetUrl.mockRejectedValue(Errors.NOT_FOUND("user"));

      const event = {
        pathParameters: { id: faker.string.uuid() },
        body: null,
        headers: { "Content-Type": "application/json" },
      } as any;

      const response = await getPortraitUploadUrlHandler(event, {} as any);
      expect(response.statusCode).toBe(404);
    });
  });

  describe("getUserById handler", () => {
    const mockGetById = vi.fn();
    vi.spyOn(UserServiceImpl.prototype, "getById").mockImplementation(mockGetById);

    test("should return 200 when user exists", async () => {
      const userId = faker.string.uuid();
      const name = faker.person.firstName();
      const email = faker.internet.email();
      mockGetById.mockResolvedValue({ id: userId, name, email, createdAt: faker.date.anytime().toDateString() });

      const event = {
        pathParameters: { id: userId },
        body: "{}",
        headers: { "Content-Type": "application/json" },
      } as any;

      const response = await getUserByIdHandler(event, {} as any);
      expect(mockGetById).toHaveBeenCalledWith(userId);
      expect(response!.statusCode).toBe(200);
      const body = JSON.parse(response!.body);
      expect(body.data).toMatchObject({ id: userId, name, email });
    });

    test("should return 404 when user does not exist", async () => {
      const userId = faker.string.uuid();
      mockGetById.mockRejectedValue(Errors.NOT_FOUND("user"));

      const event = {
        pathParameters: { id: userId },
        body: "{}",
        headers: { "Content-Type": "application/json" },
      } as any;

      const response = await getUserByIdHandler(event, {} as any);
      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body).error.code).toBe("RESOURCE_NOT_FOUND");
    });
  });

  describe("listUsers handler", () => {
    const mockList = vi.fn();
    vi.spyOn(UserServiceImpl.prototype, "list").mockImplementation(mockList);

    test("should return 200 with list of users", async () => {
      const users = Array.from({ length: 3 }, () => ({
        id: faker.string.uuid(),
        name: faker.person.firstName(),
        email: faker.internet.email(),
        createdAt: new Date().toISOString(),
      }));
      mockList.mockResolvedValue(users);

      const event = { queryStringParameters: null, body: null, headers: { "Content-Type": "application/json" } } as any;
      const response = await listUsersHandler(event, {} as any);
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).data).toHaveLength(3);
    });

    test("should return 200 with empty list", async () => {
      mockList.mockResolvedValue([]);
      const event = { queryStringParameters: null, body: null, headers: { "Content-Type": "application/json" } } as any;
      const response = await listUsersHandler(event, {} as any);
      expect(JSON.parse(response.body).data).toEqual([]);
    });
  });

  describe("updateUser handler", () => {
    const mockUpdate = vi.fn();
    vi.spyOn(UserServiceImpl.prototype, "update").mockImplementation(mockUpdate);

    test("should return 200 with updated user", async () => {
      const userId = faker.string.uuid();
      const updated = { id: userId, name: "Updated Name", email: faker.internet.email(), createdAt: new Date().toISOString() };
      mockUpdate.mockResolvedValue(updated);

      const event = {
        pathParameters: { id: userId },
        body: JSON.stringify({ name: "Updated Name" }),
        headers: { "Content-Type": "application/json" },
      } as any;

      const response = await updateUserHandler(event, {} as any);
      expect(mockUpdate).toHaveBeenCalledWith(userId, { name: "Updated Name" });
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).data.name).toBe("Updated Name");
    });

    test("should return 404 when user does not exist", async () => {
      mockUpdate.mockRejectedValue(Errors.NOT_FOUND("user"));
      const event = {
        pathParameters: { id: faker.string.uuid() },
        body: JSON.stringify({ name: "New Name" }),
        headers: { "Content-Type": "application/json" },
      } as any;
      const response = await updateUserHandler(event, {} as any);
      expect(response.statusCode).toBe(404);
    });
  });

  describe("deleteUser handler", () => {
    const mockDelete = vi.fn();
    vi.spyOn(UserServiceImpl.prototype, "delete").mockImplementation(mockDelete);

    test("should return 200 when user deleted", async () => {
      const userId = faker.string.uuid();
      mockDelete.mockResolvedValue(undefined);
      const event = { pathParameters: { id: userId }, body: null, headers: { "Content-Type": "application/json" } } as any;
      const response = await deleteUserHandler(event, {} as any);
      expect(mockDelete).toHaveBeenCalledWith(userId);
      expect(response.statusCode).toBe(200);
    });

    test("should return 404 when user does not exist", async () => {
      mockDelete.mockRejectedValue(Errors.NOT_FOUND("user"));
      const event = { pathParameters: { id: faker.string.uuid() }, body: null, headers: { "Content-Type": "application/json" } } as any;
      const response = await deleteUserHandler(event, {} as any);
      expect(response.statusCode).toBe(404);
    });
  });

  describe("sendVerificationCode handler", () => {
    const mockSend = vi.fn();
    vi.spyOn(UserServiceImpl.prototype, "sendVerificationCode").mockImplementation(mockSend);

    test("should return 200 when code sent", async () => {
      const userId = faker.string.uuid();
      const email = faker.internet.email();
      mockSend.mockResolvedValue(undefined);
      const event = {
        pathParameters: { id: userId },
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      } as any;
      const response = await sendVerificationCodeHandler(event, {} as any);
      expect(mockSend).toHaveBeenCalledWith(userId, email);
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).data.message).toBe("Verification code sent");
    });

    test("should return 400 when email is missing", async () => {
      const event = {
        pathParameters: { id: faker.string.uuid() },
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      } as any;
      const response = await sendVerificationCodeHandler(event, {} as any);
      expect(response.statusCode).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    test("should return 404 when user does not exist", async () => {
      mockSend.mockRejectedValue(Errors.NOT_FOUND("user"));
      const event = {
        pathParameters: { id: faker.string.uuid() },
        body: JSON.stringify({ email: faker.internet.email() }),
        headers: { "Content-Type": "application/json" },
      } as any;
      const response = await sendVerificationCodeHandler(event, {} as any);
      expect(response.statusCode).toBe(404);
    });
  });

  describe("verifyCode handler", () => {
    const mockVerify = vi.fn();
    vi.spyOn(UserServiceImpl.prototype, "verifyCode").mockImplementation(mockVerify);

    test("should return 200 when code is valid", async () => {
      const userId = faker.string.uuid();
      mockVerify.mockResolvedValue(undefined);
      const event = {
        pathParameters: { id: userId },
        body: JSON.stringify({ code: "123456" }),
        headers: { "Content-Type": "application/json" },
      } as any;
      const response = await verifyCodeHandler(event, {} as any);
      expect(mockVerify).toHaveBeenCalledWith(userId, "123456");
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).data.message).toBe("Email verified");
    });

    test("should return 400 when code length is not 6", async () => {
      const event = {
        pathParameters: { id: faker.string.uuid() },
        body: JSON.stringify({ code: "12" }),
        headers: { "Content-Type": "application/json" },
      } as any;
      const response = await verifyCodeHandler(event, {} as any);
      expect(response.statusCode).toBe(400);
      expect(mockVerify).not.toHaveBeenCalled();
    });

    test("should return 400 when code is invalid", async () => {
      mockVerify.mockRejectedValue(Errors.BAD_REQUEST("Invalid verification code"));
      const event = {
        pathParameters: { id: faker.string.uuid() },
        body: JSON.stringify({ code: "000000" }),
        headers: { "Content-Type": "application/json" },
      } as any;
      const response = await verifyCodeHandler(event, {} as any);
      expect(response.statusCode).toBe(400);
    });
  });
});
