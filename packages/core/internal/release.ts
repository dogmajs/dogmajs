import * as path from 'path';
import * as fs from 'fs';
import { execSync, ExecSyncOptions } from 'child_process';

const execSyncOptions: ExecSyncOptions = {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
};

execSync('npm run test', execSyncOptions);

const packageJSON = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json')).toString()
);

delete packageJSON.devDependencies;
delete packageJSON.scripts;
delete packageJSON.private;

fs.writeFileSync(
  path.resolve(__dirname, '../dist/package.json'),
  JSON.stringify(packageJSON, null, 2),
);

if (!fs.existsSync(path.resolve(__dirname, '../src/index.ts'))) {
  console.error(`Missing \`index.ts\` in ${path.resolve(__dirname, '../src')}`);
  process.exit(2);
}

if (fs.existsSync(path.resolve(__dirname, '../LICENSE'))) {
  fs.copyFileSync(
    path.resolve(__dirname, '../LICENSE'),
    path.resolve(__dirname, '../dist/LICENSE'),
  );
} else {
  console.warn(`Missing \`LICENSE.md\` in ${path.resolve(__dirname, '..')}`);
}

if (fs.existsSync(path.resolve(__dirname, '../README.md'))) {
  fs.copyFileSync(
    path.resolve(__dirname, '../../../README.md'),
    path.resolve(__dirname, '../dist/README.md'),
  );
} else {
  console.warn(`Missing \`README.md\` in ${path.resolve(__dirname, '..')}`);
}