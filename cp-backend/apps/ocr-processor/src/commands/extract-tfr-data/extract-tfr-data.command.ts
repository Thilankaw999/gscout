/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: Extract TFR Data Command
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

export class ExtractTfrDataCommand {
  constructor(
    public readonly documentId: number,
    public readonly s3Bucket: string,
    public readonly s3Key: string,
    public readonly forceReprocess: boolean = false,
  ) {}
}
