const fs = require('fs');
const semver = require('semver');
const sendEmail = require('./notifier');
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);
require('dotenv').config();

async function fetchLatestVersion() {
  try {
    console.log('Checking for releases...');
    const latest = await fetch('https://nodejs.org/dist/latest/');
    if (!latest.ok) {
      throw new Error(
        `Failed to fetch latest Node.js version: ${latest.statusText}`
      );
    }
    const versionPage = await latest.text();
    // eg: node-v22.4.1.pkg    08-Jul-2024 14:39     82473530
    // '<a href="node-v22.4.1.pkg">node-v22.4.1.pkg</a>     08-Jul-2024 14:39       82473530\r\n'
    const regex =
      /node-v(\d+\.\d+\.\d+)\.pkg">node-v\d+\.\d+\.\d+\.pkg<\/a>\s+(\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2})/;
    const match = regex.exec(versionPage);
    if (match) {
      const [_, latestVersion, releaseDate] = match;
      return [latestVersion, releaseDate];
    } else {
      console.error('Failed to extract version information');
      return null;
    }
  } catch (error) {
    console.error('Error checking for releases:', error);
    return null;
  }
}
async function checkForUpdates() {
  try {
    const currentVersion = fs.readFileSync('.version', 'utf8').trim();
    const [latestVersion, releaseDate] = await fetchLatestVersion();
    if (semver.gt(latestVersion, currentVersion)) {
      console.log('New version available:', latestVersion);
      fs.writeFileSync('.version', latestVersion);
      notify(latestVersion, releaseDate);
    } else {
      console.log('No new version available.');
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
}
async function notify(latestVersion, releaseDate) {
  const subscribers = await readSubscribersFromFile();
  const title = 'New Node.js Version Available 🎊';
  const content = `<p>Dear Node.js Enthusiast, 👋,</p><p> A new Node.js version ${latestVersion} has been released on ${releaseDate} 🎉🎉.</p><p>Please check out the <a href="https://nodejs.org/en/about/previous-releases#looking-for-latest-release-of-a-version-branch">Node.js changelogs</a> for more details.</p>`;
  sendEmail(subscribers, title, content);
}
async function readSubscribersFromFile() {
  try {
    const data = await readFileAsync('subscribers.txt', 'utf8');
    const emails = data.split('\n').map((email) => email.trim());
    return emails.filter((email) => email !== '');
  } catch (err) {
    console.error('Error reading subscribers file:', err);
    throw err;
  }
}

(async () => {
  await checkForUpdates();
})();
module.exports = {
  fetchLatestVersion,
  checkForUpdates,
  notify,
  readSubscribersFromFile,
};
