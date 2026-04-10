import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const SWAGGER_URL = 'http://localhost:3000/api/docs-json';
const SCHEMA_OUTPUT = 'src/shared/api/schema.d.ts';
const INDEX_OUTPUT = 'src/shared/api/index.ts';
const BLOCKED_EXPORTS = new Set(['paths', 'webhooks', 'operations', '$defs']);

function generateSchema() {
  execSync(`openapi-typescript ${SWAGGER_URL} -o ${SCHEMA_OUTPUT}`, {
    stdio: 'inherit',
  });
}

function stripBlockedExports() {
  const lines = readFileSync(SCHEMA_OUTPUT, 'utf-8').split('\n');
  const result = [];
  let inBlock = false;
  let depth = 0;

  for (const line of lines) {
    if (inBlock) {
      for (const char of line) {
        if (char === '{') depth++;
        if (char === '}') depth--;
      }
      if (depth === 0) inBlock = false;
      continue;
    }

    const match = line.match(/^export (?:interface|type) ([\w$]+)/);
    if (match && BLOCKED_EXPORTS.has(match[1])) {
      if (line.includes('{')) {
        inBlock = true;
        depth = 1;
      }
      continue;
    }

    result.push(line);
  }

  writeFileSync(SCHEMA_OUTPUT, result.join('\n'));
}

function generateIndex() {
  function fetchSchemaNames() {
    const json = execSync(`curl -s ${SWAGGER_URL}`).toString();
    return Object.keys(JSON.parse(json).components?.schemas ?? {});
  }
  const exports = fetchSchemaNames()
    .map((name) => `export type ${name} = components['schemas']['${name}'];`)
    .join('\n');

  writeFileSync(INDEX_OUTPUT, `import type { components } from './schema';\n\n${exports}\n`);
}

generateSchema();
stripBlockedExports();
generateIndex();
