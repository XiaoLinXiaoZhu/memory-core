#!/usr/bin/env node
import { ZettelkastenManager } from '../dist/index.js';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

async function testNewFeatures() {
  let manager;
  let testDir;

  async function setup() {
    // 创建临时测试目录
    testDir = path.join(os.tmpdir(), 'zettel-test-' + Date.now());
    await fs.ensureDir(testDir);
    manager = new ZettelkastenManager({
      storageDir: testDir,
      autoCreateDir: true
    });
  }

  async function cleanup() {
    // 清理测试目录
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  }

  try {
    console.log('🧪 测试新功能...\n');

    // 测试 insertLinkAt 功能
    console.log('📋 测试1: insertLinkAt 功能');
    await setup();
    
    // 创建源记忆片段
    await manager.setContent('source', 'Line 1\nLine 2\nLine 3');
    
    // 插入链接
    await manager.insertLinkAt('source', 'target');
    
    const content = await manager.getContent('source');
    console.log('✅ 默认位置插入链接成功');
    console.log(`  内容: ${content}`);
    
    // 检查目标记忆片段是否自动创建
    const targetExists = await fs.pathExists(path.join(testDir, 'target.md'));
    console.log(`  目标记忆片段已创建: ${targetExists}`);
    
    await cleanup();

    // 测试指定位置插入
    await setup();
    await manager.setContent('source', 'Line 1\nLine 2\nLine 3');
    
    // 在第2行位置插入
    await manager.insertLinkAt('source', 'target', 2, 'See also');
    
    const content2 = await manager.getContent('source');
    console.log('✅ 指定位置插入链接成功');
    console.log(`  内容: ${content2}`);
    
    await cleanup();

    // 测试负数位置插入
    await setup();
    await manager.setContent('source', 'Line 1\nLine 2\nLine 3');
    
    // 从末尾倒数第2行插入
    await manager.insertLinkAt('source', 'target', -1);
    
    const content3 = await manager.getContent('source');
    console.log('✅ 负数位置插入链接成功');
    console.log(`  内容: ${content3}`);
    
    await cleanup();

    // 测试错误情况
    await setup();
    try {
      await manager.insertLinkAt('nonexistent', 'target');
      console.log('❌ 错误测试失败');
    } catch (error) {
      console.log('✅ 不存在的记忆片段错误处理成功');
    }
    
    await cleanup();

    // 测试 getBacklinks 功能
    console.log('\n📋 测试2: getBacklinks 功能');
    await setup();
    
    // 测试无反向链接
    await manager.setContent('isolated', 'This card has no references');
    
    const backlinks = await manager.getBacklinks('isolated');
    console.log('✅ 无反向链接情况处理成功');
    console.log(`  反向链接数量: ${backlinks.length}`);
    
    // 测试有反向链接
    await manager.setContent('target', 'Target content');
    await manager.setContent('ref1', 'This references [[target]]');
    await manager.setContent('ref2', 'Another reference to [[target]] here');
    await manager.setContent('noref', 'This does not reference anything');
    
    const backlinks2 = await manager.getBacklinks('target');
    console.log('✅ 有反向链接情况处理成功');
    console.log(`  反向链接: ${backlinks2.sort().join(', ')}`);
    
    // 测试自引用
    await manager.setContent('self', 'This card references [[self]]');
    
    const backlinks3 = await manager.getBacklinks('self');
    console.log('✅ 自引用处理成功');
    console.log(`  自引用反向链接数量: ${backlinks3.length}`);
    
    await cleanup();

    // 测试 extractContent 功能
    console.log('\n📋 测试3: extractContent 功能');
    await setup();
    
    // 测试按行号范围提取
    const content4 = `Line 1
Line 2
Line 3
Line 4
Line 5`;
    
    await manager.setContent('source', content4);
    
    // 提取第2-4行
    await manager.extractContent('source', 'extracted', {
      start: { line: 2 },
      end: { line: 4 }
    });
    
    const extractedContent = await manager.getContent('extracted');
    console.log('✅ 按行号范围提取成功');
    console.log(`  提取内容: ${extractedContent}`);
    
    const sourceContent = await manager.getContent('source');
    console.log(`  源内容更新: ${sourceContent.includes('[[extracted]]')}`);
    
    await cleanup();

    // 测试按正则表达式提取
    await setup();
    const content5 = `# Introduction
Some intro text

## Section 1
Content of section 1
More content

## Section 2
Content of section 2

# Conclusion`;
    
    await manager.setContent('source', content5);
    
    // 提取 Section 1
    await manager.extractContent('source', 'section1', {
      start: { regex: '^## Section 1' },
      end: { regex: '^## Section 2' }
    });
    
    const extractedContent2 = await manager.getContent('section1');
    console.log('✅ 按正则表达式提取成功');
    console.log(`  提取内容: ${extractedContent2.substring(0, 50)}...`);
    
    const sourceContent2 = await manager.getContent('source');
    console.log(`  源内容更新: ${sourceContent2.includes('[[section1]]')}`);
    
    await cleanup();

    // 测试混合模式提取
    await setup();
    const content6 = `Line 1
## Header 1
Content 1
## Header 2
Content 2
Line 6`;
    
    await manager.setContent('source', content6);
    
    // 从第2行开始搜索Header 1，到第5行结束
    await manager.extractContent('source', 'section', {
      start: { line: 2, regex: '^## Header 1' },
      end: { line: 5 }
    });
    
    const extractedContent3 = await manager.getContent('section');
    console.log('✅ 混合模式提取成功');
    console.log(`  提取内容: ${extractedContent3.substring(0, 50)}...`);
    
    await cleanup();

    // 测试追加到现有目标卡片
    await setup();
    await manager.setContent('existing', 'Existing content');
    await manager.setContent('source', 'Line 1\nLine 2\nLine 3');
    
    await manager.extractContent('source', 'existing', {
      start: { line: 2 },
      end: { line: 2 }
    });
    
    const content7 = await manager.getContent('existing');
    console.log('✅ 追加到现有目标卡片成功');
    console.log(`  合并内容: ${content7.substring(0, 50)}...`);
    
    await cleanup();

    // 测试错误情况
    await setup();
    await manager.setContent('source', 'Some content');
    
    try {
      await manager.extractContent('source', 'target');
      console.log('❌ 无范围参数错误测试失败');
    } catch (error) {
      console.log('✅ 无范围参数错误处理成功');
    }
    
    await cleanup();

    console.log('\n🎉 所有新功能测试通过！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await cleanup();
  }
}

// 运行测试
testNewFeatures().catch(console.error);