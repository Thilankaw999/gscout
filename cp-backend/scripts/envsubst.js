/**
 * This script automates the replacement of placeholders in a JSON configuration file with 
 * environment-specific values. The values are sourced from both environment variables and AWS 
 * Secrets Manager. The script is designed to handle the following scenarios:
 *
 * 1. **Environment Variable Replacement**:
 *    - Placeholders prefixed with `$ENV_` are replaced with corresponding environment variables.
 *    - For example, a placeholder `$ENV_API_KEY` in the JSON file will be replaced with the value 
 *      of the `API_KEY` environment variable.
 * 
 * 2. **General Secret Replacement from AWS Secrets Manager**:
 *    - The script first attempts to replace placeholders prefixed with `$AWS_` using values from a 
 *      general secret stored in AWS Secrets Manager at `/dev/pms/backend_deploy/secrets`.
 *    - For instance, `$AWS_DB_PASSWORD` will try to match and replace with the `DB_PASSWORD` key 
 *      from the general secret.
 * 
 * 3. **Error Handling**:
 *    - If a required key cannot be found in either environment variables or AWS Secrets Manager, 
 *      the script logs an error and exits, ensuring the deployment does not proceed with missing 
 *      configurations.
 * 
 * The script is designed to be efficient by fetching the general secrets once and using in-memory 
 * lookups to replace all relevant placeholders in the JSON file.
 */

const fs = require('fs');
const path = require('path');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const STAGE = process.env.STAGE || 'dev';

// Configure AWS SDK v3 client
const client = new SecretsManagerClient({ region: 'ap-south-1' }); // Update to your AWS region

// Function to load the JSON file as a string (raw text)
function loadJsonFileAsString(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8'); // Read the JSON file as raw text
  } catch (error) {
    console.error('Error reading JSON file:', error);
    process.exit(1);
  }
}

// Function to save JSON to a file
function saveJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8'); // Save beautified JSON output
  } catch (error) {
    console.error('Error writing JSON file:', error);
    process.exit(1);
  }
}

// Function to fetch secret from AWS Secrets Manager using AWS SDK v3
async function fetchSecret(secretId) {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretId });
    const data = await client.send(command);
    return data.SecretString ? JSON.parse(data.SecretString) : {};
  } catch (error) {
    console.error(`Error fetching secret from ${secretId}:`, error);
    return {}; // Return empty object if not found
  }
}

// Function to replace environment variables and secrets in the raw JSON text
async function replacePlaceholders(jsonText, generalSecrets) {
  jsonText = jsonText.replace(/\$ENV_([A-Z0-9_]+)/g, (match, envVarName) => {
    envVarName = `ENV_${envVarName}`
    const envValue = process.env[envVarName];

    if (envValue === undefined) {
      console.error(`Error: Environment variable ${envVarName} not found.`);
      process.exit(1); // Exit if required environment variable is not found
    }

    // Check if the environment variable is a boolean, number, or string
    if (envValue === 'true' || envValue === 'false') {
      return envValue === 'true'; // Return as boolean (without quotes)
    } else if (!isNaN(envValue)) {
      return envValue; // Return as number (without quotes)
    } else if (envValue.includes(',')) {
      // If the value is comma-separated, treat it as an array of strings
      const value = envValue.split(',').map(item => item.trim()); // Split by commas and trim any spaces
      return value;
    } else {
      return `${envValue}`; // Return as string (with quotes)
    }
  });

  // Replace AWS secrets (e.g., $AWS_DB_PASSWORD) with corresponding secret values
  jsonText = jsonText.replace(/\$AWS_([A-Z0-9_]+)/g, (match, secretKey) => {
    const secretValue = generalSecrets[secretKey];

    if (secretValue === undefined) {
      console.error(`Error: Secret variable ${secretKey} not found.`);
      process.exit(1); // Exit if required secret variable is not found
    }

    if (secretValue === 'true' || secretValue === 'false') {
      return secretValue === 'true'; // Return as boolean (without quotes)
    } else if (!isNaN(secretValue)) {
      return secretValue; // Return as number (without quotes)
    } else {
      return secretValue; // Return as string (with quotes)
    }
  });

  return jsonText;
}

// Paths to the JSON files
const sourcePath = path.join(__dirname, '..', 'bitrise', 'env.json');
const destinationPath = path.join(__dirname, '..', 'environment', 'env.json');

// Main script execution
(async () => {
  try {
    const rawJsonText = loadJsonFileAsString(sourcePath); // Load the JSON as raw text
    const generalSecrets = await fetchSecret(`/${STAGE}/pms/backend_deploy/secrets`); // Fetch general secrets once

    // Replace the placeholders in the raw JSON text
    const updatedJsonText = await replacePlaceholders(rawJsonText, generalSecrets);

    // Parse the modified text back into a JSON object
    const updatedConfig = JSON.parse(updatedJsonText);

    // Save the updated JSON object back to the file
    saveJsonFile(destinationPath, updatedConfig);

    console.log('Placeholders have been successfully replaced.');
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1); // Ensure to exit on any error
  }
})();