/**
 * dynamodb.service.ts
 * Author: Sujeban Elankeswaran
 * Description: Service for managing interactions with AWS DynamoDB.
 * Module: LiSLS Boilerplate
 */

import { Injectable } from '@nestjs/common';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
  DeleteItemCommandInput,
  GetItemCommandInput,
  PutItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

@Injectable()
export class DynamoDBService {
  private readonly dynamoDBClient: DynamoDBClient;

  constructor() {
    this.dynamoDBClient = new DynamoDBClient({
      region: process.env.AWS_REGION,
    });
  }

  /**
   * Puts an item in the specified DynamoDB table, using marshalling to handle data types.
   * @param params - The parameters for the PutItem command, without data type annotations.
   * @returns A promise that resolves when the item has been added to the table.
   */
  async putItem(
    params: Omit<PutItemCommandInput, 'Item'> & { Item: Record<string, any> },
  ): Promise<void> {
    const marshalledParams: PutItemCommandInput = {
      ...params,
      Item: marshall(params.Item),
    };
    const command = new PutItemCommand(marshalledParams);
    await this.dynamoDBClient.send(command);
  }

  /**
   * Gets an item from the specified DynamoDB table, automatically unmarshalling the data to JavaScript types.
   * @param params - The parameters for the GetItem command.
   * @returns A promise that resolves with the retrieved item in JavaScript object format, or undefined if not found.
   */
  async getItem(
    params: Omit<GetItemCommandInput, 'Key'> & { Key: Record<string, any> },
  ): Promise<Record<string, any> | undefined> {
    const marshalledParams: GetItemCommandInput = {
      ...params,
      Key: marshall(params.Key),
    };
    const command = new GetItemCommand(marshalledParams);
    const response = await this.dynamoDBClient.send(command);
    return response.Item ? unmarshall(response.Item) : undefined;
  }

  /**
   * Deletes an item from the specified DynamoDB table.
   * @param params - The parameters for the DeleteItem command, automatically marshalling the key data types.
   * @returns A promise that resolves when the item has been deleted.
   */
  async deleteItem(
    params: Omit<DeleteItemCommandInput, 'Key'> & { Key: Record<string, any> },
  ): Promise<void> {
    const marshalledParams: DeleteItemCommandInput = {
      ...params,
      Key: marshall(params.Key),
    };
    const command = new DeleteItemCommand(marshalledParams);
    await this.dynamoDBClient.send(command);
  }
}
