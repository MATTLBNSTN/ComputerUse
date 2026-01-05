import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const appData = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
const defaultPath = path.join(appData, 'gcloud', 'application_default_credentials.json');

console.log(`Checking for credentials at: ${defaultPath}`);

if (fs.existsSync(defaultPath)) {
    console.log("✅ Credentials file found!");
} else {
    console.log("❌ Credentials file NOT found.");
    console.log("Please run: gcloud auth application-default login");
}
