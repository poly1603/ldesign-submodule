/**
 * Git Submodule Manager - Git Operations
 * 封装所有 Git 命令的执行
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { GitCommandError } from './errors.js';
import type { GitOperationResult } from './types.js';

const execAsync = promisify(exec);

export class GitOperations {
  constructor(public readonly repoPath: string = process.cwd()) {}

  /**
   * 执行 Git 命令
   */
  async execute(command: string, options: { cwd?: string } = {}): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(`git ${command}`, {
        cwd: options.cwd || this.repoPath,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      // Git 有时会将正常信息输出到 stderr，所以只在真正错误时抛出
      if (stderr && !this.isWarning(stderr)) {
        throw new GitCommandError(command, stderr);
      }

      return stdout.trim();
    } catch (error: any) {
      if (error instanceof GitCommandError) {
        throw error;
      }
      throw new GitCommandError(command, error.message || String(error));
    }
  }

  /**
   * 执行 Git 命令并返回详细结果
   */
  async executeDetailed(
    command: string,
    options: { cwd?: string } = {}
  ): Promise<GitOperationResult> {
    try {
      const { stdout, stderr } = await execAsync(`git ${command}`, {
        cwd: options.cwd || this.repoPath,
        maxBuffer: 10 * 1024 * 1024,
      });

      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      };
    } catch (error: any) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message || String(error),
      };
    }
  }

  /**
   * 检查是否在 Git 仓库中
   */
  async isGitRepository(): Promise<boolean> {
    try {
      await this.execute('rev-parse --git-dir');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取当前分支名称
   */
  async getCurrentBranch(): Promise<string> {
    return this.execute('rev-parse --abbrev-ref HEAD');
  }

  /**
   * 获取远程 URL
   */
  async getRemoteUrl(remote = 'origin'): Promise<string> {
    return this.execute(`remote get-url ${remote}`);
  }

  /**
   * 检查工作目录是否干净
   */
  async isWorkingTreeClean(): Promise<boolean> {
    const output = await this.execute('status --porcelain');
    return output.length === 0;
  }

  /**
   * 获取最后一次提交的 SHA
   */
  async getLastCommitSha(short = true): Promise<string> {
    const format = short ? '--short' : '';
    return this.execute(`rev-parse ${format} HEAD`);
  }

  /**
   * 检查文件或目录是否存在于 Git 中
   */
  async exists(path: string): Promise<boolean> {
    try {
      await this.execute(`ls-files --error-unmatch ${path}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取 Git 配置值
   */
  async getConfig(key: string, options: { local?: boolean; global?: boolean } = {}): Promise<string> {
    let command = `config --get ${key}`;
    if (options.local) command = `config --local --get ${key}`;
    if (options.global) command = `config --global --get ${key}`;
    
    try {
      return await this.execute(command);
    } catch {
      return '';
    }
  }

  /**
   * 设置 Git 配置值
   */
  async setConfig(
    key: string,
    value: string,
    options: { local?: boolean; global?: boolean } = {}
  ): Promise<void> {
    let command = `config ${key} "${value}"`;
    if (options.local) command = `config --local ${key} "${value}"`;
    if (options.global) command = `config --global ${key} "${value}"`;
    
    await this.execute(command);
  }

  /**
   * 删除 Git 配置值
   */
  async unsetConfig(
    key: string,
    options: { local?: boolean; global?: boolean } = {}
  ): Promise<void> {
    let command = `config --unset ${key}`;
    if (options.local) command = `config --local --unset ${key}`;
    if (options.global) command = `config --global --unset ${key}`;
    
    try {
      await this.execute(command);
    } catch {
      // 如果配置不存在，忽略错误
    }
  }

  /**
   * 判断 stderr 是否只是警告
   */
  private isWarning(stderr: string): boolean {
    const warningPatterns = [
      /^warning:/i,
      /^hint:/i,
      /^note:/i,
      /Cloning into/i,
      /Submodule path/i,
    ];

    return warningPatterns.some((pattern) => pattern.test(stderr));
  }

  /**
   * Submodule 相关命令
   */

  /**
   * 添加 submodule
   */
  async submoduleAdd(url: string, path: string, branch?: string, depth?: number): Promise<string> {
    let command = `submodule add ${url} ${path}`;
    if (branch) command += ` -b ${branch}`;
    if (depth) command += ` --depth ${depth}`;
    
    return this.execute(command);
  }

  /**
   * 删除 submodule
   */
  async submoduleRemove(path: string): Promise<void> {
    // 1. deinit
    await this.execute(`submodule deinit -f ${path}`);
    
    // 2. 删除 .git/modules
    await this.execute(`rm -rf .git/modules/${path}`);
    
    // 3. git rm
    await this.execute(`rm -f ${path}`);
  }

  /**
   * 获取 submodule 状态
   */
  async submoduleStatus(recursive = false): Promise<string> {
    const command = recursive ? 'submodule status --recursive' : 'submodule status';
    return this.execute(command);
  }

  /**
   * 初始化 submodule
   */
  async submoduleInit(path?: string): Promise<string> {
    const command = path ? `submodule init ${path}` : 'submodule init';
    return this.execute(command);
  }

  /**
   * 更新 submodule
   */
  async submoduleUpdate(
    path?: string,
    options: {
      init?: boolean;
      recursive?: boolean;
      remote?: boolean;
      merge?: boolean;
      rebase?: boolean;
      jobs?: number;
    } = {}
  ): Promise<string> {
    let command = 'submodule update';
    
    if (options.init) command += ' --init';
    if (options.recursive) command += ' --recursive';
    if (options.remote) command += ' --remote';
    if (options.merge) command += ' --merge';
    if (options.rebase) command += ' --rebase';
    if (options.jobs) command += ` --jobs ${options.jobs}`;
    if (path) command += ` ${path}`;
    
    return this.execute(command);
  }

  /**
   * 同步 submodule URL
   */
  async submoduleSync(recursive = false): Promise<string> {
    const command = recursive ? 'submodule sync --recursive' : 'submodule sync';
    return this.execute(command);
  }

  /**
   * 对所有 submodule 执行命令
   */
  async submoduleForeach(command: string, recursive = false): Promise<string> {
    const cmd = recursive
      ? `submodule foreach --recursive "${command}"`
      : `submodule foreach "${command}"`;
    return this.execute(cmd);
  }

  /**
   * 获取 submodule 的 URL
   */
  async getSubmoduleUrl(path: string): Promise<string> {
    return this.execute(`config -f .gitmodules submodule.${path}.url`);
  }

  /**
   * 获取 submodule 的分支
   */
  async getSubmoduleBranch(path: string): Promise<string> {
    try {
      return await this.execute(`config -f .gitmodules submodule.${path}.branch`);
    } catch {
      return '';
    }
  }
}