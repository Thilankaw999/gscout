# Girl Scouts Infrastructure

This CDK project manages the infrastructure for the Girl Scouts application, including database, application services, OCR processing, and AI chatbot capabilities.

## Architecture Overview

The infrastructure is organized into separate stacks for better maintainability and deployment flexibility:

1. **Database Stack** (`database-stack.ts`) - Stateful database resources
2. **Infrastructure Stack** (`infrastructure.ts`) - Core application infrastructure  
3. **OCR Stack** (`girl-scouts-ocr-stack.ts`) - Document processing capabilities
4. **Bedrock Agent Stack** (`bedrock-agent-stack.ts`) - AI chatbot and form processing

## Stacks

### Database Stack
- Persistent data storage
- Database configurations
- Backup and recovery settings

### Infrastructure Stack  
- Core application services
- API Gateway configurations
- Lambda functions for business logic

### OCR Processing Stack
- Document upload handling
- OCR text extraction
- Document processing workflows

### Bedrock Agent Stack
- AI-powered chatbot using AWS Bedrock
- Multi-form data collection (Personal Info & Vehicle Details)
- Action groups with Lambda backends
- Natural language form guidance

## Quick Start

### Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js and npm installed
- CDK CLI: `npm install -g aws-cdk`

### Deployment

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Deploy all stacks (recommended order)
npx cdk deploy --all --context stage=dev

# Or deploy specific stacks
npx cdk deploy girl-scouts-dev-database-stack
npx cdk deploy girl-scouts-dev-infrastructure-stack
npx cdk deploy girl-scouts-dev-ocr-stack
npx cdk deploy girl-scouts-dev-bedrock-agent-stack
```

### Bedrock Agent Deployment
For detailed Bedrock Agent deployment and configuration:

```bash
# Use the dedicated deployment script
./scripts/deploy-bedrock-agent.sh dev

# Windows PowerShell
.\scripts\deploy-bedrock-agent.ps1 -Stage dev
```

## Environment Configuration

After deployment, configure your applications with the output values:

```bash
# Database connection details (from Database Stack)
DATABASE_HOST=<database-endpoint>
DATABASE_PORT=<database-port>

# Bedrock Agent configuration (from Bedrock Agent Stack)  
BEDROCK_AGENT_ID=<agent-id>
BEDROCK_AGENT_ALIAS_ID=<alias-id>
AWS_REGION=<deployment-region>

# OCR configuration (from OCR Stack)
OCR_BUCKET_NAME=<document-bucket>
OCR_PROCESSOR_ARN=<processor-function-arn>
```

## Documentation

- [Bedrock Agent Setup and Usage](./docs/BEDROCK_AGENT.md)
- [Lambda Functions Overview](./lambda/README.md)

## Useful Commands

* `npm run build` - Compile TypeScript to JS
* `npm run watch` - Watch for changes and compile
* `npm run test` - Run Jest unit tests
* `npx cdk deploy` - Deploy stacks to AWS
* `npx cdk diff` - Compare deployed vs current state
* `npx cdk synth` - Generate CloudFormation templates
* `npx cdk destroy` - Delete deployed stacks

## Development

### Adding New Infrastructure
1. Create new stack file in `lib/`
2. Import and instantiate in `bin/infrastructure.ts`
3. Add appropriate dependencies
4. Update documentation

### Lambda Functions
Lambda functions are organized in the `lambda/` directory:
- `personal-info-handler/` - Personal information form processing
- `vehicle-details-handler/` - Vehicle details form processing

### Testing
```bash
# Run unit tests
npm run test

# Test specific stack
npm run test -- --testNamePattern="DatabaseStack"
```
