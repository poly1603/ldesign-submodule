/**
 * CLI Command: status
 * 显示 submodule 状态
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { SubmoduleManager } from '../../core/index.js';

export default function (program: Command) {
  program
    .command('status [path]')
    .description('Show submodule status')
    .action(async (path?: string) => {
      try {
        const manager = new SubmoduleManager();
        await manager.initialize();

        const submodules = await manager.status(path);

        if (submodules.length === 0) {
          console.log(chalk.yellow('No submodules found'));
          return;
        }

        for (const sub of submodules) {
          console.log(chalk.bold(`\n${sub.path}:`));
          console.log(`  Commit: ${sub.commit}`);
          console.log(`  Branch: ${sub.branch || 'detached'}`);
          console.log(`  Status: ${getStatusText(sub.status)}`);
          
          if (sub.url) {
            console.log(`  URL: ${chalk.gray(sub.url)}`);
          }
          
          if (sub.uncommittedChanges) {
            console.log(chalk.yellow('  ⚠ Has uncommitted changes'));
          }
          
          if (sub.ahead) {
            console.log(chalk.cyan(`  ↑ Ahead ${sub.ahead} commit(s)`));
          }
          
          if (sub.behind) {
            console.log(chalk.magenta(`  ↓ Behind ${sub.behind} commit(s)`));
          }
        }
      } catch (error: any) {
        console.error(chalk.red('Failed to get status'));
        throw error;
      }
    });
}

function getStatusText(status: string): string {
  const icons: Record<string, string> = {
    'up-to-date': '✓',
    modified: '✗',
    'not-initialized': '○',
    'merge-conflict': '⚠',
  };

  const colors: Record<string, any> = {
    'up-to-date': chalk.green,
    modified: chalk.yellow,
    'not-initialized': chalk.gray,
    'merge-conflict': chalk.red,
  };

  const icon = icons[status] || '?';
  const color = colors[status] || chalk.white;
  
  return color(`${icon} ${status}`);
}