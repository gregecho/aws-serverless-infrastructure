import { restApiHandler } from "@@middleware/api";
import { createKinesisService } from "@@services/kinesis/kinesisServiceImpl";
import { Logger } from "@aws-lambda-powertools/logger";
import middy from "@middy/core";
import { KinesisStreamEvent } from "aws-lambda";

const logger = new Logger({ serviceName: "kinesisHandlers" });
const kinesisService = createKinesisService();

export const publishWeatherHandler = restApiHandler({
  openapi: {
    method: "post",
    path: "/kinesis/publish",
    summary: "Publish weather to Kinesis",
    tags: ["Kinesis"],
  },
}).handler(async () => {
  const res = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true",
  );
  const weather = await res.json();

  await kinesisService.publish("weather", weather);

  logger.info("weather published", { weather });
  return { published: true };
});

// Cannot use restApiHandler since it's just for restful api
export const weatherConsumerHandler = middy<KinesisStreamEvent>().handler(
  async (event) => {
    for (const record of event.Records) {
      const payload = JSON.parse(
        Buffer.from(record.kinesis.data, "base64").toString("utf-8"),
      );
      logger.info("weather record received", { payload });
    }
  },
);
