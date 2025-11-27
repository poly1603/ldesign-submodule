#!/usr/bin/env node

/**
 * 验证npm包是否包含必要的文件
 */

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'dist/core/index.js',
  'dist/core/index.d.ts',
  'dist/cli/index.js',
  'dist/web/server.js',
  'dist/web/public/index.html',
  'dist/web/public/styles.css',
  'dist/web/public/app.js',
  'package.json',
  'README.md',
];

const optionalFiles = [
  'LICENSE',
];

console.log('🔍 验证npm包内容...\n');

let hasErrors = false;

// 检查必需文件
console.log('检查必需文件:');
for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  if (exists) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} - 缺失!`);
    hasErrors = true;
  }
}

// 检查可选文件
console.log('\n检查可选文件:');
for (const file of optionalFiles) {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  if (exists) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ⚠ ${file} - 建议添加`);
  }
}

// 检查public目录内容
console.log('\n检查Web资源 (dist目录):');
const publicDir = path.join(__dirname, '..', 'dist/web/public');
if (fs.existsSync(publicDir)) {
  const files = fs.readdirSync(publicDir);
  console.log(`  ✓ 找到 ${files.length} 个文件:`);
  files.forEach(file => {
    const stat = fs.statSync(path.join(publicDir, file));
    console.log(`    - ${file} (${Math.round(stat.size / 1024)}KB)`);
  });
} else {
  console.log('  ✗ dist/web/public目录不存在!');
  console.log('  请运行 "npm run build" 构建项目');
  hasErrors = true;
}

// 检查package.json配置
console.log('\n检查package.json配置:');
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

if (pkg.files && pkg.files.includes('dist')) {
  console.log('  ✓ files字段包含dist');
} else {
  console.log('  ✗ files字段缺少dist');
  hasErrors = true;
}

if (pkg.bin && pkg.bin.lsm) {
  console.log(`  ✓ bin字段已配置: ${pkg.bin.lsm}`);
} else {
  console.log('  ✗ bin字段未配置');
  hasErrors = true;
}

if (pkg.dependencies && pkg.dependencies.express) {
  console.log('  ✓ 包含express依赖');
} else {
  console.log('  ✗ 缺少express依赖');
  hasErrors = true;
}

if (pkg.dependencies && pkg.dependencies.open) {
  console.log('  ✓ 包含open依赖');
} else {
  console.log('  ✗ 缺少open依赖');
  hasErrors = true;
}

console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ 验证失败! 请修复上述错误后再发布。');
  process.exit(1);
} else {
  console.log('✅ 验证通过! 包可以安全发布。');
  process.exit(0);
}