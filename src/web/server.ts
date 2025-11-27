import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { SubmoduleManager } from '../core/SubmoduleManager.js';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ServerOptions {
  port: number;
  host: string;
  readonly?: boolean;
  projectPath?: string;
}

export class WebServer {
  private app: express.Application;
  private manager: SubmoduleManager;
  private options: ServerOptions;
  private server: any;

  constructor(options: ServerOptions) {
    this.options = options;
    this.app = express();
    this.manager = new SubmoduleManager(options.projectPath || process.cwd());
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // 解析JSON请求体
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // 静态文件服务
    // 构建后: dist/web/public (相对于dist/web/server.js)
    // 开发时: src/web/public (相对于src/web/server.ts)
    const publicPath = path.join(__dirname, 'public');
    this.app.use(express.static(publicPath));

    // CORS支持
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // 只读模式检查
    if (this.options.readonly) {
      this.app.use((_req: Request, res: Response, next: NextFunction) => {
        if (_req.method !== 'GET' && _req.method !== 'HEAD' && _req.method !== 'OPTIONS') {
          res.status(403).json({ error: 'Server is in read-only mode' });
          return;
        }
        next();
      });
    }
  }

  private setupRoutes(): void {
    // 服务器状态
    this.app.get('/api/status', (_req: Request, res: Response) => {
      res.json({ status: 'ok', readonly: this.options.readonly || false });
    });

    // 获取所有子模块列表
    this.app.get('/api/submodules', async (req: Request, res: Response) => {
      try {
        const verbose = req.query.verbose === 'true';
        const submodules = await this.manager.list({ verbose });
        res.json({ success: true, data: submodules });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 获取子模块状态
    this.app.get('/api/submodules/status', async (req: Request, res: Response) => {
      try {
        const path = req.query.path as string | undefined;
        const status = await this.manager.status(path);
        res.json({ success: true, data: status });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 添加子模块
    this.app.post('/api/submodules', async (req: Request, res: Response) => {
      try {
        const { url, path: subPath, branch, depth, tag, commit, force } = req.body;
        if (!url || !subPath) {
          res.status(400).json({ success: false, error: 'URL and path are required' });
          return;
        }
        await this.manager.add(url, subPath, { branch, depth, tag, commit, force });
        res.json({ success: true, message: 'Submodule added successfully' });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 删除子模块
    this.app.delete('/api/submodules/:path(*)', async (req: Request, res: Response) => {
      try {
        const subPath = req.params.path;
        const force = req.query.force === 'true';
        await this.manager.remove(subPath, { force });
        res.json({ success: true, message: 'Submodule removed successfully' });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 更新子模块
    this.app.put('/api/submodules/:path(*)/update', async (req: Request, res: Response) => {
      try {
        const subPath = req.params.path;
        const { remote, merge, rebase, init, recursive, jobs } = req.body;
        await this.manager.update(subPath, { remote, merge, rebase, init, recursive, jobs });
        res.json({ success: true, message: 'Submodule updated successfully' });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 更新所有子模块
    this.app.put('/api/submodules/update-all', async (req: Request, res: Response) => {
      try {
        const { remote, merge, rebase, init, recursive, jobs } = req.body;
        await this.manager.update(undefined, { remote, merge, rebase, init, recursive, jobs });
        res.json({ success: true, message: 'All submodules updated successfully' });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 同步子模块
    this.app.post('/api/submodules/sync', async (_req: Request, res: Response) => {
      try {
        await this.manager.sync();
        res.json({ success: true, message: 'Submodules synced successfully' });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 切换子模块分支
    this.app.post('/api/submodules/:path(*)/checkout', async (req: Request, res: Response) => {
      try {
        const subPath = req.params.path;
        const { branch } = req.body;
        if (!branch) {
          res.status(400).json({ success: false, error: 'Branch is required' });
          return;
        }
        await this.manager.checkout(branch, subPath);
        res.json({ success: true, message: 'Branch checked out successfully' });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 批量操作
    this.app.post('/api/submodules/batch-add', async (req: Request, res: Response) => {
      try {
        const { configs } = req.body;
        if (!Array.isArray(configs)) {
          res.status(400).json({ success: false, error: 'Configs must be an array' });
          return;
        }
        const result = await this.manager.batchAdd(configs);
        res.json({ success: true, data: result });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/submodules/batch-update', async (req: Request, res: Response) => {
      try {
        const options = req.body;
        const result = await this.manager.batchUpdate(options);
        res.json({ success: true, data: result });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 分析和健康检查
    this.app.get('/api/analyze', async (_req: Request, res: Response) => {
      try {
        const result = await this.manager.analyze();
        res.json({ success: true, data: result });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/dependency-tree', async (_req: Request, res: Response) => {
      try {
        const tree = await this.manager.getDependencyTree();
        res.json({ success: true, data: tree });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/health', async (_req: Request, res: Response) => {
      try {
        const result = await this.manager.healthCheck();
        res.json({ success: true, data: result });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 对所有子模块执行命令
    this.app.post('/api/foreach', async (req: Request, res: Response) => {
      try {
        const { command } = req.body;
        if (!command) {
          res.status(400).json({ success: false, error: 'Command is required' });
          return;
        }
        await this.manager.foreach(command);
        res.json({ success: true, message: 'Command executed successfully' });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // 首页
    this.app.get('/', (_req: Request, res: Response) => {
      const indexPath = path.join(__dirname, 'public', 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          res.status(404).send('Web interface not found. Please run "npm run build" to build the project.');
        }
      });
    });

    // 404处理
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: 'Not found' });
    });

    // 错误处理
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error(chalk.red('Server error:'), err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.options.port, this.options.host, () => {
          console.log(chalk.green(`✓ Server started on http://${this.options.host}:${this.options.port}`));
          if (this.options.readonly) {
            console.log(chalk.yellow('  Running in READ-ONLY mode'));
          }
          resolve();
        });

        this.server.on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            console.error(chalk.red(`✗ Port ${this.options.port} is already in use`));
          } else {
            console.error(chalk.red('✗ Server error:'), error.message);
          }
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err: Error) => {
          if (err) {
            reject(err);
          } else {
            console.log(chalk.blue('Server stopped'));
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}