#!/usr/bin/env node

/**
 * Git Submodule Manager - CLI Entry Point
 */

import { Command } from 'commander';
import addCommand from './commands/add.js';
import removeCommand from './commands/remove.js';
import listCommand from './commands/list.js';
import statusCommand from './commands/status.js';
import updateCommand from './commands/update.js';
import syncCommand from './commands/sync.js';
import foreachCommand from './commands/foreach.js';
import checkoutCommand from './commands/checkout.js';
import batchCommand from './commands/batch.js';
import configCommand from './commands/config.js';
import analyzeCommand from './commands/analyze.js';
import treeCommand from './commands/tree.js';
import checkCommand from './commands/check.js';
import serveCommand from './commands/serve.js';

const program = new Command();

// 版本和描述
program
  .name('lsm')
  .description('Git Submodule Manager - A powerful tool for managing git submodules')
  .version('1.0.0');

// 全局选项
program.option('-v, --verbose', 'Enable verbose output');

// 注册命令
addCommand(program);
removeCommand(program);
listCommand(program);
statusCommand(program);
updateCommand(program);
syncCommand(program);
foreachCommand(program);
checkoutCommand(program);
batchCommand(program);
configCommand(program);
analyzeCommand(program);
treeCommand(program);
checkCommand(program);
serveCommand(program);

// 解析命令
program.parse(process.argv);