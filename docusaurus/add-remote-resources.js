const shell = require('shelljs');
const tmp = require('tmp');

// Check for the environment variable and use it if available, otherwise exit
const REPO_URL = process.env.REMOTE_REPO_URL;
if (!REPO_URL) {
  console.log("Environment variable RESOURCE_REPO_URL is not set. Exiting.");
  process.exit();
}

// Define target repo
const TARGET_DIR = shell.pwd().stdout;

// Create a temporary directory for cloning
const tempDir = tmp.dirSync({ unsafeCleanup: true });

if (!tempDir) {
  console.error("Failed to create temporary directory. Exiting.");
  process.exit(1);
}

// Clone the repository into the temporary directory
if (shell.exec(`git clone "${REPO_URL}" "${tempDir.name}"`).code !== 0) {
  console.error("Failed to clone repository. Exiting.");
  tempDir.removeCallback(); // Cleanup the temporary directory
  process.exit(1);
}

// Get a list of top-level non-hidden directories and files
const result = shell.exec(`find "${tempDir.name}" -maxdepth 1 -mindepth 1 ! -name ".*" -exec basename {} \\;`, { silent: true });
const topLevelItems = result.stdout.trim().split('\n');

// Loop through each non-hidden top-level item
topLevelItems.forEach(item => {
  const sourcePath = `${tempDir.name}/${item}`;
  const targetPath = `${TARGET_DIR}/${item}`;

  if (shell.test('-e', targetPath)) { // Check if the item exists in the target directory
    console.log(`Removing existing item: ${targetPath}`);
    shell.rm('-rf', targetPath); // Remove the existing item
  }

  shell.cp('-r', sourcePath, targetPath); // Copy the new item from the temporary directory
});

// Remove the temporary directory
tempDir.removeCallback();
