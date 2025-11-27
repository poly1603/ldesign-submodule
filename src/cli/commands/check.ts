import { Command } from 'commander';
import chalk from 'chalk';
import { SubmoduleManager } from '../../core/index.js';

export default function (program: Command) {
  program
    .command('check')
    .description('Run health checks on submodules')
    .action(async () => {
      try {
        const manager = new SubmoduleManager();
        await manager.initialize();
        const result = await manager.healthCheck();
        console.log(chalk.bold('\nHealth Check Results:'));
        console.log(`Score: ${result.score.toFixed(1)}%`);
        console.log(`Summary: ${result.summary}\n`);
        for (const check of result.checks) {
          const icon = check.status === 'pass' ? '✓' : check.status === 'warn' ? '⚠' : '✗';
          const color = check.status === 'pass' ? chalk.green : check.status === 'warn' ? chalk.yellow : chalk.red;
          console.log(color(`${icon} ${check.name}: ${check.message}`));
        }
      } catch (error) {
        throw error;
      }
    });
}