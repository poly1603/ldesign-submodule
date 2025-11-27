import { Command } from 'commander';
import chalk from 'chalk';
import { SubmoduleManager } from '../../core/index.js';

export default function (program: Command) {
  program
    .command('checkout <branch> [path]')
    .description('Checkout a branch in submodule(s)')
    .action(async (branch: string, path?: string) => {
      try {
        const manager = new SubmoduleManager();
        await manager.initialize();
        await manager.checkout(branch, path);
        console.log(chalk.green(`✓ Checked out ${branch}`));
      } catch (error) {
        console.error(chalk.red('Failed to checkout branch'));
        throw error;
      }
    });
}