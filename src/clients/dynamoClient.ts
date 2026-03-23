import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const isLocal = process.env.IS_OFFLINE === 'true';

const client = new DynamoDBClient(
  isLocal // enable local dynamoDB for local dev
    ? {
        region: 'localhost',
        endpoint: 'http://localhost:8000',
        credentials: {
          accessKeyId: 'local',
          secretAccessKey: 'local',
        },
      }
    : {}, // defalut to PROD
);

export const dynamo = DynamoDBDocumentClient.from(client);
