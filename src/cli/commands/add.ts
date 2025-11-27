/**
 * CLI Command: add
 * 添加 submodule
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { SubmoduleManager } from '../../core/index.js';

export default function (program: Command) {
  program
    .command('add <url> <path>')
    .description('Add a new submodule')
    .option('-b, --branch <branch>', 'Branch to track')
    .option('-t, --tag <tag>', 'Tag to checkout')
    .option('-c, --commit <sha>', 'Commit to checkout')
    .option('-f, --force', 'Force add (overwrite existing)')
    .option('--depth <n>', 'Create a shallow clone with a history truncated to <n> commits', parseInt)
    .option('--no-checkout', 'Do not checkout HEAD after clone is complete')
    .action(async (url: string, path: string, options: any) => {
      const spinner = ora('Adding submodule...').start();

      try {
        const manager = new SubmoduleManager();
        await manager.initialize();

        // 监听进度事件
        manager.on('progress', (event) => {
          spinner.text = `${event.stage}: ${path}`;
        });

        await manager.add(url, path, {
          branch: options.branch,
          tag: options.tag,
          commit: options.commit,
          force: options.force,
          depth: options.depth,
          noCheckout: !options.checkout,
        });

        spinner.succeed(chalk.green(`Successfully added submodule: ${path}`));
        console.log(chalk.gray(`  URL: ${url}`));
        if (options.branch) {
          console.log(chalk.gray(`  Branch: ${options.branch}`));
        }
      } catch (error: any) {
        spinner.fail(chalk.red('Failed to add submodule'));
        throw error;
      }
    });
}