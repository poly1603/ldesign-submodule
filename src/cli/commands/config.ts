import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../../core/index.js';

export default function (program: Command) {
  const config = program.command('config').description('Manage configuration');

  config
    .command('set <key> <value>')
    .option('-g, --global', 'Set global configuration')
    .action(async (key: string, value: string, options: any) => {
      const manager = new ConfigManager();
      await manager.set(key, value, { global: options.global });
      console.log(chalk.green(`✓ Set ${key} = ${value}`));
    });

  config
    .command('get <key>')
    .action(async (key: string) => {
      const manager = new ConfigManager();
      await manager.load();
      console.log(manager.get(key, ''));
    });

  config
    .command('list')
    .action(async () => {
      const manager = new ConfigManager();
      await manager.load();
      console.log(JSON.stringify(manager.getAll(), null, 2));
    });
}