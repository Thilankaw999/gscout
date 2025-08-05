const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const appsDir = path.join(__dirname, "../apps");
const apps = fs.readdirSync(appsDir).filter(name => fs.lstatSync(path.join(appsDir, name)).isDirectory());

async function buildApp(app) {
  console.log(`Building ${app}...`);
  return new Promise((resolve, reject) => {
    exec(`npx nest build ${app}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error building ${app}:`, error);
        reject(error);
        return;
      }
      console.log(`Output for ${app}:\n`, stdout);
      if (stderr) {
        console.error(`stderr for ${app}:\n`, stderr);
      }
      resolve();
    });
  });
}

async function buildAppsSequentially() {
  for (const app of apps) {
    try {
      await buildApp(app);
    } catch (error) {
      console.error(`Failed to build ${app}. Stopping further builds.`);
      break;
    }
  }
}

buildAppsSequentially();
