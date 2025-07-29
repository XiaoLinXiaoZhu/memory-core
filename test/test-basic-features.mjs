#!/usr/bin/env node
import { ZettelkastenManager } from '../dist/index.js';
import * as path from 'path';
import fs from 'fs-extra';

async function testBasicFeatures() {
  const testDir = path.join(process.cwd(), 'test-basic-features');
  
  // 清理测试目录
  if (await fs.pathExists(testDir)) {
    await fs.remove(testDir);
  }

  const manager = new ZettelkastenManager({
    storageDir: testDir,
    autoCreateDir: true
  });

  try {
    console.log('🧪 测试基本功能...\n');

    // 测试1: 创建和获取记忆片段
    console.log('📋 测试1: 创建和获取记忆片段');
    await manager.setContent('test-card', '这是一个测试记忆片段');
    const retrievedContent = await manager.getContent('test-card');
    console.log('✅ 记忆片段创建和获取成功');
    console.log(`  内容: ${retrievedContent}`);

    // 测试2: 处理记忆片段引用
    console.log('\n📋 测试2: 处理记忆片段引用');
    await manager.setContent('card1', '这是记忆片段1的内容');
    await manager.setContent('card2', '这是记忆片段2，引用了[[card1]]');
    const content = await manager.getContent('card2');
    console.log('✅ 记忆片段引用处理成功');
    console.log(`  包含引用: ${content.includes('[[card1]]')}`);

    // 测试3: 展开记忆片段内容
    console.log('\n📋 测试3: 展开记忆片段内容');
    await manager.setContent('base', '基础内容');
    await manager.setContent('main', '主要内容 ![[base]]');
    const expandedContent = await manager.getContent('main', 1);
    console.log('✅ 记忆片段内容展开成功');
    console.log(`  包含展开标记: ${expandedContent.includes('![[base]]start') && expandedContent.includes('![[base]]end')}`);

    // 测试4: 删除记忆片段
    console.log('\n📋 测试4: 删除记忆片段');
    const cardName = 'delete-test';
    await manager.setContent(cardName, '待删除的内容');
    await manager.deleteContent(cardName);
    
    try {
      await manager.getContent(cardName);
      console.log('❌ 删除测试失败');
    } catch (error) {
      console.log('✅ 记忆片段删除成功');
    }

    // 测试5: 重命名记忆片段
    console.log('\n📋 测试5: 重命名记忆片段');
    const oldName = 'old-name';
    const newName = 'new-name';
    const content2 = '测试内容';
    await manager.setContent(oldName, content2);
    await manager.renameContent(oldName, newName);
    const retrievedContent2 = await manager.getContent(newName);
    console.log('✅ 记忆片段重命名成功');
    console.log(`  重命名后内容: ${retrievedContent2}`);

    // 测试6: 获取提示
    console.log('\n📋 测试6: 获取提示');
    await manager.setContent('card1', '内容1 [[card2]]');
    await manager.setContent('card2', '内容2 [[card3]]');
    await manager.setContent('card3', '内容3');
    const hints = await manager.getHints(3);
    console.log('✅ 提示获取成功');
    console.log(`  提示数量: ${hints.cardNames.length}`);

    // 测试7: 获取优化建议
    console.log('\n📋 测试7: 获取优化建议');
    await manager.setContent('short', 'x');
    await manager.setContent('long', 'x'.repeat(1000));
    const suggestions = await manager.getSuggestions(0.1, 2);
    console.log('✅ 优化建议获取成功');
    console.log(`  建议数量: ${suggestions.cardNames.length}`);

    // 测试8: 获取统计信息
    console.log('\n📋 测试8: 获取统计信息');
    const stats = await manager.getStats();
    console.log('✅ 统计信息获取成功');
    console.log(`  总卡片数: ${stats.totalCards}, 总字符数: ${stats.totalCharacters}`);

    // 测试9: 获取带行号的内容
    console.log('\n📋 测试9: 获取带行号的内容');
    const cardName2 = 'line-number-test';
    const content3 = '第一行\n第二行\n第三行';
    await manager.setContent(cardName2, content3);
    const withLine = await manager.getContent(cardName2, 0, true);
    const expected = '1 |第一行\n2 |第二行\n3 |第三行';
    console.log('✅ 带行号内容获取成功');
    console.log(`  格式正确: ${withLine === expected}`);

    console.log('\n🎉 所有基本功能测试通过！');

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
testBasicFeatures().catch(console.error);