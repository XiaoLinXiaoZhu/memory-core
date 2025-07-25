# 📦 v4.1.1 发布说明

## 🐛 重要修复

### 嵌套展开 start/end 标记问题修复

**问题描述：**
在多层级展开（expandDepth > 1）时，展开结果中的 `![[记忆片段名]]start` 和 `![[记忆片段名]]end` 标记会被错误地识别为新的展开指令，导致嵌套标记混乱。

**修复方案：**
使用负向先行断言（negative lookahead）修改正则表达式：

```typescript
// 修复前
const expandPattern = /!\[\[([^\]]+)\]\]/g;

// 修复后
const expandPattern = /!\[\[([^\]]+)\]\](?!(?:start|end))/g;
```

**修复验证：**
- ✅ 正确处理嵌套展开
- ✅ start/end 标记不会被错误展开
- ✅ 所有原有测试继续通过
- ✅ 新增专门的嵌套展开测试

## 📊 版本对比

| 版本 | 主要变更 |
|------|----------|
| v4.1.1 | 🔧 修复嵌套展开bug，提升稳定性 |
| v4.1.0 | 🚀 智能占位符、权重缓存、新算法 |
| v4.0.0 | 🎉 全新架构，基于Zettelkasten |

## 🧪 测试结果

```
🧪 测试嵌套展开和 start/end 标记...

📝 测试深度为2的展开:
顶层开始
![[中间记忆片段]]start
中间内容开始
![[基础记忆片段]]start
这是基础内容
![[基础记忆片段]]end
中间内容结束
![[中间记忆片段]]end
顶层结束

🔍 验证结果:
✅ 包含正确的 start/end 标记: true
✅ 没有错误展开 start/end 标记: true
🎉 嵌套展开测试通过！start/end 标记正确处理
```

## 🚀 发布准备

1. ✅ 版本号更新：4.1.0 → 4.1.1
2. ✅ README 文档更新
3. ✅ 修复实现并测试
4. ✅ 构建验证通过
5. ✅ 测试套件通过（7/7）

## 📝 下一步

准备发布到 npm：

```bash
npm publish
```

这是一个重要的稳定性修复，建议所有使用嵌套展开功能的用户尽快更新。
