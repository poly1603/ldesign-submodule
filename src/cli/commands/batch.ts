import { Command } from 'commander';
import chalk from 'chalk';
import { SubmoduleManager } from '../../core/index.js';

export default function (program: Command) {
  const batch = program.command('batch').description('Batch operations on submodules');

  batch
    .command('add <file>')
    .description('Batch add submodules from config file')
    .action(async (file: string) => {
      try {
        const manager = new SubmoduleManager();
        await manager.initialize();
        const configs = await manager['config'].loadBatchConfig(file);
        const result = await manager.batchAdd(configs);
        console.log(chalk.green(`✓ Added ${result.success.length} submodules`));
        if (result.failed.length > 0) {
          console.log(chalk.yellow(`⚠ Failed: ${result.failed.length}`));
        }
      } catch (error) {
        throw error;
      }
    });

  batch
    .command('update')
    .description('Batch update all submodules')
    .action(async () => {
      try {
        const manager = new SubmoduleManager();
        await manager.initialize();
        const result = await manager.batchUpdate();
        console.log(chalk.green(`✓ Updated ${result.success.length} submodules`));
      } catch (error) {
        throw error;
      }
    });
}