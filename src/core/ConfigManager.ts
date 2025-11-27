/**
 * Git Submodule Manager - Configuration Manager
 * 管理全局和项目级配置
 */

import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import * as yaml from 'yaml';
import { ConfigError } from './errors.js';
import type { ConfigData, SubmoduleConfig } from './types.js';

export class ConfigManager {
  private globalConfigPath: string;
  private localConfigPath: string;
  private config: ConfigData = {};

  constructor(repoPath: string = process.cwd()) {
    this.globalConfigPath = join(homedir(), '.lsmrc');
    this.localConfigPath = join(repoPath, '.lsmrc');
  }

  /**
   * 加载配置（全局 + 本地，本地优先）
   */
  async load(): Promise<void> {
    const globalConfig = await this.loadConfigFile(this.globalConfigPath);
    const localConfig = await this.loadConfigFile(this.localConfigPath);

    // 合并配置，本地配置优先
    this.config = this.mergeConfig(globalConfig, localConfig);
  }

  /**
   * 获取配置值
   */
  get<T = any>(key: string, defaultValue?: T): T {
    const keys = key.split('.');
    let value: any = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue as T;
      }
    }

    return value as T;
  }

  /**
   * 设置配置值
   */
  async set(key: string, value: any, options: { global?: boolean } = {}): Promise<void> {
    const keys = key.split('.');
    const configPath = options.global ? this.globalConfigPath : this.localConfigPath;

    // 加载现有配置
    const config = await this.loadConfigFile(configPath);

    // 设置新值
    let current: any = config;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }
    current[keys[keys.length - 1]] = value;

    // 保存配置
    await this.saveConfigFile(configPath, config);

    // 重新加载配置
    await this.load();
  }

  /**
   * 删除配置值
   */
  async unset(key: string, options: { global?: boolean } = {}): Promise<void> {
    const keys = key.split('.');
    const configPath = options.global ? this.globalConfigPath : this.localConfigPath;

    // 加载现有配置
    const config = await this.loadConfigFile(configPath);

    // 删除值
    let current: any = config;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current)) return;
      current = current[k];
    }
    delete current[keys[keys.length - 1]];

    // 保存配置
    await this.saveConfigFile(configPath, config);

    // 重新加载配置
    await this.load();
  }

  /**
   * 获取所有配置
   */
  getAll(): ConfigData {
    return { ...this.config };
  }

  /**
   * 保存预设
   */
  async savePreset(name: string, configs: SubmoduleConfig[]): Promise<void> {
    const presets = this.get<Record<string, SubmoduleConfig[]>>('presets', {});
    presets[name] = configs;
    await this.set('presets', presets);
  }

  /**
   * 加载预设
   */
  getPreset(name: string): SubmoduleConfig[] | undefined {
    const presets = this.get<Record<string, SubmoduleConfig[]>>('presets', {});
    return presets[name];
  }

  /**
   * 列出所有预设
   */
  listPresets(): string[] {
    const presets = this.get<Record<string, SubmoduleConfig[]>>('presets', {});
    return Object.keys(presets);
  }

  /**
   * 删除预设
   */
  async deletePreset(name: string): Promise<void> {
    const presets = this.get<Record<string, SubmoduleConfig[]>>('presets', {});
    delete presets[name];
    await this.set('presets', presets);
  }

  /**
   * 设置别名
   */
  async setAlias(alias: string, command: string): Promise<void> {
    const aliases = this.get<Record<string, string>>('aliases', {});
    aliases[alias] = command;
    await this.set('aliases', aliases);
  }

  /**
   * 获取别名对应的命令
   */
  getAlias(alias: string): string | undefined {
    const aliases = this.get<Record<string, string>>('aliases', {});
    return aliases[alias];
  }

  /**
   * 列出所有别名
   */
  listAliases(): Record<string, string> {
    return this.get<Record<string, string>>('aliases', {});
  }

  /**
   * 删除别名
   */
  async deleteAlias(alias: string): Promise<void> {
    const aliases = this.get<Record<string, string>>('aliases', {});
    delete aliases[alias];
    await this.set('aliases', aliases);
  }

  /**
   * 从文件加载配置
   */
  private async loadConfigFile(path: string): Promise<ConfigData> {
    try {
      const content = await fs.readFile(path, 'utf-8');
      
      // 支持 YAML 和 JSON 格式
      if (path.endsWith('.json')) {
        return JSON.parse(content);
      } else {
        return yaml.parse(content) || {};
      }
    } catch (error: any) {
      // 文件不存在时返回空配置
      if (error.code === 'ENOENT') {
        return {};
      }
      throw new ConfigError(`Failed to load config from ${path}`, error);
    }
  }

  /**
   * 保存配置到文件
   */
  private async saveConfigFile(path: string, config: ConfigData): Promise<void> {
    try {
      // 确保目录存在
      await fs.mkdir(dirname(path), { recursive: true });

      // 保存为 YAML 格式
      const content = yaml.stringify(config);
      await fs.writeFile(path, content, 'utf-8');
    } catch (error: any) {
      throw new ConfigError(`Failed to save config to ${path}`, error);
    }
  }

  /**
   * 合并配置对象
   */
  private mergeConfig(base: ConfigData, override: ConfigData): ConfigData {
    const result: ConfigData = { ...base };

    for (const key in override) {
      if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
        result[key] = this.mergeConfig(
          (base[key] as ConfigData) || {},
          override[key] as ConfigData
        );
      } else {
        result[key] = override[key];
      }
    }

    return result;
  }

  /**
   * 从批量配置文件加载 submodule 配置
   */
  async loadBatchConfig(filePath: string): Promise<SubmoduleConfig[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = yaml.parse(content);

      if (!data || !data.submodules || !Array.isArray(data.submodules)) {
        throw new ConfigError('Invalid batch config file format');
      }

      return data.submodules;
    } catch (error: any) {
      if (error instanceof ConfigError) throw error;
      throw new ConfigError(`Failed to load batch config from ${filePath}`, error);
    }
  }
}