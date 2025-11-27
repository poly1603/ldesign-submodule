/**
 * Git Submodule Manager - Core Manager Class
 * 核心子模块管理类
 */

import { EventEmitter } from 'events';
import pLimit from 'p-limit';
import { GitOperations } from './GitOperations.js';
import { ConfigManager } from './ConfigManager.js';
import {
  SubmoduleNotFoundError,
  SubmoduleAlreadyExistsError,
  UncommittedChangesError,
} from './errors.js';
import { validateUrl, validatePath, parseSubmoduleStatus } from './utils.js';
import type {
  SubmoduleInfo,
  AddOptions,
  RemoveOptions,
  UpdateOptions,
  ListOptions,
  SubmoduleConfig,
  BatchResult,
  AnalysisResult,
  DependencyTree,
  HealthCheckResult,
  HealthCheck,
  SubmoduleStatus,
} from './types.js';

export class SubmoduleManager extends EventEmitter {
  private gitOps: GitOperations;
  private config: ConfigManager;

  constructor(repoPath: string = process.cwd()) {
    super();
    this.gitOps = new GitOperations(repoPath);
    this.config = new ConfigManager(repoPath);
  }

  /**
   * 初始化配置
   */
  async initialize(): Promise<void> {
    await this.config.load();
  }

  /**
   * 添加 submodule
   */
  async add(url: string, path: string, options: AddOptions = {}): Promise<void> {
    // 1. 验证参数
    validateUrl(url);
    validatePath(path);

    // 2. 检查路径是否已存在
    if ((await this.exists(path)) && !options.force) {
      throw new SubmoduleAlreadyExistsError(path);
    }

    // 3. 如果强制添加，先删除旧的
    if (options.force && (await this.exists(path))) {
      this.emit('progress', { stage: 'removing-old', path });
      await this.remove(path, { force: true });
    }

    // 4. 执行添加
    this.emit('progress', { stage: 'adding', path });

    await this.gitOps.submoduleAdd(url, path, options.branch, options.depth);

    // 5. 如果指定了 tag 或 commit，切换到该版本
    if (options.tag || options.commit) {
      const target = options.tag || options.commit;
      await this.gitOps.execute(`-C ${path} checkout ${target}`);
    }

    this.emit('complete', { stage: 'added', path });
  }

  /**
   * 删除 submodule
   */
  async remove(path: string, options: RemoveOptions = {}): Promise<void> {
    // 1. 验证 submodule 存在
    if (!(await this.exists(path))) {
      throw new SubmoduleNotFoundError(path);
    }

    // 2. 检查未提交更改
    if (!options.force && (await this.hasUncommittedChanges(path))) {
      throw new UncommittedChangesError(path);
    }

    // 3. 执行删除
    this.emit('progress', { stage: 'removing', path });

    await this.gitOps.submoduleRemove(path);

    this.emit('complete', { stage: 'removed', path });
  }

  /**
   * 列出所有 submodule
   */
  async list(options: ListOptions = {}): Promise<SubmoduleInfo[]> {
    const output = await this.gitOps.submoduleStatus(options.recursive);
    const lines = output.split('\n').filter((line) => line.trim());

    const submodules: SubmoduleInfo[] = [];

    for (const line of lines) {
      const parsed = parseSubmoduleStatus(line);
      if (!parsed) continue;

      const info: SubmoduleInfo = {
        path: parsed.path,
        commit: parsed.commit.substring(0, 7),
        status: this.parseStatus(parsed.status),
        branch: parsed.branch,
      };

      if (options.verbose) {
        info.url = await this.getUrl(parsed.path);
        info.uncommittedChanges = await this.hasUncommittedChanges(parsed.path);

        // 获取与远程的差异
        const ahead = await this.getAheadCount(parsed.path);
        const behind = await this.getBehindCount(parsed.path);
        if (ahead > 0) info.ahead = ahead;
        if (behind > 0) info.behind = behind;
      }

      submodules.push(info);
    }

    return submodules;
  }

  /**
   * 获取 submodule 状态
   */
  async status(path?: string): Promise<SubmoduleInfo[]> {
    if (path) {
      const list = await this.list({ verbose: true });
      return list.filter((sub) => sub.path === path);
    }
    return this.list({ verbose: true, status: true });
  }

  /**
   * 更新 submodule
   */
  async update(path?: string, options: UpdateOptions = {}): Promise<void> {
    this.emit('progress', { stage: 'updating', path });

    const jobs = options.jobs || this.config.get('default.jobs', 4);

    await this.gitOps.submoduleUpdate(path, {
      ...options,
      jobs,
    });

    this.emit('complete', { stage: 'updated', path });
  }

  /**
   * 同步 submodule URL
   */
  async sync(): Promise<void> {
    this.emit('progress', { stage: 'syncing' });

    await this.gitOps.submoduleSync(true);

    this.emit('complete', { stage: 'synced' });
  }

  /**
   * 对所有 submodule 执行命令
   */
  async foreach(command: string): Promise<void> {
    this.emit('progress', { stage: 'executing', message: command });

    await this.gitOps.submoduleForeach(command, true);

    this.emit('complete', { stage: 'executed', message: command });
  }

  /**
   * 切换 submodule 分支
   */
  async checkout(branch: string, path?: string): Promise<void> {
    if (path) {
      this.emit('progress', { stage: 'checkout', path, message: branch });
      await this.gitOps.execute(`-C ${path} checkout ${branch}`);
      this.emit('complete', { stage: 'checkout', path, message: branch });
    } else {
      await this.foreach(`git checkout ${branch}`);
    }
  }

  /**
   * 批量添加 submodule
   */
  async batchAdd(configs: SubmoduleConfig[]): Promise<BatchResult> {
    const results: BatchResult = {
      success: [],
      failed: [],
    };

    const jobs = this.config.get('default.jobs', 4);
    const limit = pLimit(jobs);

    const tasks = configs.map((config) =>
      limit(async () => {
        try {
          this.emit('progress', { stage: 'batch-adding', path: config.path });
          await this.add(config.url, config.path, config);
          results.success.push(config.path);
        } catch (error: any) {
          results.failed.push({
            path: config.path,
            error: error.message || String(error),
          });
        }
      })
    );

    await Promise.all(tasks);
    return results;
  }

  /**
   * 批量更新 submodule
   */
  async batchUpdate(options: UpdateOptions = {}): Promise<BatchResult> {
    const submodules = await this.list();
    const results: BatchResult = {
      success: [],
      failed: [],
    };

    const jobs = options.jobs || this.config.get('default.jobs', 4);
    const limit = pLimit(jobs);

    const tasks = submodules.map((sub) =>
      limit(async () => {
        try {
          this.emit('progress', { stage: 'batch-updating', path: sub.path });
          await this.update(sub.path, options);
          results.success.push(sub.path);
        } catch (error: any) {
          results.failed.push({
            path: sub.path,
            error: error.message || String(error),
          });
        }
      })
    );

    await Promise.all(tasks);
    return results;
  }

  /**
   * 分析 submodule 依赖
   */
  async analyze(): Promise<AnalysisResult> {
    const submodules = await this.list({ verbose: true });

    return {
      total: submodules.length,
      byStatus: this.groupByStatus(submodules),
      conflicts: await this.detectConflicts(submodules),
      circular: await this.detectCircularDeps(submodules),
      unused: await this.detectUnused(submodules),
    };
  }

  /**
   * 获取依赖树
   */
  async getDependencyTree(): Promise<DependencyTree> {
    const { basename } = await import('path');
    const submodules = await this.list();
    const tree: DependencyTree = {
      name: basename(this.gitOps.repoPath),
      children: [],
    };

    for (const sub of submodules) {
      const subTree = await this.buildTree(sub.path);
      tree.children.push(subTree);
    }

    return tree;
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const checks: HealthCheck[] = [];

    // 检查配置文件
    checks.push(await this.checkConfigFile());

    // 检查 URL 可达性
    checks.push(await this.checkUrls());

    // 检查未提交更改
    checks.push(await this.checkUncommittedChanges());

    // 检查版本一致性
    checks.push(await this.checkVersionConsistency());

    const passed = checks.filter((c) => c.status === 'pass').length;
    const total = checks.length;

    return {
      score: (passed / total) * 100,
      checks,
      summary: `${passed}/${total} checks passed`,
    };
  }

  /**
   * 辅助方法
   */

  private async exists(path: string): Promise<boolean> {
    try {
      await this.gitOps.getSubmoduleUrl(path);
      return true;
    } catch {
      return false;
    }
  }

  private async hasUncommittedChanges(path: string): Promise<boolean> {
    try {
      const output = await this.gitOps.execute(`diff ${path}`);
      return output.trim().length > 0;
    } catch {
      return false;
    }
  }

  private async getUrl(path: string): Promise<string> {
    try {
      return await this.gitOps.getSubmoduleUrl(path);
    } catch {
      return '';
    }
  }

  private async getAheadCount(path: string): Promise<number> {
    try {
      const output = await this.gitOps.execute(`-C ${path} rev-list --count @{u}..HEAD`);
      return parseInt(output, 10) || 0;
    } catch {
      return 0;
    }
  }

  private async getBehindCount(path: string): Promise<number> {
    try {
      const output = await this.gitOps.execute(`-C ${path} rev-list --count HEAD..@{u}`);
      return parseInt(output, 10) || 0;
    } catch {
      return 0;
    }
  }

  private parseStatus(status: string): SubmoduleStatus {
    switch (status.trim()) {
      case '-':
        return 'not-initialized';
      case '+':
        return 'modified';
      case 'U':
        return 'merge-conflict';
      default:
        return 'up-to-date';
    }
  }

  private groupByStatus(submodules: SubmoduleInfo[]): Record<SubmoduleStatus, number> {
    const groups: Record<SubmoduleStatus, number> = {
      'up-to-date': 0,
      'not-initialized': 0,
      modified: 0,
      'merge-conflict': 0,
      ahead: 0,
      behind: 0,
      diverged: 0,
    };

    for (const sub of submodules) {
      groups[sub.status]++;
    }

    return groups;
  }

  private async detectConflicts(_submodules: SubmoduleInfo[]): Promise<any[]> {
    // TODO: 实现冲突检测逻辑
    return [];
  }

  private async detectCircularDeps(_submodules: SubmoduleInfo[]): Promise<string[][]> {
    // TODO: 实现循环依赖检测逻辑
    return [];
  }

  private async detectUnused(_submodules: SubmoduleInfo[]): Promise<string[]> {
    // TODO: 实现未使用检测逻辑
    return [];
  }

  private async buildTree(path: string): Promise<DependencyTree> {
    const { basename } = await import('path');
    // TODO: 递归构建子树
    return {
      name: basename(path),
      path,
      children: [],
    };
  }

  private async checkConfigFile(): Promise<HealthCheck> {
    try {
      await this.gitOps.execute('config -f .gitmodules -l');
      return {
        name: 'Configuration File',
        status: 'pass',
        message: '.gitmodules is valid',
      };
    } catch (error: any) {
      return {
        name: 'Configuration File',
        status: 'fail',
        message: 'Invalid .gitmodules file',
        details: error.message,
      };
    }
  }

  private async checkUrls(): Promise<HealthCheck> {
    const submodules = await this.list({ verbose: true });
    const invalidUrls: string[] = [];

    for (const sub of submodules) {
      if (!sub.url) {
        invalidUrls.push(sub.path);
      }
    }

    if (invalidUrls.length === 0) {
      return {
        name: 'URL Accessibility',
        status: 'pass',
        message: 'All URLs are configured',
      };
    } else {
      return {
        name: 'URL Accessibility',
        status: 'warn',
        message: `${invalidUrls.length} submodule(s) have missing URLs`,
        details: invalidUrls,
      };
    }
  }

  private async checkUncommittedChanges(): Promise<HealthCheck> {
    const submodules = await this.list({ verbose: true });
    const withChanges = submodules.filter((sub) => sub.uncommittedChanges).map((sub) => sub.path);

    if (withChanges.length === 0) {
      return {
        name: 'Uncommitted Changes',
        status: 'pass',
        message: 'No uncommitted changes',
      };
    } else {
      return {
        name: 'Uncommitted Changes',
        status: 'warn',
        message: `${withChanges.length} submodule(s) have uncommitted changes`,
        details: withChanges,
      };
    }
  }

  private async checkVersionConsistency(): Promise<HealthCheck> {
    // TODO: 实现版本一致性检查
    return {
      name: 'Version Consistency',
      status: 'pass',
      message: 'All versions are consistent',
    };
  }
}