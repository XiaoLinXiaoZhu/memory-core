import { ZettelkastenManager } from '../core/ZettelkastenManager.js';
import { ZettelkastenError, ZettelkastenErrorType } from '../types/index.js';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('ZettelkastenManager - New Features', () => {
  let manager: ZettelkastenManager;
  let testDir: string;

  beforeEach(async () => {
    // 创建临时测试目录
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zettel-test-'));
    manager = new ZettelkastenManager({
      storageDir: testDir,
      autoCreateDir: true
    });
  });

  afterEach(async () => {
    // 清理测试目录
    await fs.remove(testDir);
  });

  describe('insertLinkAt', () => {
    it('should insert link at the end by default', async () => {
      // 创建源卡片
      await manager.setContent('source', 'Line 1\nLine 2\nLine 3');
      
      // 插入链接
      await manager.insertLinkAt('source', 'target');
      
      const content = await manager.getContent('source');
      expect(content).toBe('Line 1\nLine 2\nLine 3\n[[target]]');
      
      // 检查目标卡片是否自动创建
      const targetExists = await fs.pathExists(path.join(testDir, 'target.md'));
      expect(targetExists).toBe(true);
    });

    it('should insert link at specified positive line position', async () => {
      await manager.setContent('source', 'Line 1\nLine 2\nLine 3');
      
      // 在第2行位置插入
      await manager.insertLinkAt('source', 'target', 2, 'See also');
      
      const content = await manager.getContent('source');
      expect(content).toBe('Line 1\nSee also [[target]]\nLine 2\nLine 3');
    });

    it('should insert link at negative line position (from end)', async () => {
      await manager.setContent('source', 'Line 1\nLine 2\nLine 3');
      
      // 从末尾倒数第2行插入
      await manager.insertLinkAt('source', 'target', -1);
      
      const content = await manager.getContent('source');
      expect(content).toBe('Line 1\nLine 2\n[[target]]\nLine 3');
    });

    it('should throw error if source card does not exist', async () => {
      await expect(manager.insertLinkAt('nonexistent', 'target'))
        .rejects.toThrow(ZettelkastenError);
    });
  });

  describe('getBacklinks', () => {
    it('should return empty array if no backlinks exist', async () => {
      await manager.setContent('isolated', 'This card has no references');
      
      const backlinks = await manager.getBacklinks('isolated');
      expect(backlinks).toEqual([]);
    });

    it('should return cards that reference the target card', async () => {
      await manager.setContent('target', 'Target content');
      await manager.setContent('ref1', 'This references [[target]]');
      await manager.setContent('ref2', 'Another reference to [[target]] here');
      await manager.setContent('noref', 'This does not reference anything');
      
      const backlinks = await manager.getBacklinks('target');
      expect(backlinks.sort()).toEqual(['ref1', 'ref2']);
    });

    it('should not include self-references', async () => {
      await manager.setContent('self', 'This card references [[self]]');
      
      const backlinks = await manager.getBacklinks('self');
      expect(backlinks).toEqual([]);
    });
  });

  describe('extractContent', () => {
    it('should extract content by line range', async () => {
      const content = `Line 1
Line 2
Line 3
Line 4
Line 5`;
      
      await manager.setContent('source', content);
      
      // 提取第2-4行
      await manager.extractContent('source', 'extracted', {
        start: { line: 2 },
        end: { line: 4 }
      });
      
      const extractedContent = await manager.getContent('extracted');
      expect(extractedContent).toBe('Line 2\nLine 3\nLine 4');
      
      const sourceContent = await manager.getContent('source');
      expect(sourceContent).toBe('Line 1\n[[extracted]]\nLine 5');
    });

    it('should extract content by regex pattern', async () => {
      const content = `# Introduction
Some intro text

## Section 1
Content of section 1
More content

## Section 2
Content of section 2

# Conclusion`;
      
      await manager.setContent('source', content);
      
      // 提取 Section 1
      await manager.extractContent('source', 'section1', {
        start: { regex: '^## Section 1' },
        end: { regex: '^## Section 2' }
      });
      
      const extractedContent = await manager.getContent('section1');
      expect(extractedContent).toBe('## Section 1\nContent of section 1\nMore content\n');
      
      const sourceContent = await manager.getContent('source');
      expect(sourceContent).toContain('[[section1]]');
      expect(sourceContent).not.toContain('## Section 1');
    });

    it('should combine line and regex patterns', async () => {
      const content = `Line 1
## Header 1
Content 1
## Header 2
Content 2
Line 6`;
      
      await manager.setContent('source', content);
      
      // 从第2行开始搜索Header 1，到第5行结束
      await manager.extractContent('source', 'section', {
        start: { line: 2, regex: '^## Header 1' },
        end: { line: 5 }
      });
      
      const extractedContent = await manager.getContent('section');
      expect(extractedContent).toBe('## Header 1\nContent 1\n## Header 2\nContent 2');
    });

    it('should append to existing target card', async () => {
      await manager.setContent('existing', 'Existing content');
      await manager.setContent('source', 'Line 1\nLine 2\nLine 3');
      
      await manager.extractContent('source', 'existing', {
        start: { line: 2 },
        end: { line: 2 }
      });
      
      const content = await manager.getContent('existing');
      expect(content).toBe('Existing content\n\n---\n\nLine 2');
    });

    it('should throw error if no range provided', async () => {
      await manager.setContent('source', 'Some content');
      
      await expect(manager.extractContent('source', 'target'))
        .rejects.toThrow(ZettelkastenError);
    });

    it('should throw error if start is after end', async () => {
      await manager.setContent('source', 'Line 1\nLine 2\nLine 3');
      
      await expect(manager.extractContent('source', 'target', {
        start: { line: 3 },
        end: { line: 1 }
      })).rejects.toThrow(ZettelkastenError);
    });

    it('should throw error if no content found in range', async () => {
      await manager.setContent('source', 'Line 1\nLine 2\nLine 3');
      
      await expect(manager.extractContent('source', 'target', {
        start: { line: 10 },
        end: { line: 15 }
      })).rejects.toThrow(ZettelkastenError);
    });
  });

  describe('integration tests', () => {
    it('should work together: insert link and get backlinks', async () => {
      await manager.setContent('main', 'Main content');
      await manager.setContent('related', 'Related content');
      
      // 插入链接
      await manager.insertLinkAt('main', 'related', 0, 'See also');
      
      // 获取反向链接
      const backlinks = await manager.getBacklinks('related');
      expect(backlinks).toEqual(['main']);
      
      // 验证内容
      const content = await manager.getContent('main');
      expect(content).toContain('See also [[related]]');
    });

    it('should extract content and maintain backlinks', async () => {
      const content = `# Document
## Important Section
This is important content
## Other Section
Other content`;
      
      await manager.setContent('document', content);
      await manager.setContent('reference', 'This refers to [[document]]');
      
      // 提取重要部分
      await manager.extractContent('document', 'important', {
        start: { regex: '^## Important Section' },
        end: { regex: '^## Other Section' }
      });
      
      // 验证反向链接仍然存在
      const documentBacklinks = await manager.getBacklinks('document');
      expect(documentBacklinks).toEqual(['reference']);
      
      // 验证提取的内容
      const importantContent = await manager.getContent('important');
      expect(importantContent).toContain('This is important content');
      
      // 验证原文档被正确替换
      const updatedDocument = await manager.getContent('document');
      expect(updatedDocument).toContain('[[important]]');
      expect(updatedDocument).not.toContain('This is important content');
    });
  });
});
