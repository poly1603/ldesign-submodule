/**
 * CLI Command: update
 * 更新 submodule
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { SubmoduleManager } from '../../core/index.js';

export default function (program: Command) {
  program
    .command('update [path]')
    .description('Update submodule(s)')
    .option('--init', 'Initialize uninitialized submodules')
    .option('-r, --recursive', 'Update nested submodules recursively')
    .option('--remote', 'Fetch and merge latest from remote')
    .option('--merge', 'Merge upstream changes')
    .option('--rebase', 'Rebase current branch onto upstream')
    .option('-j, --jobs <n>', 'Number of parallel jobs', parseInt)
    .action(async (path: string | undefined, options: any) => {
      const spinner = ora('Updating submodule(s)...').start();

      try {
        const manager = new SubmoduleManager();
        await manager.initialize();

        manager.on('progress', (event: any) => {
          spinner.text = `${event.stage}${event.path ? `: ${event.path}` : ''}`;
        });

        await manager.update(path, {
          init: options.init,
          recursive: options.recursive,
          remote: options.remote,
          merge: options.merge,
          rebase: options.rebase,
          jobs: options.jobs,
        });

        spinner.succeed(
          chalk.green(`Successfully updated ${path || 'all submodules'}`)
        );
      } catch (error: any) {
        spinner.fail(chalk.red('Failed to update submodule(s)'));
        throw error;
      }
    });
}