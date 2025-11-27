# 发布指南

本文档说明如何将此包发布到npm，确保用户安装后可以直接使用Web管理界面。

## 发布前检查清单

### 1. 构建项目

```bash
npm run build
```

这会编译TypeScript代码到`dist`目录。

### 2. 验证包内容

```bash
npm run verify
```

此命令会检查：
- ✅ 所有必需的编译文件是否存在
- ✅ Web静态资源是否正确包含
- ✅ package.json配置是否正确
- ✅ 依赖项是否完整

### 3. 本地测试

#### 方法1: 使用npm link

```bash
# 在项目根目录
npm link

# 在另一个测试目录
mkdir test-project
cd test-project
git init
npm link @ldesign/submodule-manager

# 测试命令
lsm serve --open
```

#### 方法2: 使用npm pack

```bash
# 打包
npm pack

# 在测试目录安装
mkdir test-project
cd test-project
git init
npm install ../ldesign-submodule-manager-1.0.0.tgz

# 测试
npx lsm serve --open
```

### 4. 检查包内容

```bash
# 查看将要发布的文件
npm pack --dry-run

# 或者实际打包并检查
npm pack
tar -tzf ldesign-submodule-manager-*.tgz
```

确保包含以下内容：
```
package/
├── dist/              # 所有编译后的代码和资源
│   ├── cli/          # CLI代码
│   ├── core/         # 核心代码
│   └── web/          # Web服务
│       ├── server.js # Express服务器
│       └── public/   # 静态Web资源 (重要!)
│           ├── index.html
│           ├── styles.css
│           └── app.js
├── package.json
└── README.md
```

## 发布步骤

### 首次发布

1. **登录npm**
   ```bash
   npm login
   ```

2. **验证登录**
   ```bash
   npm whoami
   ```

3. **发布**
   ```bash
   npm publish --access public
   ```

### 更新版本

1. **更新版本号**
   ```bash
   # 补丁版本 (1.0.0 -> 1.0.1)
   npm version patch

   # 小版本 (1.0.0 -> 1.1.0)
   npm version minor

   # 大版本 (1.0.0 -> 2.0.0)
   npm version major
   ```

2. **推送标签**
   ```bash
   git push --follow-tags
   ```

3. **发布**
   ```bash
   npm publish
   ```

## 关键配置说明

### package.json

```json
{
  "files": [
    "dist",
    "README.md",
    "LICENSE",
    "src/web/public"  // 👈 确保静态资源被包含
  ],
  "bin": {
    "lsm": "dist/cli/index.js"  // 👈 CLI入口
  },
  "main": "dist/core/index.js",
  "types": "dist/core/index.d.ts"
}
```

### .npmignore

确保`.npmignore`不会排除重要文件：
```
# 开发文件
*.test.ts
...

# 但保留
!src/web/public/**
```

### 静态文件路径处理

在`src/web/server.ts`中，代码会自动尝试多个路径来查找静态文件：

```typescript
const publicPaths = [
  path.join(__dirname, 'public'),                    // 开发环境
  path.join(__dirname, '../../src/web/public'),      // 编译后
  path.join(process.cwd(), 'src/web/public'),        // 项目根
  path.join(__dirname, '../../../src/web/public'),   // npm包
];
```

这确保了在各种环境下都能正确找到静态文件。

## 用户安装后的使用

用户安装包后：

```bash
# 全局安装
npm install -g @ldesign/submodule-manager

# 使用
cd /path/to/git/project
lsm serve --open
```

或者局部安装：

```bash
# 项目中安装
npm install --save-dev @ldesign/submodule-manager

# 使用
npx lsm serve --open
```

## 验证发布成功

发布后，在一个全新的环境测试：

```bash
# 清理缓存
npm cache clean --force

# 安装
npm install -g @ldesign/submodule-manager

# 测试
mkdir test-repo
cd test-repo
git init
lsm serve --open
```

应该能够：
1. ✅ 成功启动服务器
2. ✅ 浏览器打开Web界面
3. ✅ 看到完整的UI（样式正常）
4. ✅ 所有功能可用

## 常见问题

### 问题1: Web界面404

**原因**: 静态文件未包含在npm包中

**解决**:
1. 检查`package.json`的`files`字段
2. 确保`src/web/public`在列表中
3. 运行`npm run verify`检查

### 问题2: 样式丢失

**原因**: CSS/JS文件未正确加载

**解决**:
1. 检查`src/web/public`目录是否完整
2. 验证文件路径解析逻辑
3. 查看服务器日志

### 问题3: 命令找不到

**原因**: bin字段配置错误

**解决**:
1. 检查`package.json`的`bin`字段
2. 确保指向`dist/cli/index.js`
3. 文件需要有执行权限和shebang

### 问题4: 依赖缺失

**原因**: dependencies配置不完整

**解决**:
1. 确保`express`和`open`在dependencies中
2. 不要放在devDependencies
3. 运行`npm run verify`

## 回滚发布

如果发现问题需要撤回：

```bash
# 废弃特定版本 (不推荐频繁使用)
npm deprecate @ldesign/submodule-manager@1.0.0 "有问题，请使用1.0.1"

# 24小时内可以完全撤回
npm unpublish @ldesign/submodule-manager@1.0.0
```

**注意**: npm不鼓励频繁unpublish，建议发布修复版本。

## Beta版本发布

在正式发布前，可以先发布beta版本测试：

```bash
# 更新到beta版本
npm version 1.1.0-beta.0

# 发布到beta tag
npm publish --tag beta

# 用户安装beta版本
npm install @ldesign/submodule-manager@beta
```

## CI/CD集成

可以配置GitHub Actions自动发布：

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm run verify
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 总结

遵循以上步骤，确保：
1. ✅ 代码正确编译
2. ✅ 静态资源包含在包中
3. ✅ 路径解析在各环境正常
4. ✅ 依赖完整
5. ✅ 本地测试通过

这样用户安装后就能直接使用完整的Web管理界面了！