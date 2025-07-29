#!/usr/bin/env node
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const testFiles = fs.readdirSync(testDir).filter(f => f.startsWith('test-') && f.endsWith('.mjs') && f !== 'test-all.mjs');

async function runTest(file) {
  return new Promise((resolve) => {
    const proc = spawn('node', [path.join(testDir, file)], { stdio: 'inherit' });
    proc.on('close', code => resolve({ file, code }));
  });
}

(async () => {
  console.log('🧪 运行所有测试用例...\n');
  for (const file of testFiles) {
    console.log(`\n===== 运行 ${file} =====`);
    await runTest(file);
  }
  console.log('\n✅ 所有测试用例已运行完毕！');
})();