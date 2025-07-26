import { ZettelkastenManager } from '../dist/index.js';
import * as path from 'path';
import fs from 'fs-extra';

async function demonstrateImprovements() {
  const testDir = path.join(process.cwd(), 'test-demo');
  
  // 清理测试目录
  if (await fs.pathExists(testDir)) {
    await fs.remove(testDir);
  }

  const manager = new ZettelkastenManager({
    storageDir: testDir,
    autoCreateDir: true
  });

  try {
    console.log('🚀 ZettelkastenManager 优化演示\n');
    console.log('=' .repeat(50));

    // 演示1: 自动创建占位记忆片段
    console.log('\n📝 功能1: 自动创建占位记忆片段');
    console.log('-'.repeat(30));
    
    await manager.setContent('学习计划', `
# 我的学习计划

## 编程语言
- [[JavaScript基础]]
- [[TypeScript进阶]]
- [[Python数据分析]]

## 框架学习
- [[React核心概念]]
- [[Node.js后端开发]]

## 项目实践
- [[个人博客系统]]
    `);

    const cardNames = await manager.getAllCardNames();
    console.log('✅ 创建学习计划后，自动生成的记忆片段:');
    cardNames.forEach(name => console.log(`  - ${name}`));

    // 演示2: 新的权重算法
    console.log('\n⚖️  功能2: 优化的权重计算算法');
    console.log('-'.repeat(30));
    
    // 构建一个知识网络
    await manager.setContent('JavaScript基础', '[[变量声明]] [[函数定义]] [[对象操作]]');
    await manager.setContent('变量声明', '[[let关键字]] [[const关键字]]');
    await manager.setContent('函数定义', '[[箭头函数]] [[普通函数]]');
    await manager.setContent('对象操作', '基础对象操作方法');
    
    await manager.setContent('TypeScript进阶', '[[类型系统]] [[泛型编程]]');
    await manager.setContent('类型系统', '[[基础类型]] [[高级类型]]');

    const hints = await manager.getHints(10);
    console.log('✅ 权重排序结果（权重 = 子记忆片段权重之和）:');
    hints.weights.forEach(w => {
      if (w.weight > 0) {
        console.log(`  ${w.cardName}: ${w.weight}`);
      }
    });

    // 演示3: 新的价值计算公式
    console.log('\n💡 功能3: 优化的价值计算公式');
    console.log('-'.repeat(30));
    console.log('公式: f(x) = ((100) / (1 + e^(-0.07x + 1))) / 字符数');
    
    // 创建不同长度和权重的记忆片段进行对比
    await manager.setContent('短记忆片段高权重', '[[子记忆片段A]] [[子记忆片段B]] [[子记忆片段C]]'); // 短内容，高权重
    await manager.setContent('长记忆片段低权重', '这是一个很长的内容'.repeat(50)); // 长内容，低权重
    await manager.setContent('中等记忆片段', '中等长度内容 [[子记忆片段D]]'.repeat(10)); // 中等内容

    const suggestions = await manager.getSuggestions(10, 10);
    console.log('✅ 价值分析结果:');
    suggestions.values.slice(0, 5).forEach(v => {
      const sigmoidPart = (100 / (1 + Math.exp(-0.07 * v.weight + 1))).toFixed(2);
      console.log(`  ${v.cardName}:`);
      console.log(`    权重: ${v.weight}, 字符数: ${v.characterCount}`);
      console.log(`    Sigmoid值: ${sigmoidPart}, 最终价值: ${v.value.toFixed(4)}`);
    });

    // 演示4: 权重缓存性能
    console.log('\n⚡ 功能4: 权重缓存性能优化');
    console.log('-'.repeat(30));
    
    // 清除缓存，测试首次计算
    manager.clearCache();
    const start1 = performance.now();
    await manager.getHints(10);
    const time1 = performance.now() - start1;
    
    // 测试缓存命中
    const start2 = performance.now();
    await manager.getHints(10);
    const time2 = performance.now() - start2;
    
    console.log(`✅ 性能对比:`);
    console.log(`  首次计算（冷缓存）: ${time1.toFixed(2)}ms`);
    console.log(`  缓存命中（热缓存）: ${time2.toFixed(2)}ms`);
    console.log(`  性能提升: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);

    // 演示缓存失效机制
    console.log('\n🔄 缓存失效演示:');
    await manager.setContent('测试缓存失效', '新内容会触发缓存失效');
    
    const start3 = performance.now();
    await manager.getHints(10);
    const time3 = performance.now() - start3;
    console.log(`  缓存失效后重新计算: ${time3.toFixed(2)}ms`);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 所有优化功能演示完成！');
    console.log('\n优化总结:');
    console.log('1. ✅ setContent 自动创建引用的占位记忆片段');
    console.log('2. ✅ 权重缓存机制，显著提升性能');
    console.log('3. ✅ 新权重算法：子记忆片段权重之和');
    console.log('4. ✅ 新价值公式：Sigmoid函数 / 字符数');

  } catch (error) {
    console.error('❌ 演示失败:', error);
  } finally {
    // 清理测试目录
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  }
}

// 运行演示
demonstrateImprovements();
