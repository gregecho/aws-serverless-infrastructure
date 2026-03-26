import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { SNSClient } from "@aws-sdk/client-sns";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const isLocal = process.env.IS_OFFLINE === "true";
const region = process.env.AWS_REGION ?? "us-east-1";

const dynamoBase = new DynamoDBClient(
  isLocal
    ? {
        region,
        endpoint: process.env.DYNAMODB_ENDPOINT,
        credentials: { accessKeyId: "local", secretAccessKey: "local" },
      }
    : { region },
);

export const dynamo = DynamoDBDocumentClient.from(dynamoBase);
export const s3Client = new S3Client({ region });
export const sns = new SNSClient({ region });
export const bedrock = new BedrockRuntimeClient({ region });
