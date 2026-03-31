import { kinesis } from "@@clients/aws.client";
import { KinesisService } from "./kinesisService";
import {
  PutRecordCommand,
  PutRecordCommandOutput,
} from "@aws-sdk/client-kinesis";

export class KinesisServiceImpl implements KinesisService {
  async publish(
    partitionKey: string,
    data: string,
  ): Promise<PutRecordCommandOutput> {
    return kinesis.send(
      new PutRecordCommand({
        StreamName: process.env.WEATHER_STREAM_NAME,
        PartitionKey: partitionKey,
        Data: Buffer.from(JSON.stringify(data)),
      }),
    );
  }
}

export function createKinesisService(): KinesisService {
  return new KinesisServiceImpl();
}
