/**
 * CLI Command: remove
 * 删除 submodule
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { SubmoduleManager } from '../../core/index.js';

export default function (program: Command) {
  program
    .command('remove <path>')
    .description('Remove a submodule')
    .option('-f, --force', 'Force removal (discard uncommitted changes)')
    .option('--keep-files', 'Keep files in working directory')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (path: string, options: any) => {
      const spinner = ora('Removing submodule...').start();

      try {
        const manager = new SubmoduleManager();
        await manager.initialize();

        manager.on('progress', (event: any) => {
          spinner.text = `${event.stage}: ${path}`;
        });

        await manager.remove(path, {
          force: options.force,
          keepFiles: options.keepFiles,
          yes: options.yes,
        });

        spinner.succeed(chalk.green(`Successfully removed submodule: ${path}`));
      } catch (error: any) {
        spinner.fail(chalk.red('Failed to remove submodule'));
        throw error;
      }
    });
}