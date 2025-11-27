import { Command } from 'commander';
import chalk from 'chalk';
import { SubmoduleManager } from '../../core/index.js';

export default function (program: Command) {
  program
    .command('analyze')
    .description('Analyze submodule dependencies')
    .action(async () => {
      try {
        const manager = new SubmoduleManager();
        await manager.initialize();
        const result = await manager.analyze();
        console.log(chalk.bold('\nSubmodule Analysis:'));
        console.log(`Total: ${result.total}`);
        console.log(`By Status:`, result.byStatus);
        if (result.conflicts.length > 0) {
          console.log(chalk.yellow(`\n⚠ Conflicts: ${result.conflicts.length}`));
        }
      } catch (error) {
        throw error;
      }
    });
}