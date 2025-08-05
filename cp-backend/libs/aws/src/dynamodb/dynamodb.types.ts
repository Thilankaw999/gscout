/**
 * dynamodb.types.ts
 * Author: Sujeban Elankeswaran
 * Description: Specific type definitions for DynamoDB operations.
 * Module: LiSLS Boilerplate
 */

import {
  PutItemCommandInput,
  GetItemCommandInput,
  DeleteItemCommandInput,
  UpdateItemCommandInput,
  QueryCommandInput,
  ScanCommandInput,
} from '@aws-sdk/client-dynamodb';

// Re-exporting the selected types
export {
  PutItemCommandInput,
  GetItemCommandInput,
  DeleteItemCommandInput,
  UpdateItemCommandInput,
  QueryCommandInput,
  ScanCommandInput,
};
