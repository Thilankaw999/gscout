# Girl Scouts Chatbot

A conversational form-filling chatbot built with AWS Bedrock (Claude 3 Haiku) and NestJS for the Girl Scouts organization.

## Overview

This chatbot helps users fill out Girl Scouts application forms through a natural conversation interface. It asks 5 specific questions to collect required information and automatically submits the completed form to an external API.

## Features

- **Conversational Interface**: Natural language processing using Claude 3 Haiku
- **Form Collection**: Systematically collects 5 required pieces of information
- **Session Management**: Maintains conversation state across multiple interactions
- **Auto-submission**: Automatically submits completed forms to external APIs
- **RESTful API**: Clean REST endpoints for integration
- **Health Monitoring**: Built-in health check endpoint

## Architecture

The chatbot follows Clean Architecture principles with:

- **Controllers**: Handle HTTP requests and responses
- **Use Cases**: Business logic for specific operations
- **Services**: External integrations (Bedrock, APIs)
- **DTOs**: Data transfer objects with validation
- **Tests**: Unit and E2E test coverage

## Form Questions

The chatbot collects the following information in order:

1. **Full Name**: User's complete name
2. **Email**: Contact email address
3. **Phone**: Phone number for contact
4. **Age**: Age (must be 5-18 for Girl Scouts programs)
5. **Preferred Activity**: Choice of activity type
   - Outdoor adventures
   - Community service
   - STEM projects
   - Arts & crafts
   - Leadership development

## API Endpoints

### Start New Session
```
POST /chatbot/start-session
```

**Request Body:**
```json
{
  "userId": "optional-user-id",
  "formType": "application"
}
```

**Response:**
```json
{
  "sessionId": "gs_1625123456789_abc123def",
  "welcomeMessage": "Hi there! I'm here to help you with your Girl Scouts application. What's your full name?",
  "currentQuestion": 1,
  "status": "active"
}
```

### Send Chat Message
```
POST /chatbot/chat
```

**Request Body:**
```json
{
  "sessionId": "gs_1625123456789_abc123def",
  "message": "John Doe"
}
```

**Response:**
```json
{
  "response": "Great to meet you, John! What's your email address so we can stay in touch?",
  "sessionId": "gs_1625123456789_abc123def",
  "currentQuestion": 2,
  "isCompleted": false,
  "status": "active",
  "expectedInputHint": "Please enter a valid email address"
}
```

### Get Session Status
```
GET /chatbot/session/{sessionId}/status
```

**Response:**
```json
{
  "sessionId": "gs_1625123456789_abc123def",
  "currentQuestion": 3,
  "isCompleted": false,
  "status": "active",
  "formData": {
    "fullName": "John Doe",
    "email": "john@example.com"
  }
}
```

### Health Check
```
GET /chatbot/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-07T10:30:00.000Z",
  "service": "girl-scouts-chatbot"
}
```

## Configuration

### Environment Variables

Required environment variables:

```bash
# AWS Configuration
AWS_REGION=ap-southeast-1

# Form Submission API
FORM_SUBMISSION_API_URL_LOCAL=http://localhost:3000/api
FORM_SUBMISSION_API_URL_PRODUCTION=https://api.girlscouts.org

# Development
IS_OFFLINE=true  # For local development
```

### AWS Permissions

The Lambda function requires the following IAM permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
    }
  ]
}
```

## Development

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start in offline mode:
```bash
npm run start:dev
```

3. Test endpoints:
```bash
# Health check
curl http://localhost:3002/chatbot/health

# Start session
curl -X POST http://localhost:3002/chatbot/start-session \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user"}'
```

### Testing

Run unit tests:
```bash
npm run test
```

Run E2E tests:
```bash
npm run test:e2e
```

### Building

Build for deployment:
```bash
npm run build
```

## Deployment

Deploy using Serverless Framework:

```bash
# Deploy to development
sls deploy --stage dev

# Deploy to production
sls deploy --stage prod
```

## Conversation Flow Example

```
Bot: Hi there! I'm here to help you with your Girl Scouts application. What's your full name?
User: Sarah Johnson

Bot: Great to meet you, Sarah! What's your email address so we can stay in touch?
User: sarah.johnson@email.com

Bot: Perfect! And what's the best phone number to reach you?
User: (555) 123-4567

Bot: Thanks! How old are you? This helps us match you with the right activities.
User: 12

Bot: Awesome! What type of Girl Scouts activities are you most interested in? (outdoor adventures, community service, STEM projects, arts & crafts, or leadership development)
User: STEM projects

Bot: Wonderful choice, Sarah! Thank you for completing your Girl Scouts application. 

🎉 Great news! Your application has been submitted successfully! Your submission ID is: gs_sub_1625123456789_def456ghi. Someone from our team will contact you soon at sarah.johnson@email.com and (555) 123-4567.
```

## Error Handling

The chatbot handles various error scenarios:

- **Invalid Session**: Returns 404 when session ID is not found
- **API Failures**: Graceful fallback when external APIs are unavailable
- **Validation Errors**: Friendly messages for invalid input
- **Service Errors**: Proper logging and error responses

## Future Enhancements

- **Persistent Storage**: Replace in-memory storage with DynamoDB or Redis
- **Multiple Forms**: Support for different form types
- **Rich Media**: Support for images and file uploads
- **Analytics**: Conversation analytics and insights
- **Multilingual**: Support for multiple languages
- **Integration**: Direct integration with Girl Scouts CRM systems

## Support

For questions or issues, please contact the development team or refer to the main project documentation.
