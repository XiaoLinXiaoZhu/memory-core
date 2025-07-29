#!/usr/bin/env node
import { ZettelkastenManager } from '../dist/index.js';
import * as path from 'path';
import fs from 'fs-extra';

async function testNestedExpansion() {
  const testDir = path.join(process.cwd(), 'test-nested-expansion');
  
  // 清理测试目录
  if (await fs.pathExists(testDir)) {
    await fs.remove(testDir);
  }

  const manager = new ZettelkastenManager({
    storageDir: testDir,
    autoCreateDir: true
  });

  try {
    console.log('🧪 测试嵌套展开和 start/end 标记...\n');

    // 创建基础记忆片段
    await manager.setContent('基础记忆片段', '这是基础内容');
    
    // 创建包含展开引用的中间记忆片段
    await manager.setContent('中间记忆片段', '中间内容开始\n![[基础记忆片段]]\n中间内容结束');
    
    // 创建顶层记忆片段，引用中间记忆片段
    await manager.setContent('顶层记忆片段', '顶层开始\n![[中间记忆片段]]\n顶层结束');

    console.log('📝 测试深度为1的展开:');
    const depth1 = await manager.getContent('顶层记忆片段', 1);
    console.log('结果:');
    console.log(depth1);
    console.log('\n' + '='.repeat(50));

    console.log('📝 测试深度为2的展开:');
    const depth2 = await manager.getContent('顶层记忆片段', 2);
    console.log('结果:');
    console.log(depth2);
    console.log('\n' + '='.repeat(50));

    // 验证 start/end 标记不会被错误展开
    console.log('🔍 验证结果:');
    
    // 检查是否包含正确的 start/end 标记
    const hasCorrectStartEnd = depth2.includes('![[中间记忆片段]]start') && 
                               depth2.includes('![[中间记忆片段]]end') &&
                               depth2.includes('![[基础记忆片段]]start') && 
                               depth2.includes('![[基础记忆片段]]end');
    
    // 检查是否错误地展开了 start/end 标记
    const hasIncorrectExpansion = depth2.includes('![[中间记忆片段]]startstart') || 
                                  depth2.includes('![[基础记忆片段]]startstart');

    console.log('✅ 包含正确的 start/end 标记:', hasCorrectStartEnd);
    console.log('✅ 没有错误展开 start/end 标记:', !hasIncorrectExpansion);
    
    if (hasCorrectStartEnd && !hasIncorrectExpansion) {
      console.log('\n🎉 嵌套展开测试通过！start/end 标记正确处理');
    } else {
      console.log('\n❌ 嵌套展开测试失败！');
    }

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
testNestedExpansion().catch(console.error);
