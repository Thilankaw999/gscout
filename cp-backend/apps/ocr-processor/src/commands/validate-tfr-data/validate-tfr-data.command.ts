/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: Validate TFR Data Command
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

export class ValidateTfrDataCommand {
  constructor(
    public readonly documentId: number,
    public readonly bankStatementS3Key?: string,
    public readonly bankName?: string,
  ) {}
}
