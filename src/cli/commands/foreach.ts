/**
 * CLI Command: foreach
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { SubmoduleManager } from '../../core/index.js';

export default function (program: Command) {
  program
    .command('foreach <command>')
    .description('Execute a command in each submodule')
    .action(async (command: string) => {
      try {
        const manager = new SubmoduleManager();
        await manager.initialize();
        await manager.foreach(command);
        console.log(chalk.green(`✓ Command executed in all submodules`));
      } catch (error: any) {
        console.error(chalk.red('Failed to execute command'));
        throw error;
      }
    });
}