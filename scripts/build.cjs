#!/usr/bin/env node

/**
 * 构建脚本 - 复制静态文件到dist目录
 */

const fs = require('fs');
const path = require('path');

// 源目录和目标目录
const sourceDir = path.join(__dirname, '../src/web/public');
const targetDir = path.join(__dirname, '../dist/web/public');

/**
 * 递归创建目录
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 递归复制文件
 */
function copyRecursive(source, target) {
  if (!fs.existsSync(source)) {
    console.error(`❌ 源目录不存在: ${source}`);
    process.exit(1);
  }

  ensureDirectoryExists(target);

  const items = fs.readdirSync(source);
  let fileCount = 0;

  items.forEach(item => {
    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      copyRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
      fileCount++;
      console.log(`  ✓ ${item}`);
    }
  });

  return fileCount;
}

// 主流程
console.log('📦 开始复制Web静态文件...\n');

try {
  const fileCount = copyRecursive(sourceDir, targetDir);
  console.log(`\n✅ 成功复制 ${fileCount} 个文件到 dist/web/public/`);
} catch (error) {
  console.error('❌ 复制失败:', error.message);
  process.exit(1);
}