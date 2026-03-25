import { userFunctions } from "@@handlers/user/user.serverless";
import type { AWS } from "@serverless/typescript";

const serverlessConfiguration: AWS = {
  service: "aws-serverless-infrastructure",
  useDotenv: true,
  frameworkVersion: "4",

  provider: {
    name: "aws",
    runtime: "nodejs22.x",
    region: "us-east-1",

    tracing: {
      lambda: true,
      apiGateway: true,
    },

    environment: {
      // DO NOT hardcode any resource
      //aws-serverless-infrastructure-users-dev
      USERS_TABLE: "${self:service}-users-${sls:stage}",
      IS_OFFLINE: '${env:IS_OFFLINE, "false"}',
      DYNAMODB_ENDPOINT: '${env:DYNAMODB_ENDPOINT, ""}',
      PORTRAITS_BUCKET: "${self:service}-portraits-${sls:stage}",
      VERIFICATION_TOPIC_ARN: { Ref: "VerificationTopic" },
    },

    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
            Resource: "*",
          },
          {
            Effect: "Allow",
            Action: [
              "dynamodb:PutItem",
              "dynamodb:GetItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem",
              "dynamodb:Query",
              "dynamodb:Scan",
            ],
            Resource: [
              { "Fn::GetAtt": ["UsersTable", "Arn"] },
              // Permission for index
              {
                "Fn::Join": [
                  "/",
                  [{ "Fn::GetAtt": ["UsersTable", "Arn"] }, "index/*"],
                ],
              },
            ],
          },
          {
            Effect: "Allow",
            Action: ["s3:PutObject"],
            Resource: {
              "Fn::Join": [
                "",
                [
                  "arn:aws:s3:::",
                  "${self:service}-portraits-${sls:stage}",
                  "/*",
                ],
              ],
            },
          },
          {
            Effect: "Allow",
            Action: ["sns:Publish"],
            Resource: { Ref: "VerificationTopic" },
          },
        ],
      },
    },
  },

  plugins: ["serverless-offline"],

  build: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["@aws-sdk/*"],
    },
  },

  functions: {
    ...userFunctions,
  },

  resources: {
    Resources: {
      UsersTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "${self:provider.environment.USERS_TABLE}",
          BillingMode: "PAY_PER_REQUEST",
          AttributeDefinitions: [
            {
              AttributeName: "PK",
              AttributeType: "S",
            },
            {
              AttributeName: "SK",
              AttributeType: "S",
            },
            { AttributeName: "Email", AttributeType: "S" },
          ],
          KeySchema: [
            {
              AttributeName: "PK",
              KeyType: "HASH",
            },
            {
              AttributeName: "SK",
              KeyType: "RANGE",
            },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "EmailIndex",
              KeySchema: [{ AttributeName: "Email", KeyType: "HASH" }],
              Projection: { ProjectionType: "ALL" },
            },
          ],
        },
      },
      DocsBucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "${self:service}-docs-${sls:stage}",
          WebsiteConfiguration: {
            IndexDocument: "index.html",
          },
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: false,
            BlockPublicPolicy: false,
            IgnorePublicAcls: false,
            RestrictPublicBuckets: false,
          },
        },
      },
      DocsBucketPolicy: {
        Type: "AWS::S3::BucketPolicy",
        Properties: {
          Bucket: { Ref: "DocsBucket" },
          PolicyDocument: {
            Statement: [
              {
                Effect: "Allow",
                Principal: "*",
                Action: "s3:GetObject",
                Resource: {
                  "Fn::Join": [
                    "",
                    [{ "Fn::GetAtt": ["DocsBucket", "Arn"] }, "/*"],
                  ],
                },
              },
            ],
          },
        },
      },
      PortraitsBucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "${self:service}-portraits-${sls:stage}",
        },
      },
      VerificationTopic: {
        Type: "AWS::SNS::Topic",
        Properties: {
          TopicName: "${self:service}-verification-${sls:stage}",
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
