import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const baseUserSchema = z
  .object({
    name: z
      .string()
      .min(2, "name too short")
      .describe("user name")
      .meta({ example: "first name" }),
    email: z
      .email("invalid email")
      .describe("users email")
      .meta({ example: "test@test.com" }),
  })
  .openapi("BaseUser");

// partial: Make all fields to optional
export const updateUserRequestSchema = baseUserSchema
  .partial()
  .openapi("UpdateUserRequest");

export const createUserRequestSchema = baseUserSchema
  .extend({
    portraitKey: z.string().optional().describe("Uploaded portrait"),
  })
  .openapi("createUserRequest");

export const getUserRequestSchema = z.object({
  pathParameters: z.object({
    userId: z.string().describe("unique identifier of user to retrieve").meta({
      example: "123-123-123-12345",
    }),
  }),
});

export const userIdPathSchema = z.object({
  id: z.uuid(),
});

export const listUsersQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

// extend: Use extend to add additional createAt
// omit: Use omit to remove additional properties
export const userResponseSchema = baseUserSchema
  .extend({
    id: z.uuid().describe("user id"),
    createdAt: z
      .string()
      .describe("User created at")
      .meta({ example: "1900-01-01" }),
    portraitUploadUrl: z
      .string()
      .url()
      .optional()
      .describe("Presigned S3 URL to upload portrait"),
    portraitKey: z.string().optional().describe("S3 key for the portrait"),
  })
  .openapi("UserResponse");

export const listUsersResponseSchema = z.array(userResponseSchema);

export const sendVerificationCodeRequestSchema = z
  .object({ email: z.email() })
  .openapi("SendVerificationCodeRequest");

export const verifyCodeRequestSchema = z
  .object({ code: z.string().length(6) })
  .openapi("VerifyCodeRequest");

export const verificationResponseSchema = z
  .object({ message: z.string() })
  .openapi("VerificationResponse");

export type UserResponse = z.infer<typeof userResponseSchema>;
export type UserRequest = z.infer<typeof createUserRequestSchema>;
export type UserBody = z.infer<typeof baseUserSchema>;

export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
export type SendVerificationCodeRequest = z.infer<
  typeof sendVerificationCodeRequestSchema
>;
export type VerifyCodeRequest = z.infer<typeof verifyCodeRequestSchema>;
