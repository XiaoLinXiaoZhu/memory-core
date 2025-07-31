# ZettelkastenManager 新功能说明

根据文档 `存在的问题.md` 中提到的需求，我们已经成功实现了以下三个核心新功能：

## 1. insertLinkAt - 链接插入功能

**用途**: 在指定位置方便地插入记忆片段链接，无需重新输出整个文件内容。

**方法签名**:
```typescript
async insertLinkAt(
  sourceFragmentName: string,    // 源文件名称
  targetFragmentName: string,    // 目标文件名称
  linePosition?: number,     // 行号位置（可选）
  anchorText?: string        // 锚文本（可选）
): Promise<void>
```

**使用示例**:
```typescript
// 在文件末尾添加链接
await manager.insertLinkAt("项目计划", "时间表");

// 在第2行位置插入带锚文本的链接
await manager.insertLinkAt("项目计划", "时间表", 2, "查看详细时间安排");

// 从末尾倒数第2行插入链接
await manager.insertLinkAt("项目计划", "时间表", -1);
```

**特性**:
- 支持正数行号（从文件开头计数，1-based）
- 支持负数行号（从文件末尾计数）
- 0或不提供行号时默认添加到文件末尾
- 自动创建目标记忆片段的占位符（如果不存在）
- 支持自定义锚文本

## 2. getBacklinks - 反向链接获取

**用途**: 获取所有引用指定记忆片段的其他记忆片段名称列表。

**方法签名**:
```typescript
async getBacklinks(fragmentName: string): Promise<string[]>
```

**使用示例**:
```typescript
// 获取所有引用"API文档"的记忆片段
const backlinks = await manager.getBacklinks("API文档");
console.log(backlinks); // ["项目计划", "开发指南", "测试文档"]
```

**特性**:
- 返回引用指定记忆片段的所有其他记忆片段名称
- 自动排除自引用
- 支持嵌套目录结构的记忆片段

## 3. extractMemory - 优化版内容提取

**用途**: 通过行号和正则表达式精确定位并提取内容范围，解决AI需要完整复述内容的问题。

**方法签名**:
```typescript
async extractMemory(
  sourceFragmentName: string,    // 源文件名称
  targetFragmentName: string,    // 目标文件名称
  range?: ExtractRange       // 提取范围
): Promise<void>
```

**ExtractRange 接口**:
```typescript
interface ExtractRange {
  start?: {
    line?: number;    // 起始行号（1-based）
    regex?: string;   // 正则表达式匹配
  };
  end?: {
    line?: number;    // 结束行号（1-based）
    regex?: string;   // 正则表达式匹配
  };
}
```

**使用示例**:

1. **按行号范围提取**:
```typescript
// 提取第3-10行的内容
await manager.extractMemory("产品设计文档", "API规范", {
  start: { line: 3 },
  end: { line: 10 }
});
```

2. **按正则表达式提取**:
```typescript
// 提取"API规范"章节（从## API规范开始到## 其他内容结束）
await manager.extractMemory("产品设计文档", "API规范内容", {
  start: { regex: "^## API规范" },
  end: { regex: "^## 其他内容" }
});
```

3. **结合行号和正则表达式**:
```typescript
// 从第3行开始搜索匹配"## API规范"的内容，到第10行结束
await manager.extractMemory("产品设计文档", "API规范内容", {
  start: { line: 3, regex: "^## API规范" },
  end: { line: 10 }
});
```

**特性**:
- 支持行号精确定位（1-based，范围两头都包含）
- 支持正则表达式模式匹配
- 支持行号与正则表达式组合使用
- 如果目标记忆片段已存在，新内容会追加到现有内容中
- 自动在源文件中将提取的内容替换为链接
- 提供详细的错误处理和验证

## API 变更说明（v4.4.0+）

### 参数名统一变更
- **旧参数名**: `cardName`
- **新参数名**: `fragmentName`

### 方法名变更
- **getContent** → **getMemory**
- **setContent** → **setMemory**
- **deleteContent** → **deleteMemory**
- **renameContent** → **renameMemory**
- **extractContent** → **extractMemory**
- **getSuggestions** → **getOptimizeSuggestions**
- **getHints** → **getMemoryHints**

### 变更原因
1. **语义化命名**: 新方法名更准确地描述了功能
2. **一致性**: 统一使用 "Memory" 作为核心概念
3. **可读性**: 方法名更直观，降低学习成本
4. **扩展性**: 为未来功能扩展提供更好的命名空间

### 向后兼容
所有变更都保持向后兼容，现有代码无需修改即可继续运行。

## 核心优势

1. **解决链接插入问题**: 不再需要完整输出文件内容，可以精确指定插入位置
2. **解决内容提取问题**: 不再需要AI复述内容，通过范围定位精确提取
3. **增强反向链接追踪**: 方便了解记忆片段间的引用关系
4. **保持API一致性**: 新功能与现有API设计风格保持一致
5. **向后兼容**: 不影响现有功能的使用

## 运行演示

我们提供了一个完整的演示脚本来展示新功能：

```bash
cd memory-core
node demo-new-features.mjs
```

演示将创建示例记忆片段并展示所有新功能的使用方法。
