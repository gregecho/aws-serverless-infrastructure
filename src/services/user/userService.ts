import { s3Client } from "@@clients/s3Client";
import { sns } from "@@clients/snsClient";
import { UserRepository } from "@@repositories/user/UserRepository";
import type { UserBody, UserResponse } from "@@schemas/user/userSchema";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PublishCommand } from "@aws-sdk/client-sns";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const PORTRAITS_BUCKET = process.env.PORTRAITS_BUCKET!;
const VERIFICATION_TOPIC_ARN = process.env.VERIFICATION_TOPIC_ARN!;

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async create(body: UserBody): Promise<UserResponse> {
    const user = await this.repository.save(body);

    const portraitKey = `portraits/${user.id}.jpg`;
    const putCommand = new PutObjectCommand({
      Bucket: PORTRAITS_BUCKET,
      Key: portraitKey,
    });
    const portraitUploadUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: 300,
    });

    return { ...user, portraitUploadUrl, portraitKey };
  }

  async getById(id: string): Promise<UserResponse> {
    return this.repository.getById(id);
  }

  async list(
    query?: Record<string, string | undefined>,
  ): Promise<UserResponse[]> {
    return this.repository.list(query);
  }

  async update(id: string, body: Partial<UserBody>): Promise<UserResponse> {
    return this.repository.update(id, body);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async sendVerificationCode(id: string, email: string): Promise<void> {
    await this.repository.getById(id); // ensure user exists
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await this.repository.saveVerificationCode(id, code, expiry);
    await sns.send(
      new PublishCommand({
        TopicArn: VERIFICATION_TOPIC_ARN,
        Message: `Your verification code is: ${code}`,
        Subject: "Email Verification",
        MessageAttributes: {
          email: { DataType: "String", StringValue: email },
        },
      }),
    );
  }

  async verifyCode(id: string, code: string): Promise<void> {
    await this.repository.verifyAndMarkVerified(id, code);
  }
}

export function createUserService(repository: UserRepository): UserService {
  return new UserService(repository);
}
