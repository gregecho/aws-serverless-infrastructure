export interface BedrockService {
  enrichUserProfile(name: string, email: string): Promise<{ bio: string; tags: string[] }>;
}
