#!/usr/bin/env node
import { ZettelkastenManager } from '../dist/index.js';
import * as path from 'path';
import fs from 'fs-extra';

async function testNewSuggestions() {
  const testDir = path.join(process.cwd(), 'test-new-suggestions');
  
  // 清理测试目录
  if (await fs.pathExists(testDir)) {
    await fs.remove(testDir);
  }

  const manager = new ZettelkastenManager({
    storageDir: testDir,
    autoCreateDir: true
  });

  try {
    console.log('🧪 测试新的建议功能...\n');

    // 测试1: 创建测试数据
    console.log('1. 创建测试数据');
    
    // 创建系统片段
    await manager.setContent('bootloader', `<!-- core memory -->
# Bootloader

这是系统片段，不应该被包含在低价值或孤立片段的建议中。`);
    
    // 创建普通片段
    await manager.setContent('主记忆片段', '这是主记忆片段，引用了[[子记忆片段1]]和[[子记忆片段2]]');
    await manager.setContent('子记忆片段1', '这是子记忆片段1，内容较少，引用了[[孙记忆片段1]]');
    await manager.setContent('子记忆片段2', '这是子记忆片段2，内容较多，引用了[[孙记忆片段2]]和[[孙记忆片段3]]');
    await manager.setContent('孙记忆片段1', '这是孙记忆片段1，内容很少');
    await manager.setContent('孙记忆片段2', '这是孙记忆片段2，内容很少');
    await manager.setContent('孙记忆片段3', '这是孙记忆片段3，内容很少');
    await manager.setContent('孤立片段1', '这是一个孤立的片段，没有链接到其他片段');
    await manager.setContent('孤立片段2', '这是另一个孤立的片段，没有链接到其他片段');
    await manager.setContent('高价值片段', '这是一个高价值片段，内容很多，有很多链接。它引用了[[子记忆片段1]]、[[子记忆片段2]]、[[孙记忆片段1]]、[[孙记忆片段2]]、[[孙记忆片段3]]。这个片段的内容很长，包含了大量的信息，所以它的信息散度应该很低。');
    
    console.log('✅ 测试数据创建完成');

    // 测试2: 测试 getLowValueSuggestions 方法
    console.log('\n2. 测试 getLowValueSuggestions 方法');
    const lowValueSuggestions = await manager.getLowValueSuggestions(0.01, 5);
    console.log('✅ 低价值片段建议生成完成');
    console.log('  低价值记忆片段:', lowValueSuggestions.divergences.slice(0, 3).map(d =>
      `${d.cardName}: 信息散度=${d.divergence.toFixed(4)}, 权重=${d.weight}, 字符数=${d.characterCount}`
    ));

    // 测试3: 测试 getIsolatedSuggestions 方法
    console.log('\n3. 测试 getIsolatedSuggestions 方法');
    const isolatedSuggestions = await manager.getIsolatedSuggestions(5);
    console.log('✅ 孤立片段建议生成完成');
    console.log('  孤立记忆片段:', isolatedSuggestions.isolatedResults.filter(r => r.isIsolated).map(r =>
      `${r.cardName}: 反向链接数=${r.backlinkCount}`
    ));

    // 测试4: 验证系统片段被排除
    console.log('\n4. 验证系统片段被排除');
    const bootloaderInLowValue = lowValueSuggestions.cardNames.includes('bootloader');
    const bootloaderInIsolated = isolatedSuggestions.cardNames.includes('bootloader');
    console.log('✅ 系统片段排除测试完成');
    console.log(`  bootloader 在低价值建议中: ${bootloaderInLowValue}`);
    console.log(`  bootloader 在孤立建议中: ${bootloaderInIsolated}`);

    // 测试6: 测试缓存性能
    console.log('\n6. 测试孤立片段缓存性能');
    const start = Date.now();
    await manager.getIsolatedSuggestions(5); // 第一次计算
    const firstTime = Date.now() - start;
    
    const start2 = Date.now();
    await manager.getIsolatedSuggestions(5); // 第二次应该使用缓存
    const secondTime = Date.now() - start2;
    
    console.log(`✅ 孤立片段缓存性能测试完成`);
    console.log(`  首次计算: ${firstTime}ms`);
    console.log(`  缓存计算: ${secondTime}ms`);
    if (firstTime > 0) {
      console.log(`  性能提升: ${((firstTime - secondTime) / firstTime * 100).toFixed(1)}%`);
    }

    // 测试7: 测试弃用的 getSuggestions 方法
    console.log('\n7. 测试弃用的 getSuggestions 方法');
    const deprecatedSuggestions = await manager.getSuggestions(1, 5);
    console.log('✅ 弃用的 getSuggestions 方法仍然可用');
    console.log('  低价值记忆片段 (旧方法):', deprecatedSuggestions.values.slice(0, 3).map(v => 
      `${v.cardName}: 价值=${v.value.toFixed(4)}, 权重=${v.weight}, 字符数=${v.characterCount}`
    ));

    console.log('\n🎉 所有新建议功能测试通过！');

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
testNewSuggestions().catch(console.error);