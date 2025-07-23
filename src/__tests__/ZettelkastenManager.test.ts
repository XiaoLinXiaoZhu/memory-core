import { ZettelkastenManager } from '../index.js';
import * as path from 'path';
import * as fs from 'fs-extra';

describe('ZettelkastenManager', () => {
  let manager: ZettelkastenManager;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(__dirname, 'test-cards');
    manager = new ZettelkastenManager({
      storageDir: testDir,
      autoCreateDir: true
    });
  });

  afterEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  test('应该能够创建和获取卡片内容', async () => {
    const cardName = 'test-card';
    const content = '这是一个测试卡片';

    await manager.setContent(cardName, content);
    const retrievedContent = await manager.getContent(cardName);

    expect(retrievedContent).toBe(content);
  });

  test('应该能够处理卡片引用', async () => {
    await manager.setContent('card1', '这是卡片1的内容');
    await manager.setContent('card2', '这是卡片2，引用了[[card1]]');

    const content = await manager.getContent('card2');
    expect(content).toContain('[[card1]]');
  });

  test('应该能够展开卡片内容', async () => {
    await manager.setContent('base', '基础内容');
    await manager.setContent('main', '主要内容 ![[base]]');

    const expandedContent = await manager.getContent('main', 1);
    expect(expandedContent).toContain('![[base]]start');
    expect(expandedContent).toContain('基础内容');
    expect(expandedContent).toContain('![[base]]end');
  });

  test('应该能够删除卡片', async () => {
    const cardName = 'delete-test';
    await manager.setContent(cardName, '待删除的内容');
    
    await manager.deleteContent(cardName);
    
    await expect(manager.getContent(cardName)).rejects.toThrow();
  });

  test('应该能够重命名卡片', async () => {
    const oldName = 'old-name';
    const newName = 'new-name';
    const content = '测试内容';

    await manager.setContent(oldName, content);
    await manager.renameContent(oldName, newName);

    const retrievedContent = await manager.getContent(newName);
    expect(retrievedContent).toBe(content);

    await expect(manager.getContent(oldName)).rejects.toThrow();
  });

  test('应该能够获取提示', async () => {
    await manager.setContent('card1', '内容1 [[card2]]');
    await manager.setContent('card2', '内容2 [[card3]]');
    await manager.setContent('card3', '内容3');

    const hints = await manager.getHints(3);
    expect(hints.cardNames).toHaveLength(3);
    expect(hints.weights).toHaveLength(3);
  });

  test('应该能够获取优化建议', async () => {
    await manager.setContent('short', 'x');
    await manager.setContent('long', 'x'.repeat(1000));

    const suggestions = await manager.getSuggestions(0.1, 2);
    expect(suggestions.cardNames.length).toBeGreaterThan(0);
  });
});
