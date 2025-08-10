# Bedrock Agent Lambda Functions

This directory contains Lambda functions that serve as action groups for the Bedrock Agent.

## Structure

```
lambda/
├── personal-info-handler/
│   ├── index.py              # Personal information form handler
│   └── requirements.txt      # Python dependencies
└── vehicle-details-handler/
    ├── index.py              # Vehicle details form handler
    └── requirements.txt      # Python dependencies
```

## Functions

### Personal Info Handler (`personal-info-handler/`)
- **Purpose**: Handles submission of personal information forms
- **Collects**: First name, last name, email address
- **Response**: Confirmation message with submission ID

### Vehicle Details Handler (`vehicle-details-handler/`)
- **Purpose**: Handles submission of vehicle details forms  
- **Collects**: Vehicle make, model, year
- **Response**: Confirmation message with submission ID

## Event Format

Both functions expect Bedrock Agent events with the following structure:

```json
{
  "actionGroup": "string",
  "function": "string", 
  "messageVersion": "1.0",
  "requestBody": {
    "content": {
      "application/json": {
        "properties": [
          {
            "name": "parameterName",
            "value": "parameterValue"
          }
        ]
      }
    }
  }
}
```

## Response Format

Both functions return responses in this format:

```json
{
  "messageVersion": "1.0",
  "response": {
    "actionGroup": "string",
    "apiPath": "string", 
    "httpMethod": "string",
    "httpStatusCode": 200,
    "responseBody": {
      "application/json": {
        "body": "{\"submissionId\":\"...\",\"message\":\"...\"}"
      }
    }
  }
}
```

## Deployment

These functions are deployed automatically as part of the `BedrockAgentStack` CDK stack.
