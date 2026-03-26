import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrock } from "@@clients/aws.client";
import type { BedrockService } from "./BedrockService";

class BedrockServiceImpl implements BedrockService {
  async enrichUserProfile(name: string, email: string): Promise<{ bio: string; tags: string[] }> {
    const domain = email.split("@")[1];
    const prompt = `Given a user named "${name}" with email domain "${domain}", generate:
1. A short professional bio (1 sentence, max 20 words)
2. Up to 5 relevant tags (lowercase, single words or short phrases)

Respond with valid JSON only: {"bio": "...", "tags": ["...", "..."]}`;

    const response = await bedrock.send(
      new InvokeModelCommand({
        modelId: "anthropic.claude-3-haiku-20240307-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 256,
          messages: [{ role: "user", content: prompt }],
        }),
      }),
    );

    const raw = JSON.parse(Buffer.from(response.body).toString());
    return JSON.parse(raw.content[0].text);
  }
}

export function createBedrockService(): BedrockService {
  return new BedrockServiceImpl();
}
