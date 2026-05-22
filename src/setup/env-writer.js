import fs from 'fs';
import path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env');

export function readEnvKey(key) {
  if (!fs.existsSync(ENV_PATH)) return undefined;
  const line = fs
    .readFileSync(ENV_PATH, 'utf-8')
    .split('\n')
    .find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim() : undefined;
}

export function writeEnvKey(key, value) {
  const current = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : '';
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  if (regex.test(current)) {
    fs.writeFileSync(ENV_PATH, current.replace(regex, line), 'utf-8');
  } else {
    const separator = current && !current.endsWith('\n') ? '\n' : '';
    fs.writeFileSync(ENV_PATH, `${current}${separator}${line}\n`, 'utf-8');
  }
}
