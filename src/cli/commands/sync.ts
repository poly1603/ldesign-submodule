/**
 * CLI Command: sync
 * 同步 submodule URL
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { SubmoduleManager } from '../../core/index.js';

export default function (program: Command) {
  program
    .command('sync')
    .description('Synchronize submodule URLs')
    .action(async () => {
      const spinner = ora('Syncing submodules...').start();

      try {
        const manager = new SubmoduleManager();
        await manager.initialize();

        await manager.sync();

        spinner.succeed(chalk.green('Successfully synced submodule URLs'));
      } catch (error: any) {
        spinner.fail(chalk.red('Failed to sync submodules'));
        throw error;
      }
    });
}