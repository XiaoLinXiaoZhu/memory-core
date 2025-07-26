# Modular MCP Memory v4.1.1

基于 Zettelkasten 记忆片段盒笔记法的精简记忆系统，现已包含智能优化功能。

## 🐛 v4.1.1 修复

- 🔧 **嵌套展开修复**: 修复了深度展开时 start/end 标记被错误展开的问题
- ✅ **稳定性提升**: 确保多层级引用场景下的正确展开行为

## ✨ v4.1 新功能

- 🚀 **智能占位符**: setContent 时自动为引用记忆片段创建占位文件
- ⚡ **权重缓存**: 智能缓存权重计算结果，性能提升 60%+
- 📊 **优化算法**: 全新的权重计算和价值评估算法
- 🔄 **缓存失效**: 文件变更时自动清除相关缓存

## 特性

- 🗂️ **记忆片段化管理**: 每个记忆单元作为独立的记忆片段
- 🔗 **智能引用**: 通过 `[[记忆片段名]]` 方式建立记忆片段间的链接
- 📖 **内容展开**: 支持递归展开引用内容
- ⚖️ **权重计算**: 基于引用关系计算记忆片段权重（新算法）
- 🎯 **智能提示**: 根据权重提供相关记忆片段建议
- 🔧 **优化建议**: 使用 Sigmoid 函数识别低价值记忆片段
- 📁 **文件存储**: 使用文件系统存储，便于备份和迁移
- 🚀 **自动占位**: 引用不存在的记忆片段时自动创建占位符

## 核心方法

### 1. 获取文件内容
```typescript
await manager.getContent(文件名称, 展开深度);
```

### 2. 创建/编辑文件内容
```typescript
await manager.setContent(文件名称, 内容);
```

### 3. 删除文件内容
```typescript
await manager.deleteContent(文件名称);
```

### 4. 重命名/合并文件内容
```typescript
await manager.renameContent(旧文件名称, 新文件名称);
```

### 5. 获取提示
```typescript
await manager.getHints(文件数量);
```

### 6. 获取优化建议
```typescript
await manager.getSuggestions(优化参数, 最大文件数量);
```

## 🆕 v4.1 新功能详解

### 智能占位符创建
当您在记忆片段中引用不存在的记忆片段时，系统会自动创建占位文件：

```typescript
// 创建包含引用的记忆片段
await manager.setContent('学习计划', '今天要学习 [[JavaScript基础]] 和 [[React框架]]');

// 系统自动创建 JavaScript基础.md 和 React框架.md 占位文件
// 每个占位文件包含基础模板内容
```

### 权重缓存优化
- **智能缓存**: 权重计算结果被缓存，避免重复计算
- **自动失效**: 文件修改时相关缓存自动清除
- **性能提升**: 缓存命中时性能提升 60%+

### 新的权重算法
```
旧算法: 权重 = 引用数量
新算法: 权重 = 子记忆片段权重之和 + 引用数量
```

### 优化的价值计算
```
旧公式: 价值 = 权重 / 字符数
新公式: 价值 = Sigmoid(权重) / 字符数
```
使用 Sigmoid 函数使权重影响更加平滑和科学。

## 安装

```bash
npm install modular-mcp-memory
```

## 使用示例

```typescript
import { ZettelkastenManager } from 'modular-mcp-memory';

// 创建管理器实例
const manager = new ZettelkastenManager({
  storageDir: './my-cards',
  autoCreateDir: true
});

// 创建记忆片段
await manager.setContent('AI基础', `
# AI基础知识

人工智能的核心概念包括：
- [[机器学习]]
- [[深度学习]]
- [[自然语言处理]]
`);

// 获取记忆片段内容（展开引用）
const content = await manager.getContent('AI基础', 1);

// 获取智能提示
const hints = await manager.getHints(5);
console.log('推荐记忆片段:', hints.cardNames);
```

## 记忆片段引用语法

### 基本引用
使用 `[[记忆片段名]]` 引用其他记忆片段。

### 子目录支持
记忆片段名称支持使用 `/` 来创建子目录结构：

```typescript
// 创建子目录中的记忆片段
await manager.setContent('编程/JavaScript', 'JavaScript 相关内容');
await manager.setContent('编程/前端/React', 'React 框架内容');

// 引用子目录中的记忆片段
await manager.setContent('学习计划', `
我的学习计划：
- [[编程/JavaScript]]
- [[编程/前端/React]]
`);
```

支持的子目录功能：
- ✅ 任意深度的子目录：`category/subcategory/topic`
- ✅ 跨目录引用：根目录记忆片段可以引用子目录记忆片段
- ✅ 自动创建目录：保存记忆片段时自动创建必要的目录结构
- ✅ 重命名支持：重命名子目录记忆片段会自动更新所有引用

**注意事项：**
- 记忆片段名不能以 `/` 开头
- 不支持相对路径操作（如 `../` 或 `./`）
- 目录分隔符使用 `/`（会自动适配操作系统）

### 内容展开
使用 `![[记忆片段名]]` 来展开引用记忆片段的内容。展开后的格式：

```markdown
![[记忆片段名]]start

记忆片段的实际内容

![[记忆片段名]]end
```

## 权重计算算法

系统使用递归算法计算记忆片段权重：

```typescript
// 当记忆片段有向外引用时
权重 = (引用记忆片段1权重 + 引用记忆片段2权重 + ... + 引用记忆片段n权重) / n

// 当记忆片段没有向外引用时
权重 = 1
```

## 价值计算

记忆片段价值用于优化建议：

```
价值 = 权重 / 字符数
```

价值越低的记忆片段可能需要优化（扩展内容或删除）。

## 开发

```bash
# 安装依赖
npm install

# 运行演示
npm run demo

# 运行测试
npm test

# 构建
npm run build

# 检查类型
npm run lint
```

## API 文档

### ZettelkastenManager

#### 构造函数
```typescript
new ZettelkastenManager(config: ZettelkastenConfig)
```

#### 配置选项
```typescript
interface ZettelkastenConfig {
  storageDir: string;           // 存储目录路径
  encoding?: string;            // 文件编码，默认 'utf-8'
  autoCreateDir?: boolean;      // 是否自动创建目录，默认 true
}
```

#### 方法

- `getContent(cardName: string, expandDepth?: number): Promise<string>`
- `setContent(cardName: string, content: string): Promise<void>`
- `deleteContent(cardName: string): Promise<void>`
- `renameContent(oldName: string, newName: string): Promise<void>`
- `getHints(count: number): Promise<HintResult>`
- `getSuggestions(threshold: number, maxCount: number): Promise<SuggestionResult>`
- `getStats(): Promise<Statistics>`
- `getAllCardNames(): Promise<string[]>`
- `clearCache(): void`

## 许可证

MIT License

## 更新日志

### v4.1.1
- 🔧 **重要修复**: 修复嵌套展开时 start/end 标记被错误展开的问题
- ✅ **稳定性**: 确保多层级引用场景下的正确展开行为
- 🧪 **测试增强**: 添加了嵌套展开的专门测试用例

### v4.1.0
- 🚀 **智能占位符**: setContent 时自动为引用记忆片段创建占位文件
- ⚡ **权重缓存**: 智能缓存权重计算结果，性能提升 60%+
- 📊 **优化算法**: 全新的权重计算和价值评估算法
- 🔄 **缓存失效**: 文件变更时自动清除相关缓存

### v4.0.0
- 🎉 全新架构：基于 Zettelkasten 记忆片段盒笔记法
- 🚀 精简设计：移除复杂的搜索功能，专注于提示词驱动
- 💾 文件存储：使用文件系统替代数据库
- 🔗 智能引用：支持记忆片段间的链接和内容展开
- ⚖️ 权重系统：智能计算记忆片段重要性
- 🎯 优化建议：自动识别需要改进的记忆片段
