# Modular MCP Memory v4.0

基于 Zettelkasten 卡片盒笔记法的精简记忆系统。

## 特性

- 🗂️ **卡片化管理**: 每个记忆单元作为独立的卡片
- 🔗 **智能引用**: 通过 `[[卡片名]]` 方式建立卡片间的链接
- 📖 **内容展开**: 支持递归展开引用内容
- ⚖️ **权重计算**: 基于引用关系计算卡片权重
- 🎯 **智能提示**: 根据权重提供相关卡片建议
- 🔧 **优化建议**: 识别低价值卡片，提供优化建议
- 📁 **文件存储**: 使用文件系统存储，便于备份和迁移

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

// 创建卡片
await manager.setContent('AI基础', `
# AI基础知识

人工智能的核心概念包括：
- [[机器学习]]
- [[深度学习]]
- [[自然语言处理]]
`);

// 获取卡片内容（展开引用）
const content = await manager.getContent('AI基础', 1);

// 获取智能提示
const hints = await manager.getHints(5);
console.log('推荐卡片:', hints.cardNames);
```

## 卡片引用语法

### 基本引用
使用 `[[卡片名]]` 引用其他卡片。

### 内容展开
使用 `![[卡片名]]` 来展开引用卡片的内容。展开后的格式：

```markdown
![[卡片名]]start

卡片的实际内容

![[卡片名]]end
```

## 权重计算算法

系统使用递归算法计算卡片权重：

```typescript
// 当卡片有向外引用时
权重 = (引用卡片1权重 + 引用卡片2权重 + ... + 引用卡片n权重) / n

// 当卡片没有向外引用时
权重 = 1
```

## 价值计算

卡片价值用于优化建议：

```
价值 = 权重 / 字符数
```

价值越低的卡片可能需要优化（扩展内容或删除）。

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

### v4.0.0
- 🎉 全新架构：基于 Zettelkasten 卡片盒笔记法
- 🚀 精简设计：移除复杂的搜索功能，专注于提示词驱动
- 💾 文件存储：使用文件系统替代数据库
- 🔗 智能引用：支持卡片间的链接和内容展开
- ⚖️ 权重系统：智能计算卡片重要性
- 🎯 优化建议：自动识别需要改进的卡片
