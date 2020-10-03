import * as path from 'path';
import * as fs from 'fs';
import { execSync, ExecSyncOptions } from 'child_process';

const execSyncOptions: ExecSyncOptions = {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
};

execSync('lerna version', execSyncOptions);

const lernaJSON = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../lerna.json')).toString(),
);

if (lernaJSON.version) {
  const packageJSON = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../package.json')).toString(),
  );
  packageJSON.version = lernaJSON.version;
  fs.writeFileSync(
    path.resolve(__dirname, '../package.json'),
    JSON.stringify(packageJSON, null, 2),
  );
}