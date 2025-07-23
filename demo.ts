import { ZettelkastenManager } from './src/index.js';
import * as path from 'path';

async function demo() {
  console.log('🎯 Zettelkasten Memory System v4.0 Demo');
  console.log('=====================================\n');

  // 创建管理器实例
  const storageDir = path.join(process.cwd(), 'demo-cards');
  const manager = new ZettelkastenManager({
    storageDir,
    autoCreateDir: true
  });

  try {
    console.log('📝 创建示例卡片...\n');

    // 创建一些示例卡片
    await manager.setContent('AI学习路径', `
# AI学习路径

人工智能是一个广阔的领域，需要系统性的学习。

## 基础知识
- [[数学基础]] - 线性代数、微积分、统计学
- [[编程基础]] - Python、数据结构与算法

## 核心技能
- [[机器学习]] - 监督学习、无监督学习
- [[深度学习]] - 神经网络、CNN、RNN
- [[自然语言处理]] - 文本处理、语言模型

## 实践项目
建议从简单项目开始，逐步增加复杂度。

相关资源：[[学习资源]]
`);

    await manager.setContent('数学基础', `
# 数学基础

AI学习必备的数学知识。

## 线性代数
- 矩阵运算
- 特征值和特征向量
- 主成分分析

## 微积分
- 偏导数
- 梯度下降
- 优化理论

## 统计学
- 概率论
- 贝叶斯理论
- 假设检验

这些数学概念在[[机器学习]]中有广泛应用。
`);

    await manager.setContent('机器学习', `
# 机器学习

机器学习是AI的核心组成部分。

## 监督学习
- 线性回归
- 逻辑回归
- 支持向量机
- 决策树
- 随机森林

## 无监督学习
- K-means聚类
- 层次聚类
- 主成分分析

## 评估指标
- 准确率、精确率、召回率
- F1分数
- ROC曲线

需要掌握的前置知识：[[数学基础]]
进阶学习：[[深度学习]]
`);

    await manager.setContent('深度学习', `
# 深度学习

基于神经网络的机器学习方法。

## 基础概念
- 神经网络结构
- 反向传播
- 激活函数

## 常见架构
- 卷积神经网络 (CNN)
- 循环神经网络 (RNN)
- Transformer架构

## 应用领域
- 计算机视觉
- [[自然语言处理]]
- 语音识别

前置要求：[[机器学习]]基础
`);

    await manager.setContent('自然语言处理', `
# 自然语言处理

处理和理解人类语言的AI技术。

## 基础任务
- 文本分类
- 情感分析
- 命名实体识别
- 机器翻译

## 核心技术
- 词向量 (Word2Vec, GloVe)
- 注意力机制
- BERT、GPT等预训练模型

## 应用场景
- 聊天机器人
- 文档摘要
- 问答系统

技术基础：[[深度学习]]
`);

    await manager.setContent('学习资源', `
# 学习资源

优质的AI学习资源推荐。

## 在线课程
- Stanford CS229 机器学习
- MIT 6.034 人工智能
- Coursera深度学习专项课程

## 书籍推荐
- 《统计学习方法》- 李航
- 《机器学习》- 周志华
- 《深度学习》- Ian Goodfellow

## 实践平台
- Kaggle竞赛
- GitHub开源项目
- Google Colab

这些资源有助于[[AI学习路径]]的实施。
`);

    await manager.setContent('编程基础', `
# 编程基础

AI开发必备的编程技能。

## Python编程
- 基础语法
- 面向对象编程
- 函数式编程

## 重要库
- NumPy - 数值计算
- Pandas - 数据处理
- Matplotlib/Seaborn - 数据可视化
- Scikit-learn - 机器学习
- TensorFlow/PyTorch - 深度学习

## 数据结构与算法
- 时间复杂度分析
- 常用算法实现

为[[AI学习路径]]提供技术基础。
`);

    // 创建子目录结构的卡片
    console.log('📁 创建子目录结构卡片...\n');
    
    await manager.setContent('技术栈/前端/React', `
# React 前端框架

现代化的前端开发框架。

## 核心概念
- 组件化开发
- 虚拟DOM
- 状态管理

## 生态系统
参考：[[技术栈/前端/工具链]]
`);

    await manager.setContent('技术栈/前端/工具链', `
# 前端工具链

现代前端开发的工具链。

## 构建工具
- Webpack
- Vite

## 开发工具
- TypeScript
- ESLint

配合 [[技术栈/前端/React]] 使用。
`);

    await manager.setContent('技术栈/后端/Python', `
# Python 后端开发

服务器端开发技术。

## 框架
- Django
- FastAPI
- Flask

与 [[编程基础]] 相关。
`);

    await manager.setContent('项目/AI聊天机器人', `
# AI聊天机器人项目

综合性的AI项目实践。

## 技术栈
- 前端：[[技术栈/前端/React]]
- 后端：[[技术栈/后端/Python]]
- AI：[[自然语言处理]]

## 学习路径
遵循 [[AI学习路径]] 的指导。
`);

    console.log('✅ 卡片创建完成！\n');

    // 测试子目录功能
    console.log('📁 测试子目录功能：');
    console.log('─'.repeat(50));
    
    // 读取子目录卡片
    const reactCard = await manager.getContent('技术栈/前端/React', 0);
    console.log('📄 子目录卡片内容 [技术栈/前端/React]:');
    console.log(reactCard.substring(0, 150) + '...\n');
    
    // 测试跨目录引用展开
    const projectCard = await manager.getContent('项目/AI聊天机器人', 1);
    console.log('📄 跨目录引用展开 [项目/AI聊天机器人]:');
    console.log(projectCard.substring(0, 300) + '...\n');

    // 测试获取内容
    console.log('📖 测试内容获取（无展开）：');
    const aiContent = await manager.getContent('AI学习路径', 0);
    console.log(aiContent.substring(0, 200) + '...\n');

    // 测试内容展开
    console.log('📖 测试内容展开（深度1）：');
    const expandedContent = await manager.getContent('AI学习路径', 1);
    console.log(expandedContent.substring(0, 300) + '...\n');

    // 测试权重计算和提示
    console.log('⚖️ 测试权重计算和提示：');
    const hints = await manager.getHints(5);
    console.log('按权重排序的前5个卡片：');
    hints.cardNames.forEach((name, index) => {
      const weight = hints.weights.find(w => w.cardName === name)?.weight.toFixed(3);
      console.log(`${index + 1}. ${name} (权重: ${weight})`);
    });
    console.log();

    // 测试优化建议
    console.log('🎯 测试优化建议：');
    const suggestions = await manager.getSuggestions(0.01, 3);
    console.log('价值较低的卡片（建议优化）：');
    suggestions.cardNames.forEach((name, index) => {
      const valueInfo = suggestions.values.find(v => v.cardName === name);
      console.log(`${index + 1}. ${name} (价值: ${valueInfo?.value.toFixed(5)}, 字符数: ${valueInfo?.characterCount})`);
    });
    console.log();

    // 测试重命名功能
    console.log('🔄 测试重命名功能：');
    await manager.setContent('临时卡片', '这是一个临时卡片，引用了[[AI学习路径]]');
    await manager.renameContent('临时卡片', '重命名后的卡片');
    const renamedContent = await manager.getContent('重命名后的卡片');
    console.log('重命名后的内容：', renamedContent.substring(0, 100));
    console.log();

    // 获取统计信息
    console.log('📊 系统统计信息：');
    const stats = await manager.getStats();
    console.log(`总卡片数: ${stats.totalCards}`);
    console.log(`总字符数: ${stats.totalCharacters}`);
    console.log(`平均卡片大小: ${Math.round(stats.averageCardSize)} 字符`);
    console.log(`最后更新: ${stats.lastUpdated?.toLocaleString()}`);
    console.log();

    // 清理测试数据
    console.log('🧹 清理测试数据...');
    const allCards = await manager.getAllCardNames();
    for (const cardName of allCards) {
      await manager.deleteContent(cardName);
    }

    console.log('✅ 演示完成！所有测试数据已清理。');

  } catch (error) {
    console.error('❌ 演示过程中出现错误：', error);
  }
}

// 运行演示
demo().catch(console.error);
