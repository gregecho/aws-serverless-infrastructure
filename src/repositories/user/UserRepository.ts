import type { UserBody, UserResponse } from '@@schemas/user/userSchema';

export interface UserRepository {
  getById(userId: string): Promise<UserResponse>;
  save(user: UserBody): Promise<UserResponse>;
  update(userId: string, user: Partial<UserBody>): Promise<UserResponse>;
  delete(userId: string): Promise<void>;
  list(query?: Record<string, string | undefined>): Promise<UserResponse[]>;
  saveVerificationCode(userId: string, code: string, expiry: number): Promise<void>;
  verifyAndMarkVerified(userId: string, code: string): Promise<void>;
}
