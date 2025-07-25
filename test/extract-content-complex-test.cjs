const { ZettelkastenManager } = require('../dist/core/ZettelkastenManager.js');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/**
 * 复杂格式内容提取测试
 * 测试ExtractContent功能在处理复杂格式内容时的表现
 */

async function runComplexFormatTests() {
  // 创建临时测试目录
  const testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'extract-complex-test-'));
  const manager = new ZettelkastenManager({
    storageDir: testDir,
    autoCreateDir: true
  });

  console.log('🧪 开始复杂格式内容提取测试...\n');

  try {
    // 测试1: 复杂Markdown格式提取
    console.log('📋 测试1: 复杂Markdown格式提取');
    const complexMarkdown = `# 深度学习框架比较

## TensorFlow
**优点：**
- 强大的生态系统
- 支持分布式训练
- 丰富的预训练模型

**缺点：**
- 学习曲线陡峭
- API相对复杂

## PyTorch
**优点：**
- 动态图机制
- Pythonic的API设计
- 研究社区活跃

**缺点：**
- 生产部署相对复杂
- 移动端支持有限

## 总结
选择框架时需要考虑项目需求、团队技能栈和部署环境。

### 性能对比
| 框架 | 训练速度 | 推理速度 | 内存占用 |
|------|----------|----------|----------|
| TensorFlow | 快 | 快 | 中等 |
| PyTorch | 中等 | 中等 | 低 |

### 代码示例
\`\`\`python
import tensorflow as tf
model = tf.keras.Sequential([
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dense(10, activation='softmax')
])
\`\`\``;

    await manager.setContent('framework-comparison', complexMarkdown);
    
    // 提取PyTorch部分
    await manager.extractContent('framework-comparison', 'pytorch-details', {
      start: { regex: '^## PyTorch' },
      end: { regex: '^## 总结' }
    });
    
    const pytorchContent = await manager.getContent('pytorch-details');
    console.log('✅ PyTorch部分提取成功');
    console.log('提取内容预览:', pytorchContent.substring(0, 100) + '...\n');

    // 测试2: 代码块和表格提取
    console.log('📋 测试2: 代码块和表格提取');
    await manager.extractContent('framework-comparison', 'performance-table', {
      start: { regex: '^### 性能对比' },
      end: { regex: '^### 代码示例' }
    });
    
    const tableContent = await manager.getContent('performance-table');
    console.log('✅ 性能表格提取成功');
    console.log('表格内容:', tableContent);

    // 测试3: 嵌套列表和引用提取
    console.log('📋 测试3: 嵌套列表和引用提取');
    const nestedContent = `# 前端技术栈
## React生态
- **核心库**
  - React
  - React DOM
- **状态管理**
  - Redux
    - 适合大型应用
    - 学习成本高
  - Zustand
    - 轻量级
    - 简单易用
- **路由**
  - React Router

## Vue生态
- **核心库**
  - Vue 3
  - Composition API
- **状态管理**
  - Pinia
  - Vuex (legacy)

> 引用：选择技术栈时需要考虑团队熟悉度和项目规模

## 构建工具
- Vite
- Webpack
- Parcel`;

    await manager.setContent('frontend-tech', nestedContent);
    
    // 提取React生态部分
    await manager.extractContent('frontend-tech', 'react-ecosystem', {
      start: { regex: '^## React生态' },
      end: { regex: '^## Vue生态' }
    });
    
    const reactContent = await manager.getContent('react-ecosystem');
    console.log('✅ React生态部分提取成功');
    console.log('包含嵌套列表:', reactContent.includes('Redux') && reactContent.includes('Zustand'));

    // 测试4: 多段落文本提取
    console.log('📋 测试4: 多段落文本提取');
    const multiParagraph = `# 微服务架构设计

## 服务拆分原则

### 按业务边界拆分
订单服务应该包含所有与订单相关的功能。这包括：
- 订单创建
- 订单状态管理
- 订单查询

用户服务则专注于用户相关的功能：
- 用户注册
- 用户认证
- 用户信息管理

### 按技术能力拆分
将需要高性能的服务独立出来，比如：
搜索服务需要专门的搜索引擎支持。
推荐服务需要机器学习模型支持。

### 数据一致性考虑
在微服务架构中，数据一致性是一个挑战。

**最终一致性**是常见的选择。
通过事件驱动的方式保证数据最终一致。

### 通信方式
服务间通信主要有两种方式：

**同步通信**
- REST API
- gRPC
适合实时性要求高的场景

**异步通信**
- 消息队列
- 事件总线
适合解耦服务依赖`;

    await manager.setContent('microservices-design', multiParagraph);
    
    // 提取服务拆分原则部分
    await manager.extractContent('microservices-design', 'splitting-principles', {
      start: { regex: '^## 服务拆分原则' },
      end: { regex: '^### 通信方式' }
    });
    
    const splittingContent = await manager.getContent('splitting-principles');
    console.log('✅ 服务拆分原则提取成功');
    console.log('段落数量:', splittingContent.split('\n\n').length);

    // 测试5: 正则表达式边界测试
    console.log('📋 测试5: 正则表达式边界测试');
    const boundaryTest = `Line 1: Introduction
Line 2: ## Section Start
Line 3: Content here
Line 4: More content
Line 5: ## Section End
Line 6: Footer content`;

    await manager.setContent('boundary-test', boundaryTest);
    
    // 测试精确边界匹配
    await manager.extractContent('boundary-test', 'middle-content', {
      start: { regex: '^Line 2: ## Section Start' },
      end: { regex: '^Line 5: ## Section End' }
    });
    
    const middleContent = await manager.getContent('middle-content');
    console.log('✅ 边界测试成功');
    console.log('提取内容:', middleContent);

    // 测试6: 特殊字符和格式测试
    console.log('📋 测试6: 特殊字符和格式测试');
    const specialChars = `# 正则表达式指南

## 基础语法
\`\`\`regex
^[a-zA-Z0-9]+@[a-zA-Z0-9]+\\.[a-zA-Z]{2,}$
\`\`\`

## 常用模式
- **邮箱验证**: \`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$\`
- **URL验证**: \`^https?:\\/\\/.+\\..+$\`
- **手机号验证**: \`^1[3-9]\\d{9}$\`

## 转义字符
需要转义的特殊字符包括：
- \`.\` (点)
- \`*\` (星号)
- \`+\` (加号)
- \`?\` (问号)
- \`^\` (脱字符)
- \`$\` (美元符)
- \`[\` (左方括号)
- \`]\` (右方括号)
- \`{\` (左花括号)
- \`}\` (右花括号)
- \`(\` (左圆括号)
- \`)\` (右圆括号)
- \`\\\` (反斜杠)

### 示例代码
\`\`\`javascript
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
const isValid = emailRegex.test('user@example.com');
console.log(isValid); // true
\`\`\``;

    await manager.setContent('regex-guide', specialChars);
    
    // 提取转义字符部分
    await manager.extractContent('regex-guide', 'escape-chars', {
      start: { regex: '^## 转义字符' },
      end: { regex: '^### 示例代码' }
    });
    
    const escapeContent = await manager.getContent('escape-chars');
    console.log('✅ 特殊字符提取成功');

    // 验证所有提取的内容
    console.log('\n📊 测试结果汇总:');
    const allCards = await manager.getAllCardNames();
    console.log(`总共创建了 ${allCards.length} 个卡片`);
    
    for (const cardName of allCards) {
      const content = await manager.getContent(cardName);
      console.log(`- ${cardName}: ${content.length} 字符`);
    }

    // 验证反向链接
    console.log('\n🔗 验证知识链接:');
    for (const cardName of ['framework-comparison', 'frontend-tech', 'microservices-design', 'boundary-test', 'regex-guide']) {
      const backlinks = await manager.getBacklinks(cardName);
      console.log(`${cardName} 的反向链接:`, backlinks);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    // 清理测试目录
    await fs.remove(testDir);
    console.log('\n🧹 测试环境已清理');
  }
}

// 运行测试
runComplexFormatTests().catch(console.error);