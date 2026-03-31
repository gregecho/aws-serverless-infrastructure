import { PutRecordCommandOutput } from "@aws-sdk/client-kinesis";

export interface KinesisService {
  publish(partitionKey: string, data: string): Promise<PutRecordCommandOutput>;
}
