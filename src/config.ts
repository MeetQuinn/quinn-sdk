import { AxiosInstance } from 'axios';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  getGlobalMutationObserver,
  type QuinnMutationObserver,
} from './mutations';

export const DEFAULT_QUINN_API_URL = 'https://api.lunapark.com';

/**
 * The Quinn API contract a client speaks. Contract 1 is the default. Under
 * contract 2 the Skill Rubric fields use their new names (for example
 * `skillRubricIds` instead of `eskillIds` on a sign-off field) and an old name
 * is rejected with a 400. Contract 3 keeps those names and renames the Skill
 * fields (`capabilityId` becomes `skillId`); no route the SDK calls carries a
 * Skill field, so the SDK sends the same bodies under 2 and 3.
 */
export type QuinnApiContract = 1 | 2 | 3;

export interface QuinnClientConfig {
  apiUrl?: string;
  token?: string;
  orgId?: string;
  configPath?: string;
  httpClient?: AxiosInstance;
  allowQuinnMutation?: boolean;
  onMutationCommitted?: QuinnMutationObserver;
  contract?: QuinnApiContract;
}

export interface QuinnResolvedConfig {
  apiUrl: string;
  token: string;
  orgId: string;
  httpClient?: AxiosInstance;
  allowQuinnMutation: boolean;
  onMutationCommitted?: QuinnMutationObserver;
  contract: QuinnApiContract;
}

interface QuinnFileConfig {
  apiUrl?: string;
  token?: string;
  orgId?: string;
  allowQuinnMutation?: boolean;
  contract?: number | string;
}

export function resolveQuinnConfig(input: QuinnClientConfig): QuinnResolvedConfig {
  const configPath = resolveConfigPath(input.configPath);
  const fileConfig = readConfigFile(configPath);

  const apiUrl = firstNonEmpty(
    input.apiUrl,
    process.env.QUINN_API_URL,
    fileConfig.apiUrl,
    DEFAULT_QUINN_API_URL
  );
  const token = firstNonEmpty(input.token, process.env.QUINN_API_TOKEN, fileConfig.token);
  const orgId = firstNonEmpty(input.orgId, process.env.QUINN_ORG_ID, fileConfig.orgId);
  const allowQuinnMutation = resolveAllowQuinnMutation(
    input.allowQuinnMutation,
    process.env.QUINN_ALLOW_QUINN_MUTATION,
    fileConfig.allowQuinnMutation
  );
  const contract = resolveContract(input.contract, process.env.QUINN_API_CONTRACT, fileConfig.contract);

  if (!apiUrl) {
    throw new Error('missing apiUrl');
  }
  if (!token) {
    throw new Error('missing token: provide QuinnClientConfig.token, QUINN_API_TOKEN, or config file token');
  }
  if (!orgId) {
    throw new Error('missing orgId: provide QuinnClientConfig.orgId, QUINN_ORG_ID, or config file orgId');
  }

  return {
    apiUrl,
    token,
    orgId,
    httpClient: input.httpClient,
    allowQuinnMutation,
    onMutationCommitted:
      input.onMutationCommitted ?? getGlobalMutationObserver(),
    contract,
  };
}

export function resolveApiUrl(input?: { apiUrl?: string; configPath?: string }): string {
  const configPath = resolveConfigPath(input?.configPath);
  const fileConfig = readConfigFile(configPath);
  return firstNonEmpty(
    input?.apiUrl,
    process.env.QUINN_API_URL,
    fileConfig.apiUrl,
    DEFAULT_QUINN_API_URL
  ) as string;
}

export function resolveConfigPath(configPath?: string): string {
  return (
    firstNonEmpty(configPath, process.env.QUINN_CONFIG_PATH) ??
    path.join(os.homedir(), '.config', 'quinn', 'config.json')
  );
}

function readConfigFile(configPath: string): QuinnFileConfig {
  if (!configPath || !fs.existsSync(configPath)) {
    return {};
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as QuinnFileConfig;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    return {
      apiUrl: asNonEmptyString(parsed.apiUrl),
      token: asNonEmptyString(parsed.token),
      orgId: asNonEmptyString(parsed.orgId),
      allowQuinnMutation: asBoolean(parsed.allowQuinnMutation),
      contract: parsed.contract,
    };
  } catch {
    return {};
  }
}

function resolveAllowQuinnMutation(
  ...values: Array<boolean | string | undefined>
): boolean {
  for (const value of values) {
    const parsed = asBoolean(value);
    if (parsed !== undefined) {
      return parsed;
    }
  }
  return true;
}

function resolveContract(...values: Array<number | string | undefined>): QuinnApiContract {
  for (const value of values) {
    if (value === undefined || value === null) {
      continue;
    }
    const normalized = String(value).trim();
    if (normalized === '') {
      continue;
    }
    if (normalized === '1' || normalized === '2' || normalized === '3') {
      return Number(normalized) as QuinnApiContract;
    }
    throw new Error(`invalid contract ${JSON.stringify(value)}: use 1, 2 or 3`);
  }
  return 1;
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const normalized = asNonEmptyString(value);
    if (normalized) {
      return normalized;
    }
  }
  return undefined;
}

function asNonEmptyString(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function asBoolean(value: boolean | string | undefined): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  return undefined;
}
