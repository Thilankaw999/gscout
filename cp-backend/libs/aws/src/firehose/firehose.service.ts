/**
 * firehose.service.ts
 * Author: Sujeban Elankeswaran
 * Description: AWS Firehose Service for streaming data into Firehose delivery streams.
 * Module: LiSLS Boilerplate
 */

import { Injectable } from '@nestjs/common';
import {
  FirehoseClient,
  PutRecordCommand,
  PutRecordCommandInput,
} from '@aws-sdk/client-firehose';
import { Logger } from '@app/logger';

export const MAX_RECORD_SIZE: number = 1023900;

@Injectable()
export class FirehoseService {
  private readonly firehoseClient: FirehoseClient;

  constructor(private readonly logger: Logger) {
    // Initialize FirehoseClient with the configured AWS region
    this.firehoseClient = new FirehoseClient({
      region: process.env.AWS_REGION,
    });
  }

  public async putRecord(data: object, streamName: string): Promise<void> {
    const dataSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
    if (dataSize <= MAX_RECORD_SIZE) {
      await this._sendRecordToFirehose(data, streamName);
    } else {
      this.logger.debug(
        `Data size exceeds the allowed limit. Splitting data...`,
      );
      await this._splitAndSend(data, streamName);
    }
  }

  private async _sendRecordToFirehose(
    data: object | string,
    streamName: string,
  ): Promise<void> {
    const params: PutRecordCommandInput = {
      DeliveryStreamName: streamName,
      Record: { Data: Buffer.from(JSON.stringify(data)) },
    };
    const command = new PutRecordCommand(params);

    try {
      await this.firehoseClient.send(command);
    } catch (err) {
      this.logger.debug('Error when sending record to Kinesis:', err);
      throw err;
    }
  }

  private async _splitAndSend(data: object, streamName: string): Promise<void> {
    const parts = this._splitData(JSON.stringify(data), MAX_RECORD_SIZE);
    const promises = parts.map((part) =>
      this._sendRecordToFirehose(part, streamName),
    );
    await Promise.all(promises);
  }

  private _splitData(data: string, maxSize: number): string[] {
    const dataSize = Buffer.byteLength(data, 'utf8');
    const numberOfParts = Math.ceil(dataSize / maxSize);
    const partSize = Math.floor(data.length / numberOfParts);

    const parts: string[] = [];
    for (let i = 0; i < numberOfParts; i++) {
      const start = i * partSize;
      const end = (i + 1) * partSize;
      parts.push(data.substring(start, end));
    }

    return parts;
  }
}
