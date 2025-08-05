const { execSync } = require('child_process');
const path = require('path');

// Get the service directory and stage from the command line arguments
const args = process.argv.slice(2);
const serviceDir = args[0];
const stage = args[1] || 'dev';

if (!serviceDir) {
  console.error('SERVICE_DIR is not provided. Please specify the service directory.');
  process.exit(1);
}

// file deepcode ignore IndirectCommandInjection: Since this is a script used by the CI/CD Pipeline user inputs are received from real users.

try {
  // Build the specific API
  console.log(`Building ${serviceDir}...`);
  execSync(`npx nest build ${serviceDir}`, { stdio: 'inherit' });

  // Change directory to the specific service's folder
  const servicePath = path.resolve(__dirname, `../apps/${serviceDir}`);
  process.chdir(servicePath);

  // Deploy the service with Serverless Framework
  console.log(`Deploying ${serviceDir} to ${stage} stage...`);
  execSync(`npx serverless deploy --stage ${stage}`, { stdio: 'inherit' });

  console.log(`${serviceDir} deployed successfully to ${stage} stage!`);
} catch (error) {
  console.error('Deployment failed:', error);
  process.exit(1);
}
