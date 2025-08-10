#!/bin/bash

# Deployment script for Bedrock Agent Stack
# This script deploys the Bedrock Agent stack and outputs the agent configuration

set -e

# Default values
STAGE=${1:-dev}
REGION=${CDK_DEFAULT_REGION:-us-east-1}
PROJECT_NAME="girl-scouts"

echo "🚀 Deploying Bedrock Agent Stack..."
echo "   Stage: $STAGE"
echo "   Region: $REGION"
echo "   Project: $PROJECT_NAME"
echo ""

# Deploy the Bedrock Agent stack specifically
echo "📦 Building TypeScript..."
npm run build

echo "🤖 Deploying Bedrock Agent Stack..."
npx cdk deploy "${PROJECT_NAME}-${STAGE}-bedrock-agent-stack" \
  --context stage="$STAGE" \
  --require-approval never \
  --outputs-file "bedrock-agent-outputs-${STAGE}.json"

echo ""
echo "✅ Deployment completed!"
echo ""

# Check if outputs file was created
if [ -f "bedrock-agent-outputs-${STAGE}.json" ]; then
    echo "📋 Bedrock Agent Configuration:"
    echo "   Outputs saved to: bedrock-agent-outputs-${STAGE}.json"
    
    # Extract key values for easy reference
    if command -v jq &> /dev/null; then
        AGENT_ID=$(jq -r ".\"${PROJECT_NAME}-${STAGE}-bedrock-agent-stack\".BedrockAgentId // \"Not found\"" "bedrock-agent-outputs-${STAGE}.json")
        ALIAS_ID=$(jq -r ".\"${PROJECT_NAME}-${STAGE}-bedrock-agent-stack\".BedrockAgentAliasId // \"Not found\"" "bedrock-agent-outputs-${STAGE}.json")
        
        echo ""
        echo "🔑 Environment Variables for your application:"
        echo "   BEDROCK_AGENT_ID=$AGENT_ID"
        echo "   BEDROCK_AGENT_ALIAS_ID=$ALIAS_ID"
        echo "   AWS_REGION=$REGION"
        echo ""
        echo "📝 Copy these values to your environment configuration!"
    else
        echo "   Install 'jq' to see formatted output values"
    fi
else
    echo "⚠️  Outputs file not found. Check CDK deployment logs for agent details."
fi

echo ""
echo "🏁 Done! Your Bedrock Agent is ready to use."
