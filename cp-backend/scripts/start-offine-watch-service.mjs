import { exec, execSync } from "child_process";
import { readdirSync, lstatSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";

// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appsDir = path.join(__dirname, "../apps");
const libDir = path.join(__dirname, "../libs");
const apps = readdirSync(appsDir).filter(name => lstatSync(path.join(appsDir, name)).isDirectory());

const colors = [chalk.red, chalk.green, chalk.yellow, chalk.blue, chalk.magenta, chalk.cyan, chalk.white];
let colorIndex = 0;

/**
 * Function to build an app using `nest build`
 */
const buildApp = (app, callback) => {
  console.log(`Building ${app}...`);
  exec(`nest build ${app}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error building ${app}:`, error);
      return;
    }
    console.log(`Build output for ${app}:\n`, stdout);
    if (stderr) {
      console.error(`stderr for ${app}:\n`, stderr);
    }
    if (callback) callback();
  });
};

/**
 * Function to start and watch an app with nodemon
 */
const startAndWatchApp = (app, appPath) => {
  const appColor = colors[colorIndex % colors.length];
  colorIndex++;

  console.log(
    appColor(
      `Starting ${app} with serverless local mode and watching for changes...`,
    ),
  );

  // Watch the app directory for changes, build it, and restart the service
  const command = `nodemon --watch ${appPath}/src --watch ${libDir} -e ts --exec "rm -rf ${appPath}/.dist && npm run build ${app} && node --inspect ../../node_modules/.bin/serverless offline start --config ${path.join(appPath, 'serverless.yml')}"`;

  const subprocess = exec(command, { cwd: appPath });

  const logOutput = (data, streamType) => {
    console.log(appColor(`[${app} ${streamType}]: ${data}`));
  };

  subprocess.stdout.on('data', (data) => logOutput(data, 'LOG'));
  subprocess.stderr.on('data', (data) => logOutput(data, 'LOG'));

  subprocess.on('close', (code) => {
    console.log(appColor(`[${app}] process exited with code ${code}`));
  });
};

/**
 * Start the process
 */
const startProcess = (targetApp) => {
  if (!targetApp || !apps.includes(targetApp)) {
    console.error(
      chalk.red(
        `App "${targetApp}" not found. Available apps: ${apps.join(', ')}`,
      ),
    );
    process.exit(1);
  }

  execSync('npm run clean');
  const appPath = path.join(appsDir, targetApp);
  buildApp(targetApp, () => startAndWatchApp(targetApp, appPath));
};

// Get the target app from the command line arguments
const targetApp = process.argv[2];
if (!targetApp) {
  console.error(
    chalk.red(
      'Please specify an app to start. Usage: npm run watch <app-name>',
    ),
  );
  process.exit(1);
}

startProcess(targetApp);
