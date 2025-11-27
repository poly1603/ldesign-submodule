/**
 * Git Submodule Manager - Utility Functions
 */

import { InvalidUrlError, InvalidPathError } from './errors.js';

/**
 * 验证 Git URL 格式
 */
export function validateUrl(url: string): void {
  if (!url || typeof url !== 'string') {
    throw new InvalidUrlError(url);
  }

  const patterns = [
    /^https?:\/\/.+\.git$/,
    /^git@.+:.+\.git$/,
    /^ssh:\/\/.+\.git$/,
    /^git:\/\/.+\.git$/,
    /^https?:\/\/.+$/,
  ];

  const isValid = patterns.some((pattern) => pattern.test(url));

  if (!isValid) {
    throw new InvalidUrlError(url);
  }
}

/**
 * 验证路径格式
 */
export function validatePath(path: string): void {
  if (!path || typeof path !== 'string') {
    throw new InvalidPathError(path, 'Path cannot be empty');
  }

  // 检查路径是否包含非法字符
  const illegalChars = /[<>:"|?*]/;
  if (illegalChars.test(path)) {
    throw new InvalidPathError(path, 'Path contains illegal characters');
  }

  // 检查路径是否为绝对路径
  if (path.startsWith('/') || /^[A-Za-z]:/.test(path)) {
    throw new InvalidPathError(path, 'Path must be relative');
  }

  // 检查路径是否尝试访问父目录
  if (path.includes('..')) {
    throw new InvalidPathError(path, 'Path cannot contain ".."');
  }
}

/**
 * 规范化路径（移除尾部斜杠等）
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+$/, '');
}

/**
 * 解析 git submodule status 输出
 */
export function parseSubmoduleStatus(line: string): {
  status: string;
  commit: string;
  path: string;
  branch?: string;
} | null {
  const match = line.match(/^([\s\-\+U])([a-f0-9]+)\s+(\S+)(?:\s+\((.+)\))?$/);
  if (!match) return null;

  const [, status, commit, path, branch] = match;
  return { status, commit, path, branch };
}

/**
 * 格式化表格输出
 */
export function formatTable(
  headers: string[],
  rows: string[][],
  options: { maxWidth?: number } = {}
): string {
  const maxWidth = options.maxWidth || 100;

  // 计算每列的最大宽度
  const columnWidths = headers.map((header, i) => {
    const maxContentWidth = Math.max(
      header.length,
      ...rows.map((row) => row[i]?.length || 0)
    );
    return Math.min(maxContentWidth, maxWidth);
  });

  // 创建分隔线
  const separator = columnWidths.map((width) => '-'.repeat(width + 2)).join('+');

  // 格式化表头
  const headerRow = headers
    .map((header, i) => header.padEnd(columnWidths[i]))
    .join(' | ');

  // 格式化数据行
  const dataRows = rows.map((row) =>
    row.map((cell, i) => (cell || '').padEnd(columnWidths[i])).join(' | ')
  );

  return [headerRow, separator, ...dataRows].join('\n');
}

/**
 * 解析命令行中的键值对参数
 */
export function parseKeyValue(arg: string): { key: string; value: string } {
  const [key, ...valueParts] = arg.split('=');
  const value = valueParts.join('=');
  return { key: key.trim(), value: value.trim() };
}

/**
 * 将对象转换为 YAML 格式字符串（简单实现）
 */
export function toYaml(obj: any, indent = 0): string {
  const spaces = ' '.repeat(indent);
  let result = '';

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        result += `${spaces}-\n${toYaml(item, indent + 2)}`;
      } else {
        result += `${spaces}- ${item}\n`;
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        result += `${spaces}${key}:\n${toYaml(value, indent + 2)}`;
      } else {
        result += `${spaces}${key}: ${value}\n`;
      }
    }
  }

  return result;
}

/**
 * 延迟执行
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 安全执行异步函数
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/**
 * 确保路径以斜杠结尾
 */
export function ensureTrailingSlash(path: string): string {
  return path.endsWith('/') ? path : `${path}/`;
}

/**
 * 移除路径前缀
 */
export function removePrefix(str: string, prefix: string): string {
  return str.startsWith(prefix) ? str.slice(prefix.length) : str;
}

/**
 * 检查是否在 Git 仓库中
 */
export function isGitRepository(cwd: string = process.cwd()): boolean {
  const fs = require('fs');
  const path = require('path');
  return fs.existsSync(path.join(cwd, '.git'));
}