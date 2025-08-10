# Deployment script for Bedrock Agent Stack (PowerShell)
# This script deploys the Bedrock Agent stack and outputs the agent configuration

param(
    [string]$Stage = "dev",
    [string]$Region = $env:CDK_DEFAULT_REGION ?? "us-east-1",
    [string]$ProjectName = "girl-scouts"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying Bedrock Agent Stack..." -ForegroundColor Green
Write-Host "   Stage: $Stage" -ForegroundColor Cyan
Write-Host "   Region: $Region" -ForegroundColor Cyan
Write-Host "   Project: $ProjectName" -ForegroundColor Cyan
Write-Host ""

try {
    # Deploy the Bedrock Agent stack specifically
    Write-Host "📦 Building TypeScript..." -ForegroundColor Yellow
    npm run build
    
    Write-Host "🤖 Deploying Bedrock Agent Stack..." -ForegroundColor Yellow
    $stackName = "$ProjectName-$Stage-bedrock-agent-stack"
    $outputFile = "bedrock-agent-outputs-$Stage.json"
    
    npx cdk deploy $stackName `
        --context "stage=$Stage" `
        --require-approval never `
        --outputs-file $outputFile
    
    Write-Host ""
    Write-Host "✅ Deployment completed!" -ForegroundColor Green
    Write-Host ""
    
    # Check if outputs file was created
    if (Test-Path $outputFile) {
        Write-Host "📋 Bedrock Agent Configuration:" -ForegroundColor Cyan
        Write-Host "   Outputs saved to: $outputFile" -ForegroundColor Cyan
        
        # Extract key values for easy reference
        try {
            $outputs = Get-Content $outputFile | ConvertFrom-Json
            $stackOutputs = $outputs.$stackName
            
            $agentId = $stackOutputs.BedrockAgentId ?? "Not found"
            $aliasId = $stackOutputs.BedrockAgentAliasId ?? "Not found"
            
            Write-Host ""
            Write-Host "🔑 Environment Variables for your application:" -ForegroundColor Yellow
            Write-Host "   BEDROCK_AGENT_ID=$agentId" -ForegroundColor White
            Write-Host "   BEDROCK_AGENT_ALIAS_ID=$aliasId" -ForegroundColor White
            Write-Host "   AWS_REGION=$Region" -ForegroundColor White
            Write-Host ""
            Write-Host "📝 Copy these values to your environment configuration!" -ForegroundColor Green
        }
        catch {
            Write-Host "   Could not parse outputs. Check the file manually for agent details." -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "⚠️  Outputs file not found. Check CDK deployment logs for agent details." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🏁 Done! Your Bedrock Agent is ready to use." -ForegroundColor Green
}
catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
