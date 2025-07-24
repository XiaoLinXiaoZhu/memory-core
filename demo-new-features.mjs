import { ZettelkastenManager } from './dist/index.js';
import path from 'path';
import fs from 'fs-extra';

async function demonstrateNewFeatures() {
  const testDir = path.join(process.cwd(), 'demo-test');
  
  // 清理并创建测试目录
  if (await fs.pathExists(testDir)) {
    await fs.remove(testDir);
  }
  
  const manager = new ZettelkastenManager({
    storageDir: testDir,
    autoCreateDir: true
  });

  console.log('🚀 演示 ZettelkastenManager 新功能\n');

  try {
    // 1. 创建一些示例卡片
    console.log('1. 创建示例卡片...');
    
    await manager.setContent('项目计划', `# 项目计划

## 目标
开发一个知识管理系统

## 时间安排
第一阶段：需求分析
第二阶段：系统设计  
第三阶段：开发实现

## 资源分配
- 开发团队：3人
- 测试团队：2人
- 预算：50万`);

    await manager.setContent('技术文档', `# 技术文档

## 架构设计
采用微服务架构

## 技术栈
- 前端：React + TypeScript
- 后端：Node.js + Express
- 数据库：PostgreSQL

## API 规范
RESTful API 设计
- GET /api/users
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id

## 部署方案
使用 Docker 容器化部署`);

    console.log('✅ 示例卡片创建完成\n');

    // 2. 演示 insertLinkAt 功能
    console.log('2. 演示 insertLinkAt 功能...');
    
    // 在项目计划末尾添加链接
    await manager.insertLinkAt('项目计划', '技术文档', 0, '参考详细');
    
    // 在项目计划的第3行插入链接  
    await manager.insertLinkAt('项目计划', '时间表', 3, '查看详细');
    
    console.log('✅ 链接插入完成');
    console.log('项目计划内容:');
    console.log(await manager.getContent('项目计划'));
    console.log('\n');

    // 3. 演示 getBacklinks 功能
    console.log('3. 演示 getBacklinks 功能...');
    
    const techDocBacklinks = await manager.getBacklinks('技术文档');
    const timeTableBacklinks = await manager.getBacklinks('时间表');
    
    console.log(`技术文档的反向链接: [${techDocBacklinks.join(', ')}]`);
    console.log(`时间表的反向链接: [${timeTableBacklinks.join(', ')}]`);
    console.log('');

    // 4. 演示 extractContent 功能 - 按行号提取
    console.log('4. 演示 extractContent 功能 - 按行号提取...');
    
    await manager.extractContent('技术文档', 'API规范详情', {
      start: { line: 10 },
      end: { line: 15 }
    });
    
    console.log('✅ 按行号提取完成');
    console.log('提取的API规范详情:');
    console.log(await manager.getContent('API规范详情'));
    console.log('');

    // 5. 演示 extractContent 功能 - 按正则表达式提取
    console.log('5. 演示 extractContent 功能 - 按正则表达式提取...');
    
    await manager.extractContent('技术文档', '技术栈说明', {
      start: { regex: '^## 技术栈' },
      end: { regex: '^## API 规范' }
    });
    
    console.log('✅ 按正则表达式提取完成');
    console.log('提取的技术栈说明:');
    console.log(await manager.getContent('技术栈说明'));
    console.log('');

    // 6. 查看更新后的技术文档
    console.log('6. 查看更新后的技术文档...');
    console.log('更新后的技术文档:');
    console.log(await manager.getContent('技术文档'));
    console.log('');

    // 7. 查看最终的反向链接情况
    console.log('7. 查看最终的反向链接情况...');
    
    const apiBacklinks = await manager.getBacklinks('API规范详情');
    const stackBacklinks = await manager.getBacklinks('技术栈说明');
    
    console.log(`API规范详情的反向链接: [${apiBacklinks.join(', ')}]`);
    console.log(`技术栈说明的反向链接: [${stackBacklinks.join(', ')}]`);
    console.log('');

    // 8. 显示卡片统计
    console.log('8. 卡片统计信息...');
    const stats = await manager.getStats();
    console.log('统计信息:', stats);

  } catch (error) {
    console.error('❌ 演示过程中出现错误:', error);
  } finally {
    // 清理测试目录
    console.log('\n🧹 清理测试目录...');
    await fs.remove(testDir);
    console.log('✅ 清理完成');
  }
}

// 运行演示
demonstrateNewFeatures().catch(console.error);
