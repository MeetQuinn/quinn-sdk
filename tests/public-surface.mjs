import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const index = read('../dist/index.d.ts');
const typeIndex = read('../dist/types/index.d.ts');
const rolesService = read('../dist/services/roles.d.ts');
const roleTypes = read('../dist/types/roles.d.ts');

for (const domain of ['levels', 'competencies', 'endorsements']) {
  assert.doesNotMatch(index, new RegExp(`readonly ${domain}:`));
  assert.equal(
    existsSync(new URL(`../dist/services/${domain}.d.ts`, import.meta.url)),
    false
  );
  assert.equal(
    existsSync(new URL(`../dist/types/${domain}.d.ts`, import.meta.url)),
    false
  );
}

assert.doesNotMatch(typeIndex, /\.\/(levels|competencies|endorsements)/);
assert.doesNotMatch(rolesService, /updateLevels/);
assert.doesNotMatch(roleTypes, /levelIds|RoleLevelInput|RolesUpdateLevelsInput/);

assert.match(index, /readonly roles: RolesService/);
assert.match(rolesService, /list\(/);
assert.match(rolesService, /create\(/);
assert.match(rolesService, /update\(/);
assert.match(rolesService, /delete\(/);

// Client headers and the API contract option.
import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

assert.match(index, /QuinnApiContract/);
assert.match(read('../dist/config.d.ts'), /contract\?: QuinnApiContract/);

const { Quinn } = createRequire(import.meta.url)('../dist/index.js');
const dir = mkdtempSync(join(tmpdir(), 'quinn-sdk-surface-'));
const noFile = join(dir, 'missing.json');
const base = { apiUrl: 'https://api.example.test', token: 't', orgId: 'o', configPath: noFile };
const headersOf = (config) => new Quinn(config).http.defaults.headers;
delete process.env.QUINN_API_CONTRACT;

const v1 = headersOf(base);
assert.equal(v1['x-lp-client'], 'quinn-sdk');
assert.equal(v1['x-lp-contract'], undefined);

assert.equal(headersOf({ ...base, contract: 2 })['x-lp-contract'], '2');
assert.equal(headersOf({ ...base, contract: 1 })['x-lp-contract'], undefined);

process.env.QUINN_API_CONTRACT = '2';
assert.equal(headersOf(base)['x-lp-contract'], '2');
assert.equal(headersOf({ ...base, contract: 1 })['x-lp-contract'], undefined);
process.env.QUINN_API_CONTRACT = '3';
assert.equal(headersOf(base)['x-lp-contract'], '3');
assert.equal(headersOf({ ...base, contract: 2 })['x-lp-contract'], '2');
process.env.QUINN_API_CONTRACT = '4';
assert.throws(() => headersOf(base), /invalid contract/);
delete process.env.QUINN_API_CONTRACT;

const file = join(dir, 'config.json');
writeFileSync(file, JSON.stringify({ contract: 2 }));
assert.equal(headersOf({ ...base, configPath: file })['x-lp-contract'], '2');
