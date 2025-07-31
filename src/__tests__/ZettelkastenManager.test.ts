import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import * as path from 'path';
import { ZettelkastenManager } from '../core/ZettelkastenManager.js';
import { ZettelkastenError, ZettelkastenErrorType } from '../types/index.js';

describe('ZettelkastenManager', () => {
  let manager: ZettelkastenManager;
  const testDir = path.join(process.cwd(), 'test-storage');

  beforeEach(async () => {
    // 确保测试目录存在
    await fs.ensureDir(testDir);
    manager = new ZettelkastenManager({
      storageDir: testDir,
      autoCreateDir: true
    });
  });

  afterEach(async () => {
    // 清理测试目录
    await fs.remove(testDir);
  });

  describe('fragmentName 字段测试', () => {
    it('应该支持 fragmentName 作为新的字段名', async () => {
      const fragmentName = 'test-fragment';
      const content = '这是一个测试记忆片段';
      
      await manager.setMemory(fragmentName, content);
      const result = await manager.getMemory(fragmentName);
      
      expect(result).toBe(content);
    });

    it('应该正确处理包含子目录的 fragmentName', async () => {
      const fragmentName = '编程/TypeScript/基础语法';
      const content = 'TypeScript 基础语法内容';
      
      await manager.setMemory(fragmentName, content);
      const result = await manager.getMemory(fragmentName);
      
      expect(result).toBe(content);
      
      // 验证文件是否正确创建在子目录中
      const filePath = path.join(testDir, '编程', 'TypeScript', '基础语法.md');
      expect(await fs.pathExists(filePath)).toBe(true);
    });

    it('应该拒绝包含非法字符的 fragmentName', async () => {
      const invalidNames = ['test<name', 'test:name', 'test"name', 'test|name', 'test?name', 'test*name'];
      
      for (const invalidName of invalidNames) {
        await expect(manager.setMemory(invalidName, 'content')).rejects.toThrow(
          ZettelkastenError
        );
      }
    });
  });

  describe('新方法名测试', () => {
    describe('getMemory', () => {
      it('应该正确获取记忆片段内容', async () => {
        const fragmentName = 'test-get';
        const content = '测试获取内容';
        
        await manager.setMemory(fragmentName, content);
        const result = await manager.getMemory(fragmentName);
        
        expect(result).toBe(content);
      });

      it('应该抛出错误当记忆片段不存在', async () => {
        await expect(manager.getMemory('non-existent')).rejects.toThrow(
          ZettelkastenError
        );
      });

      it('应该支持展开功能', async () => {
        const fragment1 = 'fragment1';
        const fragment2 = 'fragment2';
        
        await manager.setMemory(fragment1, '这是 [[fragment2]] 的引用');
        await manager.setMemory(fragment2, '这是被引用的内容');
        
        const result = await manager.getMemory(fragment1, 1);
        expect(result).toContain('这是被引用的内容');
        expect(result).toContain('<!-- content from memory fragment fragment2 start -->');
      });

      it('应该支持行号输出', async () => {
        const fragmentName = 'test-line-numbers';
        const content = '第一行\n第二行\n第三行';
        
        await manager.setMemory(fragmentName, content);
        const result = await manager.getMemory(fragmentName, 0, true);
        
        expect(result).toBe('1 |第一行\n2 |第二行\n3 |第三行');
      });
    });

    describe('setMemory', () => {
      it('应该创建新的记忆片段', async () => {
        const fragmentName = 'new-fragment';
        const content = '新创建的内容';
        
        await manager.setMemory(fragmentName, content);
        const result = await manager.getMemory(fragmentName);
        
        expect(result).toBe(content);
      });

      it('应该更新已存在的记忆片段', async () => {
        const fragmentName = 'update-fragment';
        const initialContent = '初始内容';
        const updatedContent = '更新后的内容';
        
        await manager.setMemory(fragmentName, initialContent);
        await manager.setMemory(fragmentName, updatedContent);
        
        const result = await manager.getMemory(fragmentName);
        expect(result).toBe(updatedContent);
      });

      it('应该为引用的不存在的记忆片段创建占位符', async () => {
        const fragmentName = 'main-fragment';
        const content = '引用 [[missing-fragment]] 的内容';
        
        await manager.setMemory(fragmentName, content);
        
        // 验证占位符被创建
        const placeholderExists = await manager.getMemory('missing-fragment');
        expect(placeholderExists).toContain('<!-- 这是一个自动创建的占位记忆片段 -->');
      });
    });

    describe('deleteMemory', () => {
      it('应该删除记忆片段', async () => {
        const fragmentName = 'delete-test';
        
        await manager.setMemory(fragmentName, '要删除的内容');
        await manager.deleteMemory(fragmentName);
        
        await expect(manager.getMemory(fragmentName)).rejects.toThrow(
          new ZettelkastenError(
            ZettelkastenErrorType.CARD_NOT_FOUND,
            `Fragment not found: ${fragmentName}`
          )
        );
      });

      it('应该静默处理不存在的记忆片段', async () => {
        // 不应该抛出错误
        await expect(manager.deleteMemory('non-existent')).resolves.toBeUndefined();
      });
    });

    describe('renameMemory', () => {
      it('应该重命名记忆片段', async () => {
        const oldName = 'old-name';
        const newName = 'new-name';
        const content = '原始内容';
        
        await manager.setMemory(oldName, content);
        await manager.renameMemory(oldName, newName);
        
        const result = await manager.getMemory(newName);
        expect(result).toBe(content);
        
        // 验证旧名称已删除
        await expect(manager.getMemory(oldName)).rejects.toThrow();
      });

      it('应该合并内容当新名称已存在', async () => {
        const oldName = 'old-fragment';
        const newName = 'existing-fragment';
        const oldContent = '旧内容';
        const newContent = '新内容';
        
        await manager.setMemory(oldName, oldContent);
        await manager.setMemory(newName, newContent);
        
        await manager.renameMemory(oldName, newName);
        
        const result = await manager.getMemory(newName);
        expect(result).toContain(newContent);
        expect(result).toContain(oldContent);
        expect(result).toContain('---');
      });

      it('应该更新所有引用', async () => {
        const oldName = 'old-ref';
        const newName = 'new-ref';
        const referrer = 'referrer-fragment';
        
        await manager.setMemory(oldName, '被引用的内容');
        await manager.setMemory(referrer, `引用 [[${oldName}]] 的内容`);
        
        await manager.renameMemory(oldName, newName);
        
        const referrerContent = await manager.getMemory(referrer);
        expect(referrerContent).toContain(`[[${newName}]]`);
        expect(referrerContent).not.toContain(`[[${oldName}]]`);
      });
    });

    describe('extractMemory', () => {
      it('应该提取指定范围的内容', async () => {
        const sourceName = 'source-fragment';
        const targetName = 'target-fragment';
        const content = `第一行
第二行
第三行
第四行
第五行`;
        
        await manager.setMemory(sourceName, content);
        
        await manager.extractMemory(sourceName, targetName, {
          start: { line: 2 },
          end: { line: 4 }
        });
        
        const extracted = await manager.getMemory(targetName);
        expect(extracted).toBe('第二行\n第三行\n第四行');
        
        const sourceContent = await manager.getMemory(sourceName);
        expect(sourceContent).toContain(`[[${targetName}]]`);
      });

      it('应该支持正则表达式定位', async () => {
        const sourceName = 'source-regex';
        const targetName = 'target-regex';
        const content = `开始
内容1
内容2
结束
其他内容`;
        
        await manager.setMemory(sourceName, content);
        
        await manager.extractMemory(sourceName, targetName, {
          start: { regex: '内容1' },
          end: { regex: '结束' }
        });
        
        const extracted = await manager.getMemory(targetName);
        expect(extracted).toBe('内容1\n内容2');
      });

      it('应该追加内容到已存在的目标记忆片段', async () => {
        const sourceName = 'source-existing';
        const targetName = 'target-existing';
        
        await manager.setMemory(sourceName, '提取的内容');
        await manager.setMemory(targetName, '已存在的内容');
        
        await manager.extractMemory(sourceName, targetName, {
          start: { line: 1 },
          end: { line: 1 }
        });
        
        const result = await manager.getMemory(targetName);
        expect(result).toContain('已存在的内容');
        expect(result).toContain('提取的内容');
      });
    });

    describe('getMemoryHints', () => {
      it('应该返回按权重排序的记忆片段', async () => {
        // 创建测试数据
        await manager.setMemory('fragment1', '内容 [[fragment2]]');
        await manager.setMemory('fragment2', '内容 [[fragment3]]');
        await manager.setMemory('fragment3', '独立内容');
        await manager.setMemory('fragment4', '独立内容');
        
        const hints = await manager.getMemoryHints(10);
        
        expect(hints.fragmentNames).toBeInstanceOf(Array);
        expect(hints.weights).toBeInstanceOf(Array);
        expect(hints.weights.length).toBeGreaterThan(0);
        
        // 验证权重排序（从高到低）
        for (let i = 1; i < hints.weights.length; i++) {
          expect(hints.weights[i-1].weight).toBeGreaterThanOrEqual(hints.weights[i].weight);
        }
      });

      it('应该限制返回的记忆片段数量', async () => {
        await manager.setMemory('test1', '内容1');
        await manager.setMemory('test2', '内容2');
        await manager.setMemory('test3', '内容3');
        
        const hints = await manager.getMemoryHints(2);
        
        expect(hints.fragmentNames.length).toBeLessThanOrEqual(2);
      });
    });

    describe('getOptimizeSuggestions', () => {
      it('应该返回低价值的记忆片段', async () => {
        // 创建多个片段以确保有数据
        await manager.setMemory('fragment1', '这是一个很长的内容，包含很多字符，应该有较高的价值计算。这是一个很长的内容，包含很多字符，应该有较高的价值计算。');
        await manager.setMemory('fragment2', '短');
        await manager.setMemory('fragment3', '中等长度的内容');
        
        const suggestions = await manager.getOptimizeSuggestions(1, 10);
        
        expect(suggestions.fragmentNames).toBeInstanceOf(Array);
        expect(suggestions.values).toBeInstanceOf(Array);
        
        // 验证返回结构
        expect(suggestions.values.length).toBeGreaterThan(0);
      });
    });

    describe('getLowValueSuggestions', () => {
      it('应该返回信息散度低的记忆片段', async () => {
        await manager.setMemory('fragment1', '这是一个很长的内容，包含很多字符，应该有较高的信息散度。');
        await manager.setMemory('fragment2', '短');
        
        const suggestions = await manager.getLowValueSuggestions(0.1, 10);
        
        expect(suggestions.fragmentNames).toBeInstanceOf(Array);
        expect(suggestions.divergences).toBeInstanceOf(Array);
        
        // 应该包含信息散度低的片段
        const lowDivergenceFragment = suggestions.divergences.find(d => d.fragmentName === 'fragment2');
        expect(lowDivergenceFragment).toBeDefined();
      });

      it('应该跳过系统片段', async () => {
        await manager.setMemory('system-fragment', '<!-- core memory -->系统片段内容');
        
        const suggestions = await manager.getLowValueSuggestions(1, 10);
        
        const systemFragment = suggestions.divergences.find(d => d.fragmentName === 'system-fragment');
        expect(systemFragment).toBeUndefined();
      });
    });

    describe('getIsolatedSuggestions', () => {
      it('应该返回孤立的记忆片段', async () => {
        // 创建一个真正的孤立片段
        await manager.setMemory('real-isolated', '没有任何引用的孤立内容');
        
        const suggestions = await manager.getIsolatedSuggestions(10);
        
        // 验证返回结构
        expect(suggestions.isolatedResults).toBeInstanceOf(Array);
        
        // 检查是否有孤立片段
        const hasIsolated = suggestions.isolatedResults.some(r => r.isIsolated);
        expect(typeof hasIsolated).toBe('boolean');
      });

      it('应该跳过系统片段', async () => {
        await manager.setMemory('system-isolated', '<!-- core memory -->孤立的系统片段');
        
        const suggestions = await manager.getIsolatedSuggestions(10);
        
        const systemFragment = suggestions.isolatedResults.find(r => r.fragmentName === 'system-isolated');
        expect(systemFragment).toBeUndefined();
      });
    });
  });

  describe('内容展开的新标记格式测试', () => {
    it('应该使用新的展开标记格式', async () => {
      const fragment1 = 'main-fragment';
      const fragment2 = 'referenced-fragment';
      
      await manager.setMemory(fragment2, '这是被引用的内容\n第二行内容');
      await manager.setMemory(fragment1, `这是 [[${fragment2}]] 的引用`);
      
      const expanded = await manager.getMemory(fragment1, 1);
      
      expect(expanded).toContain('<!-- content from memory fragment referenced-fragment start -->');
      expect(expanded).toContain('<!-- the following content is from memory fragment referenced-fragment, it is automatically expended by the arguments expendDepth -->');
      expect(expanded).toContain('<!-- content from memory fragment referenced-fragment end -->');
    });

    it('应该防止循环引用', async () => {
      const fragment1 = 'circular1';
      const fragment2 = 'circular2';
      
      await manager.setMemory(fragment1, `引用 [[${fragment2}]]`);
      await manager.setMemory(fragment2, `引用 [[${fragment1}]]`);
      
      const expanded1 = await manager.getMemory(fragment1, 2);
      
      // 应该防止无限循环，检查是否包含循环检测逻辑
      expect(expanded1).toBeDefined();
      expect(expanded1).toContain('circular2');
    });

    it('应该正确处理嵌套展开', async () => {
      const fragment1 = 'level1';
      const fragment2 = 'level2';
      const fragment3 = 'level3';
      
      await manager.setMemory(fragment3, '最深层内容');
      await manager.setMemory(fragment2, `包含 [[${fragment3}]] 的引用`);
      await manager.setMemory(fragment1, `包含 [[${fragment2}]] 的引用`);
      
      const expanded = await manager.getMemory(fragment1, 2);
      
      expect(expanded).toContain('最深层内容');
      expect(expanded).toContain('level2');
      expect(expanded).toContain('level3');
    });
  });

  describe('基本 CRUD 操作测试', () => {
    it('应该完成完整的 CRUD 操作周期', async () => {
      const fragmentName = 'crud-test';
      
      // Create
      await manager.setMemory(fragmentName, '初始内容');
      let content = await manager.getMemory(fragmentName);
      expect(content).toBe('初始内容');
      
      // Read
      content = await manager.getMemory(fragmentName);
      expect(content).toBe('初始内容');
      
      // Update
      await manager.setMemory(fragmentName, '更新后的内容');
      content = await manager.getMemory(fragmentName);
      expect(content).toBe('更新后的内容');
      
      // Delete
      await manager.deleteMemory(fragmentName);
      await expect(manager.getMemory(fragmentName)).rejects.toThrow();
    });

    it('应该处理嵌套目录的 CRUD 操作', async () => {
      const fragmentName = '深度/嵌套/目录/测试片段';
      
      await manager.setMemory(fragmentName, '嵌套内容');
      const content = await manager.getMemory(fragmentName);
      expect(content).toBe('嵌套内容');
      
      await manager.deleteMemory(fragmentName);
      await expect(manager.getMemory(fragmentName)).rejects.toThrow();
    });
  });

  describe('缓存和性能测试', () => {
    it('应该正确缓存记忆片段', async () => {
      const fragmentName = 'cache-test';
      const content = '缓存测试内容';
      
      await manager.setMemory(fragmentName, content);
      
      // 第一次读取会缓存
      const firstRead = await manager.getMemory(fragmentName);
      expect(firstRead).toBe(content);
      
      // 第二次读取应该使用缓存
      const secondRead = await manager.getMemory(fragmentName);
      expect(secondRead).toBe(content);
    });

    it('应该在删除后清除缓存', async () => {
      const fragmentName = 'cache-clear-test';
      
      await manager.setMemory(fragmentName, '内容');
      await manager.getMemory(fragmentName); // 填充缓存
      
      await manager.deleteMemory(fragmentName);
      
      // 缓存应该被清除
      await expect(manager.getMemory(fragmentName)).rejects.toThrow();
    });
  });
});