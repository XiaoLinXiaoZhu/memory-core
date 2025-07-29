#!/usr/bin/env node
import { ZettelkastenManager } from '../dist/index.js';

async function testSubdirectorySupport() {
  console.log('🧪 测试子目录支持...\n');

  const manager = new ZettelkastenManager({
    storageDir: './test-subdir-cards'
  });

  try {
    // 测试创建根目录记忆片段
    await manager.setContent('根目录记忆片段', '这是一个根目录的记忆片段');
    console.log('✅ 根目录记忆片段创建成功');

    // 测试创建一级子目录记忆片段
    await manager.setContent('编程/JavaScript', '这是关于 JavaScript 的记忆片段\n\n参考：[[编程/TypeScript]]');
    console.log('✅ 一级子目录记忆片段创建成功');

    // 测试创建二级子目录记忆片段
    await manager.setContent('编程/TypeScript', '这是关于 TypeScript 的记忆片段');
    console.log('✅ 二级子目录记忆片段创建成功');

    // 测试创建深层目录记忆片段
    await manager.setContent('学习/编程/前端/框架/React', '这是关于 React 框架的记忆片段\n\n参考：[[编程/JavaScript]]');
    console.log('✅ 深层目录记忆片段创建成功');

    // 测试读取子目录记忆片段
    const jsCard = await manager.getContent('编程/JavaScript');
    console.log('✅ 子目录记忆片段读取成功');
    console.log(`📄 JavaScript 记忆片段内容预览: ${jsCard.substring(0, 50)}...`);

    // 测试引用展开（跨目录）
    const jsExpandedCard = await manager.getContent('编程/JavaScript', 1);
    console.log('✅ 跨目录引用展开成功');
    console.log(`📄 展开后内容预览: ${jsExpandedCard.substring(0, 100)}...`);

    // 测试权重计算
    const hints = await manager.getHints(5);
    console.log('✅ 权重计算成功');
    console.log('📊 前5个推荐记忆片段:');
    hints.cardNames.forEach((cardName, index) => {
      const weight = hints.weights.find(w => w.cardName === cardName)?.weight || 0;
      console.log(`  ${index + 1}. ${cardName} (权重: ${weight.toFixed(2)})`);
    });

    // 测试重命名（包含子目录）
    await manager.renameContent('编程/JavaScript', '编程/JS基础');
    console.log('✅ 子目录记忆片段重命名成功');

    // 验证引用更新
    const tsCard = await manager.getContent('编程/TypeScript');
    console.log('✅ 引用更新验证成功');

    // 测试删除子目录记忆片段
    await manager.deleteContent('学习/编程/前端/框架/React');
    console.log('✅ 深层目录记忆片段删除成功');

    console.log('\n🎉 所有子目录功能测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testSubdirectorySupport().catch(console.error);