import { Command } from 'commander';
import chalk from 'chalk';
import { WebServer } from '../../web/server.js';
import open from 'open';
import net from 'net';

// 检查端口是否可用
async function isPortAvailable(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, host);
  });
}

// 查找可用端口
async function findAvailablePort(startPort: number, host: string, maxAttempts: number = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port, host)) {
      return port;
    }
  }
  throw new Error(`No available port found between ${startPort} and ${startPort + maxAttempts - 1}`);
}

export default function (program: Command) {
  program
    .command('serve')
    .description('Start web management interface')
    .option('-p, --port <port>', 'Port number', '8520')
    .option('-h, --host <host>', 'Host address', '127.0.0.1')
    .option('--open', 'Open browser automatically')
    .option('--readonly', 'Start in read-only mode')
    .action(async (options: any) => {
      try {
        let port = parseInt(options.port, 10);
        const host = options.host;
        
        // 检查端口是否可用
        if (!(await isPortAvailable(port, host))) {
          console.log(chalk.yellow(`⚠ Port ${port} is already in use, finding available port...`));
          port = await findAvailablePort(port + 1, host);
          console.log(chalk.green(`✓ Found available port: ${port}`));
        }
        
        const server = new WebServer({
          port,
          host,
          readonly: options.readonly,
          projectPath: process.cwd(),
        });

        await server.start();

        const url = `http://${host}:${port}`;
        console.log(chalk.green('\n✓ Web interface is ready!'));
        console.log(chalk.blue(`  Open: ${url}`));
        console.log(chalk.gray('\n  Press Ctrl+C to stop the server\n'));

        if (options.open) {
          console.log(chalk.gray('Opening browser...'));
          await open(url);
        }

        // 优雅关闭
        const shutdown = async () => {
          console.log(chalk.yellow('\n\nShutting down server...'));
          await server.stop();
          process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
      } catch (error: any) {
        console.error(chalk.red('✗ Failed to start server:'), error.message);
        process.exit(1);
      }
    });
}