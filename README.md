# @ldesign/submodule-manager (LSM)

<div align="center">

🚀 **功能强大的 Git Submodule 管理工具**

[![npm version](https://img.shields.io/npm/v/@ldesign/submodule-manager.svg)](https://www.npmjs.com/package/@ldesign/submodule-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

[English](./README.md) | [简体中文](./README.zh-CN.md)

</div>

## ✨ 特性

- 🎯 **完整的 CLI 工具** - 支持所有 git submodule 操作
- 🌐 **Web 可视化界面** - 现代化的 submodule 管理面板，开箱即用
- ⚡ **批量操作** - 并发处理多个 submodule,提高效率
- 📊 **依赖分析** - 检测循环依赖、版本冲突等问题
- 🔧 **配置管理** - 支持全局和项目级配置
- 🎨 **友好的输出** - 彩色终端输出,进度指示器
- 📦 **TypeScript** - 完整的类型定义和 IDE 支持
- 🧪 **健康检查** - 全面的 submodule 状态检查
- 🔒 **只读模式** - 支持只读访问，适合生产环境

## 📦 安装

### 全局安装 (推荐)

```bash
npm install -g @ldesign/submodule-manager
```

### 项目安装

```bash
npm install --save-dev @ldesign/submodule-manager
```

## 🚀 快速开始

### 基础命令

```bash
# 添加 submodule
lsm add https://github.com/user/repo.git packages/module

# 列出所有 submodule
lsm list

# 查看详细状态
lsm status

# 更新 submodule
lsm update

# 删除 submodule
lsm remove packages/module
```

### 高级功能

```bash
# 批量添加 (从配置文件)
lsm batch add -f submodules.yaml

# 对所有 submodule 执行命令
lsm foreach "git pull origin main"

# 分析依赖关系
lsm analyze

# 健康检查
lsm check

# 查看依赖树
lsm tree
```

## 📖 命令参考

### 基础命令

#### `lsm add <url> <path>`
添加新的 submodule

**选项:**
- `-b, --branch <branch>` - 跟踪指定分支
- `-t, --tag <tag>` - 检出指定标签
- `-c, --commit <sha>` - 检出指定提交
- `-f, --force` - 强制添加(覆盖已存在)
- `--depth <n>` - 浅克隆深度

**示例:**
```bash
lsm add https://github.com/org/repo.git packages/module
lsm add https://github.com/org/repo.git packages/module -b develop
lsm add https://github.com/org/repo.git packages/module --depth 1
```

#### `lsm remove <path>`
删除 submodule

**选项:**
- `-f, --force` - 强制删除(忽略未提交更改)
- `--keep-files` - 保留工作目录文件
- `-y, --yes` - 跳过确认提示

**示例:**
```bash
lsm remove packages/module
lsm remove packages/module --force --yes
```

#### `lsm list [options]`
列出所有 submodule

**选项:**
- `-v, --verbose` - 显示详细信息
- `--status` - 包含状态信息
- `-r, --recursive` - 递归显示嵌套 submodule
- `--format <format>` - 输出格式 (table|json|yaml)

**示例:**
```bash
lsm list
lsm list --verbose
lsm list --format json
```

#### `lsm status [path]`
显示 submodule 状态

**示例:**
```bash
lsm status
lsm status packages/module
```

#### `lsm update [path]`
更新 submodule

**选项:**
- `--init` - 初始化未初始化的 submodule
- `-r, --recursive` - 递归更新
- `--remote` - 从远程拉取最新
- `--merge` - 合并上游更改
- `--rebase` - 变基到上游
- `-j, --jobs <n>` - 并发任务数

**示例:**
```bash
lsm update
lsm update packages/module
lsm update --init --recursive
```

### 高级命令

#### `lsm sync`
同步 submodule URL 配置

```bash
lsm sync
```

#### `lsm foreach <command>`
对所有 submodule 执行命令

**示例:**
```bash
lsm foreach "git checkout main"
lsm foreach "npm install"
lsm foreach "git pull origin main"
```

#### `lsm checkout <branch> [path]`
切换 submodule 分支

**示例:**
```bash
lsm checkout main
lsm checkout develop packages/module
```

### 批量操作

#### `lsm batch add -f <file>`
批量添加 submodule

**配置文件格式 (YAML):**
```yaml
submodules:
  - url: https://github.com/org/frontend.git
    path: packages/frontend
    branch: main
  - url: https://github.com/org/backend.git
    path: packages/backend
    branch: develop
```

**示例:**
```bash
lsm batch add -f submodules.yaml
```

#### `lsm batch update`
批量更新所有 submodule

```bash
lsm batch update
```

### 配置管理

#### `lsm config set <key> <value>`
设置配置项

**选项:**
- `-g, --global` - 设置全局配置

**示例:**
```bash
lsm config set default.branch main
lsm config set default.jobs 8
lsm config set ui.color true -g
```

#### `lsm config get <key>`
获取配置项

```bash
lsm config get default.branch
```

#### `lsm config list`
列出所有配置

```bash
lsm config list
```

### 分析工具

#### `lsm analyze`
分析 submodule 依赖关系

```bash
lsm analyze
```

#### `lsm tree`
显示 submodule 依赖树

```bash
lsm tree
```

#### `lsm check`
运行健康检查

```bash
lsm check
```

### Web 界面

#### `lsm serve`
启动 Web 管理界面

**选项:**
- `-p, --port <port>` - 端口号 (默认: 8520)
- `-h, --host <host>` - 主机地址 (默认: localhost)
- `--open` - 自动打开浏览器
- `--readonly` - 只读模式

**示例:**
```bash
# 基本使用（默认端口8520）
lsm serve

# 指定端口并自动打开浏览器
lsm serve -p 9000 --open

# 只读模式（生产环境推荐）
lsm serve --readonly

# 允许外部访问
lsm serve -h 0.0.0.0 -p 3000
```

**Web界面功能:**
- 📋 查看所有子模块及其状态
- ➕ 添加新的子模块
- 🗑️ 删除子模块
- ⬆️ 更新单个或所有子模块
- 🔄 同步子模块URL
- 📊 分析依赖关系
- 🏥 健康检查
- 👁️ 查看详细信息

详见 [Web界面使用指南](./docs/WEB_INTERFACE.md)

## ⚙️ 配置

### 配置文件

LSM 支持两种配置文件:

1. **全局配置**: `~/.lsmrc`
2. **项目配置**: `.lsmrc` (项目根目录)

### 配置示例

```yaml
# 默认配置
default:
  branch: main
  recursive: true
  jobs: 4

# 预设配置
presets:
  production:
    - name: frontend
      url: https://github.com/org/frontend.git
      path: packages/frontend
      branch: main
    - name: backend
      url: https://github.com/org/backend.git
      path: packages/backend
      branch: main

# 命令别名
aliases:
  ls: list --verbose
  up: update --recursive
  st: status
```

## 🏗️ 项目结构

```
@ldesign/submodule-manager/
├── src/
│   ├── cli/              # CLI 命令实现
│   │   ├── commands/     # 各个命令
│   │   └── index.ts      # CLI 入口
│   ├── core/             # 核心业务逻辑
│   │   ├── SubmoduleManager.ts    # 核心管理类
│   │   ├── GitOperations.ts       # Git 操作封装
│   │   ├── ConfigManager.ts       # 配置管理
│   │   ├── types.ts               # 类型定义
│   │   ├── errors.ts              # 错误定义
│   │   └── utils.ts               # 工具函数
│   └── web/              # Web 服务
│       ├── server.ts     # Express 服务器
│       └── public/       # 静态资源
│           ├── index.html
│           ├── styles.css
│           └── app.js
├── tests/                # 测试文件
├── docs/                 # 文档
│   ├── ARCHITECTURE.md   # 架构设计
│   ├── QUICK_START.md    # 快速开始
│   └── IMPLEMENTATION_GUIDE.md  # 实现指南
└── package.json
```

## 🔧 开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# CLI 开发
npm run dev -- add <url> <path>

# 运行测试
npm test

# 代码检查
npm run lint

# 格式化代码
npm run format
```

### 构建

```bash
npm run build
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 测试覆盖率
npm run test:coverage
```

## 📝 待办事项

- [x] 项目基础架构
- [x] 核心 SubmoduleManager 类
- [x] CLI 基础命令
- [x] CLI 高级命令
- [x] 配置管理系统
- [x] 错误处理和日志
- [x] Express Web 服务器
- [x] Web 前端界面
- [ ] WebSocket 实时更新
- [ ] 单元测试和集成测试
- [ ] CI/CD 配置
- [ ] npm 发布

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议!

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Commander.js](https://github.com/tj/commander.js) - CLI 框架
- [Chalk](https://github.com/chalk/chalk) - 终端样式
- [Ora](https://github.com/sindresorhus/ora) - 终端 spinner

## 📞 联系方式

- 作者: ldesign
- 项目主页: https://github.com/ldesign/submodule-manager
- 问题反馈: https://github.com/ldesign/submodule-manager/issues

---

<div align="center">
Made with ❤️ by ldesign
</div>
