import * as path from 'path';
import * as fs from 'fs-extra';

const packageJSON = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../package.json')).toString()
);

delete packageJSON.devDependencies;
delete packageJSON.scripts;
delete packageJSON.private;

const distPath = path.resolve(__dirname, '../dist');

if (!fs.existsSync(distPath)) {
  fs.removeSync(distPath);
}

fs.copySync(path.resolve(__dirname, '../lib'), distPath);
fs.copySync(path.resolve(__dirname, '../../../README.md'), path.resolve(distPath, 'README.md'));

for (const dir of ['.', 'esm', 'es2015']) {
  fs.copySync(path.resolve(__dirname, '../lib/index.d.ts'), path.resolve(distPath, dir, 'index.d.ts'));
}

fs.writeFileSync(
  path.resolve(distPath, 'package.json'),
  JSON.stringify(packageJSON, null, 2),
);

if (fs.existsSync(path.resolve(__dirname, '../LICENSE'))) {
  fs.copyFileSync(
    path.resolve(__dirname, '../LICENSE'),
    path.resolve(distPath, 'LICENSE'),
  );
} else {
  console.warn(`Missing \`LICENSE.md\` in ${path.resolve(__dirname, '..')}`);
}