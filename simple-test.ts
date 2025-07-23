import { ZettelkastenManager } from './src/index.js';
import * as path from 'path';
import fs from 'fs-extra';

async function runTests() {
  console.log('🧪 运行 Zettelkasten Manager 测试...\n');
  
  let passedTests = 0;
  let totalTests = 0;

  function test(name: string, testFn: () => Promise<void>) {
    return async () => {
      totalTests++;
      try {
        await testFn();
        console.log(`✅ ${name}`);
        passedTests++;
      } catch (error) {
        console.log(`❌ ${name}: ${error}`);
      }
    };
  }

  const testDir = path.join(process.cwd(), 'test-temp');
  let manager: ZettelkastenManager;

  // 清理函数
  async function cleanup() {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  }

  // 设置
  await cleanup();
  manager = new ZettelkastenManager({
    storageDir: testDir,
    autoCreateDir: true
  });

  // 测试1: 创建和获取卡片
  await test('应该能够创建和获取卡片内容', async () => {
    const cardName = 'test-card';
    const content = '这是一个测试卡片';

    await manager.setContent(cardName, content);
    const retrievedContent = await manager.getContent(cardName);

    if (retrievedContent !== content) {
      throw new Error(`内容不匹配: 期望 "${content}", 得到 "${retrievedContent}"`);
    }
  })();

  // 测试2: 处理卡片引用
  await test('应该能够处理卡片引用', async () => {
    await manager.setContent('card1', '这是卡片1的内容');
    await manager.setContent('card2', '这是卡片2，引用了[[card1]]');

    const content = await manager.getContent('card2');
    if (!content.includes('[[card1]]')) {
      throw new Error('内容应该包含引用');
    }
  })();

  // 测试3: 展开卡片内容
  await test('应该能够展开卡片内容', async () => {
    await manager.setContent('base', '基础内容');
    await manager.setContent('main', '主要内容 ![[base]]');

    const expandedContent = await manager.getContent('main', 1);
    if (!expandedContent.includes('![[base]]start') || 
        !expandedContent.includes('基础内容') || 
        !expandedContent.includes('![[base]]end')) {
      throw new Error('内容展开失败');
    }
  })();

  // 测试4: 删除卡片
  await test('应该能够删除卡片', async () => {
    const cardName = 'delete-test';
    await manager.setContent(cardName, '待删除的内容');
    
    await manager.deleteContent(cardName);
    
    try {
      await manager.getContent(cardName);
      throw new Error('卡片应该已被删除');
    } catch (error: any) {
      if (!error.message.includes('Card not found')) {
        throw error;
      }
    }
  })();

  // 测试5: 重命名卡片
  await test('应该能够重命名卡片', async () => {
    const oldName = 'old-name';
    const newName = 'new-name';
    const content = '测试内容';

    await manager.setContent(oldName, content);
    await manager.renameContent(oldName, newName);

    const retrievedContent = await manager.getContent(newName);
    if (retrievedContent !== content) {
      throw new Error('重命名后内容不匹配');
    }

    try {
      await manager.getContent(oldName);
      throw new Error('旧名称的卡片应该不存在');
    } catch (error: any) {
      if (!error.message.includes('Card not found')) {
        throw error;
      }
    }
  })();

  // 测试6: 获取提示
  await test('应该能够获取提示', async () => {
    await manager.setContent('card1', '内容1 [[card2]]');
    await manager.setContent('card2', '内容2 [[card3]]');
    await manager.setContent('card3', '内容3');

    const hints = await manager.getHints(3);
    if (hints.cardNames.length === 0 || hints.weights.length === 0) {
      throw new Error('提示结果为空');
    }
  })();

  // 测试7: 获取优化建议
  await test('应该能够获取优化建议', async () => {
    await manager.setContent('short', 'x');
    await manager.setContent('long', 'x'.repeat(1000));

    const suggestions = await manager.getSuggestions(0.1, 2);
    if (suggestions.cardNames.length < 0) {
      throw new Error('优化建议结果异常');
    }
  })();

  // 测试8: 获取统计信息
  await test('应该能够获取统计信息', async () => {
    const stats = await manager.getStats();
    if (typeof stats.totalCards !== 'number' || 
        typeof stats.totalCharacters !== 'number' ||
        typeof stats.averageCardSize !== 'number') {
      throw new Error('统计信息格式错误');
    }
  })();

  // 清理
  await cleanup();

  console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！');
    process.exit(0);
  } else {
    console.log('❌ 部分测试失败');
    process.exit(1);
  }
}

runTests().catch(console.error);
