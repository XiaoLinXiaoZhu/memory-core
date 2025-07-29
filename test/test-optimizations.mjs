#!/usr/bin/env node
import { ZettelkastenManager } from '../dist/index.js';
import * as path from 'path';
import fs from 'fs-extra';

async function testOptimizations() {
  const testDir = path.join(process.cwd(), 'test-optimizations');
  
  // 清理测试目录
  if (await fs.pathExists(testDir)) {
    await fs.remove(testDir);
  }

  const manager = new ZettelkastenManager({
    storageDir: testDir,
    autoCreateDir: true
  });

  try {
    console.log('🧪 测试优化功能...\n');

    // 测试1: 自动创建占位文件
    console.log('1. 测试自动创建占位文件');
    await manager.setContent('主记忆片段', '这是主记忆片段，引用了[[子记忆片段1]]和[[子记忆片段2]]');
    
    // 检查占位文件是否被创建
    const content1 = await manager.getContent('子记忆片段1');
    const content2 = await manager.getContent('子记忆片段2');
    console.log('✅ 占位文件已创建');
    console.log('  子记忆片段1内容:', content1.substring(0, 50) + '...');
    console.log('  子记忆片段2内容:', content2.substring(0, 50) + '...');

    // 测试2: 权重计算（新算法）
    console.log('\n2. 测试权重计算');
    await manager.setContent('A', '内容A，引用[[B]]和[[C]]');
    await manager.setContent('B', '内容B，引用[[D]]');
    await manager.setContent('C', '内容C，无引用');
    await manager.setContent('D', '内容D，无引用');

    const hints = await manager.getHints(10);
    console.log('✅ 权重计算完成');
    console.log('  权重排序:', hints.weights.map(w => `${w.cardName}: ${w.weight}`));

    // 测试3: 新的价值计算公式
    console.log('\n3. 测试优化建议（新价值公式）');
    const suggestions = await manager.getSuggestions(1, 5);
    console.log('✅ 优化建议生成完成');
    console.log('  低价值记忆片段:', suggestions.values.slice(0, 3).map(v => 
      `${v.cardName}: 价值=${v.value.toFixed(4)}, 权重=${v.weight}, 字符数=${v.characterCount}`
    ));

    // 测试4: 权重缓存性能
    console.log('\n4. 测试权重缓存性能');
    const start = Date.now();
    await manager.getHints(10); // 第一次计算
    const firstTime = Date.now() - start;
    
    const start2 = Date.now();
    await manager.getHints(10); // 第二次应该使用缓存
    const secondTime = Date.now() - start2;
    
    console.log(`✅ 权重缓存性能测试完成`);
    console.log(`  首次计算: ${firstTime}ms`);
    console.log(`  缓存计算: ${secondTime}ms`);
    console.log(`  性能提升: ${((firstTime - secondTime) / firstTime * 100).toFixed(1)}%`);

    console.log('\n🎉 所有优化功能测试通过！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    // 清理测试目录
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  }
}

// 运行测试
testOptimizations().catch(console.error);
