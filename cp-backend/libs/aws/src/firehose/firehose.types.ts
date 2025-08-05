/**
 * types.ts
 * Author: Sujeban Elankeswaran
 * Description: Types for FirehoseService operations
 * Module: LiSLS Boilerplate
 */

import { PutRecordCommandOutput } from '@aws-sdk/client-firehose';

export interface FirehoseParams {
  deliveryStreamName: string;
  data: Uint8Array; // Data to be sent in the record, should be Uint8Array for Firehose compatibility
}

export type FirehoseResult = PutRecordCommandOutput;
