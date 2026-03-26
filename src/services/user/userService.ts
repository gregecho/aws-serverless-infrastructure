import type { UserBody, UserResponse, UserUpdateFields } from "@@schemas/user/userSchema";

export interface UserService {
  create(body: UserBody): Promise<UserResponse>;
  getById(id: string): Promise<UserResponse>;
  list(query?: Record<string, string | undefined>): Promise<UserResponse[]>;
  update(id: string, body: UserUpdateFields): Promise<UserResponse>;
  delete(id: string): Promise<void>;
  sendVerificationCode(id: string, email: string): Promise<void>;
  verifyCode(id: string, code: string): Promise<void>;
  getPortraitUploadUrl(userId: string): Promise<{ uploadUrl: string; portraitKey: string }>;
}
