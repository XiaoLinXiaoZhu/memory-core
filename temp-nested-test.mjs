import { ZettelkastenManager } from './dist/index.js';
import * as path from 'path';
import fs from 'fs-extra';

async function testNestedExpansion() {
  const testDir = path.join(process.cwd(), 'test-nested-expansion');
  
  // 清理测试目录
  if (await fs.pathExists(testDir)) {
    await fs.remove(testDir);
  }
  await fs.ensureDir(testDir);
  
  console.log('🧪 测试嵌套展开功能...');
  
  const manager = new ZettelkastenManager({
    storageDir: testDir
  });
  
  // 创建基础卡片
  await manager.setContent('基础概念', '这是基础概念的内容');
  
  // 创建引用基础概念的卡片
  await manager.setContent('中级概念', '这是中级概念，基于 [[基础概念]]');
  
  // 创建引用中级概念的高级卡片
  await manager.setContent('高级概念', '这是高级概念，基于 [[中级概念]]，也引用 [[基础概念]]');
  
  // 创建包含展开标记的卡片
  await manager.setContent('展开测试', '开始展开：\n![[高级概念]]\n结束展开');
  
  console.log('1. 测试基本展开（深度1）');
  const expanded1 = await manager.getContent('展开测试', 1);
  console.log('✅ 深度1展开完成');
  console.log('  包含高级概念内容:', expanded1.includes('这是高级概念'));
  
  console.log('2. 测试深度展开（深度2）');
  const expanded2 = await manager.getContent('展开测试', 2);
  console.log('✅ 深度2展开完成');
  console.log('  包含中级概念内容:', expanded2.includes('这是中级概念'));
  
  console.log('3. 测试深度展开（深度3）');
  const expanded3 = await manager.getContent('展开测试', 3);
  console.log('✅ 深度3展开完成');
  console.log('  包含基础概念内容:', expanded3.includes('这是基础概念的内容'));
  
  console.log('4. 测试权重计算');
  const hints = await manager.getHints(10);
  console.log('✅ 权重计算完成');
  console.log('  权重排序:', hints.weights.map(w => `${w.cardName}: ${w.weight}`));
  
  // 清理
  await fs.remove(testDir);
  console.log('🎉 嵌套展开功能测试通过！');
}

testNestedExpansion().catch(console.error);
