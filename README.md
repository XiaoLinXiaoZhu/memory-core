# Modular MCP Memory v4.4.0

基于 Zettelkasten 记忆片段盒笔记法的精简记忆系统，现已包含智能优化功能。

## 🐛 v4.1.1 修复

- 🔧 **嵌套展开修复**: 修复了深度展开时 start/end 标记被错误展开的问题
- ✅ **稳定性提升**: 确保多层级引用场景下的正确展开行为

## ✨ v4.1 新功能

- 🚀 **智能占位符**: setMemory 时自动为引用记忆片段创建占位文件
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
// 普通获取
await manager.getMemory(fragmentName, 展开深度);
// 获取带行号内容
await manager.getMemory(fragmentName, 展开深度, true);
```

### 2. 创建/编辑文件内容
```typescript
await manager.setMemory(fragmentName, 内容);
```

### 3. 删除文件内容
```typescript
await manager.deleteMemory(fragmentName);
```

### 4. 重命名/合并文件内容
```typescript
await manager.renameMemory(旧文件名称, 新文件名称);
```

### 5. 获取提示
```typescript
await manager.getMemoryHints(文件数量);
```

### 6. 获取低价值片段建议（推荐）
```typescript
await manager.getOptimizeSuggestions(优化参数, 最大文件数量);
```

### 7. 获取孤立片段建议
```typescript
await manager.getIsolatedSuggestions(最大文件数量);
```

### 8. 获取优化建议（已弃用）
```typescript
await manager.getSuggestions(优化参数, 最大文件数量);
```

## 🆕 v4.1 新功能详解

### 智能占位符创建
当您在记忆片段中引用不存在的记忆片段时，系统会自动创建占位文件：

```typescript
// 创建包含引用的记忆片段
await manager.setMemory('学习计划', '今天要学习 [[JavaScript基础]] 和 [[React框架]]');

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
await manager.setMemory('AI基础', `
# AI基础知识

人工智能的核心概念包括：
- [[机器学习]]
- [[深度学习]]
- [[自然语言处理]]
`);

// 获取记忆片段内容（展开引用）
const content = await manager.getMemory('AI基础', 1);

// 获取智能提示
const hints = await manager.getMemoryHints(5);
console.log('推荐记忆片段:', hints.fragmentNames);
```

## 记忆片段引用语法

### 基本引用
使用 `[[记忆片段名]]` 引用其他记忆片段。

### 子目录支持
记忆片段名称支持使用 `/` 来创建子目录结构：

```typescript
// 创建子目录中的记忆片段
await manager.setMemory('编程/JavaScript', 'JavaScript 相关内容');
await manager.setMemory('编程/前端/React', 'React 框架内容');

// 引用子目录中的记忆片段
await manager.setMemory('学习计划', `
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

### 内容展开标记格式
使用 `![[记忆片段名]]` 来展开引用记忆片段的内容。展开后的格式：

```markdown
![[记忆片段名]]start

记忆片段的实际内容

![[记忆片段名]]end
```

### 新内容展开标记格式（v4.4.0+）
从 v4.4.0 开始，系统使用新的内容展开标记格式：

```markdown
<!-- fragment-start:记忆片段名 -->
记忆片段的实际内容
<!-- fragment-end:记忆片段名 -->
```

**优势：**
- 更清晰的标记结构，避免与内容冲突
- 支持嵌套展开，不会相互干扰
- 更好的可读性和维护性
- 兼容 HTML 注释格式，在各种编辑器中都能正确显示

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

## 信息散度

信息散度是衡量记忆片段价值的新指标，它鼓励信息的单元化和网络化：

```
信息散度 = 权重 / 字符数
```

与传统的价值计算相比，信息散度：
- 更注重信息的密度而非绝对价值
- 鼓励创建精简而高价值的记忆片段
- 促进记忆片段间的网络连接
- 避免过度冗长的内容积累

低信息散度的记忆片段通常表示：
- 内容过于冗长而信息密度低
- 缺乏足够的引用连接
- 可能需要精简或重新组织

## 系统片段

系统片段是具有特殊只读特性的记忆片段，用于存储系统核心配置和功能：

### 特性
- **只读特性**: 系统片段不能被普通用户修改
- **自动识别**: 系统自动识别并保护系统片段
- **核心功能**: 用于存储系统级配置和功能

### 判断方法
系统片段通过内容前缀识别：
- 以 `<!-- core memory -->` 开头的记忆片段被识别为系统片段
- 系统片段会被自动排除在优化建议之外
- 系统片段的修改需要特殊权限或方法

### 示例
```markdown
<!-- core memory -->
# 系统配置

这是系统核心配置，不能被普通用户修改。
```

## 弃用说明

### getSuggestions 方法弃用原因
`getSuggestions` 方法已被弃用，原因如下：
1. **算法不够精确**: 使用 Sigmoid 函数计算价值，可能导致结果不够准确
2. **缺乏针对性**: 无法区分低价值和孤立片段的不同优化需求
3. **性能问题**: 计算复杂度较高，特别是在大型记忆库中

### 推荐替代方案
建议使用以下两个专门的方法：

#### 1. getOptimizeSuggestions
专注于识别低价值的记忆片段：
- 使用信息散度计算，更加精确
- 专门针对内容密度低的片段
- 提供更准确的优化建议

#### 2. getIsolatedSuggestions
专注于识别孤立的记忆片段：
- 识别没有反向链接的片段
- 帮助发现记忆网络中的断点
- 促进记忆片段间的连接

### 迁移指南
```typescript
// 旧方法（已弃用）
const suggestions = await manager.getSuggestions(0.1, 10);

// 新方法（推荐）
const lowValueSuggestions = await manager.getOptimizeSuggestions(0.1, 10);
const isolatedSuggestions = await manager.getIsolatedSuggestions(10);
```

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

- `getMemory(fragmentName: string, expandDepth?: number, showLineNumbers?: boolean): Promise<string>`
- `setMemory(fragmentName: string, content: string): Promise<void>`
- `deleteMemory(fragmentName: string): Promise<void>`
- `renameMemory(oldName: string, newName: string): Promise<void>`
- `extractMemory(sourceFragmentName: string, targetFragmentName: string, range?: ExtractRange): Promise<void>`
- `getMemoryHints(count: number): Promise<HintResult>`
- `getOptimizeSuggestions(optimizationParam: number, maxFileCount: number): Promise<OptimizeSuggestionResult>`
- `getIsolatedSuggestions(maxFileCount: number): Promise<IsolatedSuggestionResult>`
- `getSuggestions(threshold: number, maxCount: number): Promise<SuggestionResult>` (已弃用)
- `getStats(): Promise<Statistics>`
- `getAllFragmentNames(): Promise<string[]>`
- `insertLinkAt(sourceFragmentName: string, targetFragmentName: string, linePosition?: number, anchorText?: string): Promise<void>`
- `getBacklinks(fragmentName: string): Promise<string[]>`
- `clearCache(): void`

## 许可证

MIT License

## 更新日志

### v4.4.0
- 🆕 **API重命名**: 所有方法统一使用 fragmentName 参数名，方法名更语义化
- 🆕 **新方法**: 添加 getOptimizeSuggestions 方法，使用信息散度计算低价值片段
- 🆕 **新方法**: 添加 getIsolatedSuggestions 方法，识别孤立记忆片段
- 🆕 **新展开格式**: 引入新的内容展开标记格式 `<!-- fragment-start:名称 -->`
- 📊 **优化算法**: 引入信息散度概念，优化价值计算方式
- 🛡️ **系统片段**: 添加系统片段识别和保护机制
- 🔄 **弃用标记**: 标记 getSuggestions 方法为已弃用，推荐使用新方法

### v4.1.1
- 🔧 **重要修复**: 修复嵌套展开时 start/end 标记被错误展开的问题
- ✅ **稳定性**: 确保多层级引用场景下的正确展开行为
- 🧪 **测试增强**: 添加了嵌套展开的专门测试用例

### v4.1.0
- 🚀 **智能占位符**: setMemory 时自动为引用记忆片段创建占位文件
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
