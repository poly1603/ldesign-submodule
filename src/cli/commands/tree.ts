import { Command } from 'commander';
import chalk from 'chalk';
import { SubmoduleManager } from '../../core/index.js';

export default function (program: Command) {
  program
    .command('tree')
    .description('Show submodule dependency tree')
    .action(async () => {
      try {
        const manager = new SubmoduleManager();
        await manager.initialize();
        const tree = await manager.getDependencyTree();
        console.log(chalk.bold('\nDependency Tree:'));
        console.log(JSON.stringify(tree, null, 2));
      } catch (error) {
        throw error;
      }
    });
}