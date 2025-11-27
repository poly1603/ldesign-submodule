# Git Submodule Manager - 快速开始指南

## 🚀 实现顺序

### Phase 1: 项目基础 (任务 1-2)
1. 初始化 npm 项目
2. 配置 TypeScript
3. 设置代码规范工具 (ESLint, Prettier)
4. 创建目录结构

### Phase 2: 核心功能 (任务 3-8)
1. 实现 `GitOperations` 类 - Git 命令封装
2. 实现 `SubmoduleManager` 类 - 核心业务逻辑
3. 实现 `ConfigManager` 类 - 配置管理
4. 实现 CLI 基础命令
5. 实现 CLI 高级命令
6. 添加错误处理和日志

### Phase 3: Web 界面 (任务 9-11)
1. 创建 Express 服务器
2. 实现 RESTful API
3. 创建 React 前端
4. 添加 WebSocket 支持

### Phase 4: 测试和文档 (任务 12-13)
1. 编写单元测试
2. 编写集成测试
3. 完善文档

### Phase 5: 发布准备 (任务 14-15)
1. 配置构建脚本
2. 设置 CI/CD
3. 发布到 npm

## 📦 关键依赖包

```json
{
  "dependencies": {
    "commander": "^11.0.0",
    "express": "^4.18.0",
    "socket.io": "^4.6.0",
    "chalk": "^5.3.0",
    "ora": "^7.0.0",
    "p-limit": "^5.0.0",
    "yaml": "^2.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0",
    "typescript": "^5.3.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.0",
    "vite": "^5.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

## 🎯 核心文件清单

### 必须创建的文件 (按优先级)

1. **配置文件**
   - `package.json` - 项目配置
   - `tsconfig.json` - TypeScript 配置
   - `.eslintrc.js` - ESLint 配置
   - `.prettierrc` - Prettier 配置

2. **核心逻辑** (src/core/)
   - `types.ts` - TypeScript 类型定义
   - `errors.ts` - 错误类定义
   - `GitOperations.ts` - Git 命令封装
   - `SubmoduleManager.ts` - 核心管理类
   - `ConfigManager.ts` - 配置管理
   - `utils.ts` - 工具函数

3. **CLI** (src/cli/)
   - `index.ts` - CLI 入口
   - `commands/add.ts` - add 命令
   - `commands/remove.ts` - remove 命令
   - `commands/list.ts` - list 命令
   - `commands/status.ts` - status 命令
   - `commands/update.ts` - update 命令
   - `commands/serve.ts` - serve 命令

4. **服务器** (src/server/)
   - `index.ts` - 服务器入口
   - `routes/submodules.ts` - submodule 路由
   - `websocket/index.ts` - WebSocket 处理

5. **前端** (src/web/)
   - `src/App.tsx` - 主应用组件
   - `src/main.tsx` - 入口文件
   - `src/components/SubmoduleList.tsx` - 列表组件
   - `vite.config.ts` - Vite 配置

## 💡 实现提示

### Git 命令执行模式
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function executeGit(command: string): Promise<string> {
  const { stdout, stderr } = await execAsync(`git ${command}`, {
    cwd: process.cwd()
  });
  if (stderr && !stderr.includes('warning')) {
    throw new Error(stderr);
  }
  return stdout.trim();
}
```

### CLI 命令注册模式
```typescript
import { Command } from 'commander';

const program = new Command();

program
  .name('lsm')
  .description('Git Submodule Manager')
  .version('1.0.0');

program
  .command('add <url> <path>')
  .description('Add a submodule')
  .option('-b, --branch <branch>', 'Branch name')
  .action(async (url, path, options) => {
    // 实现逻辑
  });
```

### Web API 路由模式
```typescript
import express from 'express';

const router = express.Router();

router.get('/submodules', async (req, res) => {
  try {
    const manager = new SubmoduleManager();
    const list = await manager.list();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

## 📝 测试用例示例

```typescript
describe('SubmoduleManager', () => {
  let manager: SubmoduleManager;

  beforeEach(() => {
    manager = new SubmoduleManager('/test/repo');
  });

  test('should add submodule', async () => {
    await manager.add(
      'https://github.com/test/repo.git',
      'packages/test'
    );
    const list = await manager.list();
    expect(list).toContainEqual(
      expect.objectContaining({ path: 'packages/test' })
    );
  });
});
```

## 🔍 调试命令

```bash
# 开发模式运行 CLI
npm run dev -- add <url> <path>

# 启动开发服务器
npm run dev:server

# 启动前端开发
npm run dev:web

# 运行测试
npm test

# 构建项目
npm run build
```

## ✅ 验收标准

每个 Phase 完成后应该能够:

**Phase 1**: 
- ✓ TypeScript 编译通过
- ✓ ESLint 无错误
- ✓ 目录结构正确

**Phase 2**: 
- ✓ 所有 CLI 命令可执行
- ✓ 能够添加、删除、列出 submodule
- ✓ 错误处理完善

**Phase 3**: 
- ✓ Web 服务器启动成功
- ✓ 前端页面正常显示
- ✓ API 调用正常
- ✓ 实时更新工作正常

**Phase 4**: 
- ✓ 测试覆盖率 > 70%
- ✓ 所有测试通过
- ✓ 文档完整

**Phase 5**: 
- ✓ 构建成功
- ✓ 可以全局安装
- ✓ CI/CD 通过

---

**准备好开始实现了吗? 🚀**