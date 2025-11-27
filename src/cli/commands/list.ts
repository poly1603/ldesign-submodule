/**
 * CLI Command: list
 * 列出所有 submodule
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { SubmoduleManager, formatTable } from '../../core/index.js';

export default function (program: Command) {
  program
    .command('list')
    .alias('ls')
    .description('List all submodules')
    .option('-v, --verbose', 'Show detailed information')
    .option('--status', 'Include status information')
    .option('-r, --recursive', 'List nested submodules')
    .option('--format <format>', 'Output format (table|json|yaml)', 'table')
    .action(async (options: any) => {
      try {
        const manager = new SubmoduleManager();
        await manager.initialize();

        const submodules = await manager.list({
          verbose: options.verbose,
          status: options.status,
          recursive: options.recursive,
        });

        if (submodules.length === 0) {
          console.log(chalk.yellow('No submodules found'));
          return;
        }

        // 根据格式输出
        if (options.format === 'json') {
          console.log(JSON.stringify(submodules, null, 2));
        } else if (options.format === 'yaml') {
          const yaml = await import('yaml');
          console.log(yaml.stringify(submodules));
        } else {
          // 表格格式
          const headers = ['PATH', 'COMMIT', 'BRANCH', 'STATUS'];
          const rows = submodules.map((sub) => [
            sub.path,
            sub.commit,
            sub.branch || '-',
            getStatusColor(sub.status),
          ]);

          if (options.verbose) {
            headers.push('URL');
            rows.forEach((row, i) => {
              row.push(submodules[i].url || '-');
            });
          }

          console.log(formatTable(headers, rows));
          console.log(chalk.gray(`\nTotal: ${submodules.length} submodule(s)`));
        }
      } catch (error: any) {
        console.error(chalk.red('Failed to list submodules'));
        throw error;
      }
    });
}

function getStatusColor(status: string): string {
  const colors: Record<string, any> = {
    'up-to-date': chalk.green,
    modified: chalk.yellow,
    'not-initialized': chalk.gray,
    'merge-conflict': chalk.red,
    ahead: chalk.cyan,
    behind: chalk.magenta,
    diverged: chalk.red,
  };

  const color = colors[status] || chalk.white;
  return color(status);
}