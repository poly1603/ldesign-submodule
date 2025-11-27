/**
 * Git Submodule Manager - Type Definitions
 */

export interface SubmoduleInfo {
  path: string;
  url?: string;
  commit: string;
  branch?: string;
  status: SubmoduleStatus;
  uncommittedChanges?: boolean;
  ahead?: number;
  behind?: number;
}

export type SubmoduleStatus =
  | 'up-to-date'
  | 'not-initialized'
  | 'modified'
  | 'merge-conflict'
  | 'ahead'
  | 'behind'
  | 'diverged';

export interface AddOptions {
  branch?: string;
  tag?: string;
  commit?: string;
  force?: boolean;
  depth?: number;
  noCheckout?: boolean;
}

export interface RemoveOptions {
  force?: boolean;
  keepFiles?: boolean;
  yes?: boolean;
}

export interface UpdateOptions {
  init?: boolean;
  recursive?: boolean;
  remote?: boolean;
  merge?: boolean;
  rebase?: boolean;
  jobs?: number;
}

export interface ListOptions {
  verbose?: boolean;
  status?: boolean;
  recursive?: boolean;
  format?: 'table' | 'json' | 'yaml';
}

export interface SubmoduleConfig {
  url: string;
  path: string;
  branch?: string;
  tag?: string;
  commit?: string;
  depth?: number;
}

export interface BatchResult {
  success: string[];
  failed: Array<{
    path: string;
    error: string;
  }>;
}

export interface AnalysisResult {
  total: number;
  byStatus: Record<SubmoduleStatus, number>;
  conflicts: ConflictInfo[];
  circular: string[][];
  unused: string[];
}

export interface ConflictInfo {
  path: string;
  type: 'version' | 'branch' | 'url';
  details: string;
}

export interface DependencyTree {
  name: string;
  path?: string;
  children: DependencyTree[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: any;
}

export interface HealthCheckResult {
  score: number;
  checks: HealthCheck[];
  summary: string;
}

export interface ConfigData {
  default?: {
    branch?: string;
    recursive?: boolean;
    jobs?: number;
  };
  presets?: Record<string, SubmoduleConfig[]>;
  aliases?: Record<string, string>;
  [key: string]: any;
}

export interface GitOperationResult {
  success: boolean;
  stdout: string;
  stderr: string;
}

export interface ProgressEvent {
  stage: string;
  path?: string;
  progress?: number;
  message?: string;
}