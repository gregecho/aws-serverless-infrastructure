import type { AWS } from "@serverless/typescript";

const base = "src/handlers/kinesis/index";

export const kinesisFunctions: AWS["functions"] = {
  "kinesis-publish": {
    handler: `${base}.publishWeatherHandler`,
    events: [{ http: { path: "/kinesis/publish", method: "POST" } }],
  },
  "kinesis-consumer": {
    handler: `${base}.weatherConsumerHandler`,
    events: [
      {
        stream: {
          type: "kinesis",
          arn: { "Fn::GetAtt": ["WeatherStream", "Arn"] },
          startingPosition: "LATEST",
          batchSize: 10,
        },
      },
    ],
  },
};
