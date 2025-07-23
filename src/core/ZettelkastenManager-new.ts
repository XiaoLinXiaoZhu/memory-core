import { 
  ensureDir, 
  writeFile, 
  readFile, 
  stat, 
  pathExists, 
  remove, 
  readdir 
} from 'fs-extra';
import * as path from 'path';
import {
  CardContent,
  CardReference,
  WeightResult,
  ValueResult,
  HintResult,
  SuggestionResult,
  ZettelkastenConfig,
  ExpandOptions,
  ZettelkastenError,
  ZettelkastenErrorType
} from '../types/index.js';

/**
 * Zettelkasten 卡片盒管理器
 * 基于文件系统的卡片存储和管理系统
 */
export class ZettelkastenManager {
  private config: Required<ZettelkastenConfig>;
  private cardCache: Map<string, CardContent> = new Map();
  private readonly LINK_PATTERN = /\[\[([^\]]+)\]\]/g;
  private readonly EXPAND_START_PATTERN = /!\[\[([^\]]+)\]\]start/g;
  private readonly EXPAND_END_PATTERN = /!\[\[([^\]]+)\]\]end/g;

  constructor(config: ZettelkastenConfig) {
    this.config = {
      encoding: 'utf-8',
      autoCreateDir: true,
      ...config
    };

    this.validateConfig();
    // 异步初始化存储目录，但不等待
    this.initializeStorage().catch(() => {
      // 忽略初始化错误，在实际操作时再处理
    });
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    if (!this.config.storageDir) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.INVALID_CONFIG,
        'Storage directory is required'
      );
    }
  }

  /**
   * 初始化存储目录
   */
  private async initializeStorage(): Promise<void> {
    try {
      if (this.config.autoCreateDir) {
        await ensureDir(this.config.storageDir);
      }
    } catch (error) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.STORAGE_ERROR,
        `Failed to initialize storage directory: ${error}`,
        error
      );
    }
  }

  /**
   * 验证卡片名称
   */
  private validateCardName(cardName: string): void {
    if (!cardName || cardName.trim() === '') {
      throw new ZettelkastenError(
        ZettelkastenErrorType.INVALID_CARD_NAME,
        'Card name cannot be empty'
      );
    }

    // 检查文件名是否包含非法字符
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(cardName)) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.INVALID_CARD_NAME,
        `Card name contains invalid characters: ${cardName}`
      );
    }
  }

  /**
   * 获取卡片文件路径
   */
  private getCardFilePath(cardName: string): string {
    return path.join(this.config.storageDir, `${cardName}.md`);
  }

  /**
   * 检查卡片是否存在
   */
  private async cardExists(cardName: string): Promise<boolean> {
    const filePath = this.getCardFilePath(cardName);
    return await pathExists(filePath);
  }

  /**
   * 从文件加载卡片内容
   */
  private async loadCardFromFile(cardName: string): Promise<CardContent | null> {
    const filePath = this.getCardFilePath(cardName);
    
    try {
      if (!(await pathExists(filePath))) {
        return null;
      }

      const content = await readFile(filePath, this.config.encoding);
      const stats = await stat(filePath);

      const card: CardContent = {
        name: cardName,
        content: content.toString(),
        createdAt: stats.birthtime,
        updatedAt: stats.mtime
      };

      this.cardCache.set(cardName, card);
      return card;
    } catch (error) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.STORAGE_ERROR,
        `Failed to load card ${cardName}: ${error}`,
        error
      );
    }
  }

  /**
   * 保存卡片到文件
   */
  private async saveCardToFile(card: CardContent): Promise<void> {
    const filePath = this.getCardFilePath(card.name);
    
    try {
      // 确保目录存在
      await ensureDir(path.dirname(filePath));
      
      await writeFile(filePath, card.content, this.config.encoding);
      
      // 更新缓存
      const updatedCard = { ...card, updatedAt: new Date() };
      this.cardCache.set(card.name, updatedCard);
    } catch (error) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.STORAGE_ERROR,
        `Failed to save card ${card.name}: ${error}`,
        error
      );
    }
  }

  /**
   * 解析卡片中的链接引用
   */
  private parseCardReferences(content: string): CardReference[] {
    const references: CardReference[] = [];
    let match;

    this.LINK_PATTERN.lastIndex = 0;
    while ((match = this.LINK_PATTERN.exec(content)) !== null) {
      references.push({
        cardName: match[1].trim(),
        position: match.index || 0
      });
    }

    return references;
  }

  /**
   * 展开卡片内容中的引用
   */
  private async expandCardContent(
    content: string,
    options: ExpandOptions = {}
  ): Promise<string> {
    const {
      depth = 1,
      maxDepth = 10,
      expandedCards = new Set<string>()
    } = options;

    if (depth > maxDepth) {
      return content;
    }

    let expandedContent = content;
    const expandMatches: Array<{ cardName: string; match: RegExpMatchArray }> = [];

    // 查找所有需要展开的引用 ![[cardName]]
    let match;
    const expandPattern = /!\[\[([^\]]+)\]\]/g;
    while ((match = expandPattern.exec(content)) !== null) {
      expandMatches.push({
        cardName: match[1].trim(),
        match
      });
    }

    // 逆序处理，避免位置偏移问题
    for (const { cardName, match } of expandMatches.reverse()) {
      if (expandedCards.has(cardName)) {
        // 防止循环引用
        continue;
      }

      const referencedCard = await this.loadCardFromFile(cardName);
      if (referencedCard) {
        const newExpandedCards = new Set(expandedCards);
        newExpandedCards.add(cardName);

        // 递归展开引用的卡片内容
        const expandedRefContent = await this.expandCardContent(
          referencedCard.content,
          { depth: depth + 1, maxDepth, expandedCards: newExpandedCards }
        );

        const expandedBlock = `![[${cardName}]]start\n\n${expandedRefContent}\n\n![[${cardName}]]end`;
        
        expandedContent = 
          expandedContent.slice(0, match.index || 0) +
          expandedBlock +
          expandedContent.slice((match.index || 0) + match[0].length);
      }
    }

    return expandedContent;
  }

  /**
   * 1. 获取文件内容
   */
  async getContent(cardName: string, expandDepth: number = 0): Promise<string> {
    this.validateCardName(cardName);

    const card = await this.loadCardFromFile(cardName);
    if (!card) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.CARD_NOT_FOUND,
        `Card not found: ${cardName}`
      );
    }

    if (expandDepth <= 0) {
      return card.content;
    }

    return await this.expandCardContent(card.content, { depth: 1, maxDepth: expandDepth });
  }

  /**
   * 2. 创建/编辑文件内容
   */
  async setContent(cardName: string, content: string): Promise<void> {
    this.validateCardName(cardName);

    const now = new Date();
    const existingCard = await this.loadCardFromFile(cardName);

    const card: CardContent = {
      name: cardName,
      content,
      createdAt: existingCard?.createdAt || now,
      updatedAt: now
    };

    await this.saveCardToFile(card);
  }

  /**
   * 3. 删除文件内容
   */
  async deleteContent(cardName: string): Promise<void> {
    this.validateCardName(cardName);

    const filePath = this.getCardFilePath(cardName);
    
    try {
      if (await pathExists(filePath)) {
        await remove(filePath);
        this.cardCache.delete(cardName);
      }
    } catch (error) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.STORAGE_ERROR,
        `Failed to delete card ${cardName}: ${error}`,
        error
      );
    }
  }

  /**
   * 4. 重命名/合并文件内容
   */
  async renameContent(oldCardName: string, newCardName: string): Promise<void> {
    this.validateCardName(oldCardName);
    this.validateCardName(newCardName);

    const oldCard = await this.loadCardFromFile(oldCardName);
    if (!oldCard) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.CARD_NOT_FOUND,
        `Card not found: ${oldCardName}`
      );
    }

    const newCard = await this.loadCardFromFile(newCardName);
    let finalContent = oldCard.content;

    if (newCard) {
      // 合并内容
      finalContent = `${newCard.content}\n\n---\n\n${oldCard.content}`;
    }

    // 保存到新名称
    await this.setContent(newCardName, finalContent);

    // 删除旧卡片
    await this.deleteContent(oldCardName);

    // 更新所有引用
    await this.updateAllReferences(oldCardName, newCardName);
  }

  /**
   * 更新所有卡片中的引用
   */
  private async updateAllReferences(oldCardName: string, newCardName: string): Promise<void> {
    try {
      const files = await readdir(this.config.storageDir);
      const mdFiles = files.filter((file: string) => file.endsWith('.md'));

      for (const file of mdFiles) {
        const cardName = path.basename(file, '.md');
        const card = await this.loadCardFromFile(cardName);
        
        if (card) {
          const oldLinkPattern = new RegExp(`\\[\\[${oldCardName}\\]\\]`, 'g');
          const oldExpandPattern = new RegExp(`!\\[\\[${oldCardName}\\]\\]`, 'g');
          
          let updatedContent = card.content;
          updatedContent = updatedContent.replace(oldLinkPattern, `[[${newCardName}]]`);
          updatedContent = updatedContent.replace(oldExpandPattern, `![[${newCardName}]]`);

          if (updatedContent !== card.content) {
            await this.setContent(cardName, updatedContent);
          }
        }
      }
    } catch (error) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.STORAGE_ERROR,
        `Failed to update references: ${error}`,
        error
      );
    }
  }

  /**
   * 获取所有卡片名称
   */
  async getAllCardNames(): Promise<string[]> {
    try {
      const files = await readdir(this.config.storageDir);
      return files
        .filter((file: string) => file.endsWith('.md'))
        .map((file: string) => path.basename(file, '.md'));
    } catch (error) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.STORAGE_ERROR,
        `Failed to get card names: ${error}`,
        error
      );
    }
  }

  /**
   * 递归计算卡片权重
   */
  private async calculateWeight(
    cardName: string,
    visited: Set<string> = new Set()
  ): Promise<number> {
    if (visited.has(cardName)) {
      return 1; // 防止循环引用
    }

    visited.add(cardName);

    const card = await this.loadCardFromFile(cardName);
    if (!card) {
      return 1;
    }

    const references = this.parseCardReferences(card.content);
    const uniqueReferences = [...new Set(references.map(ref => ref.cardName))];

    if (uniqueReferences.length === 0) {
      return 1;
    }

    let totalWeight = 0;
    for (const refCardName of uniqueReferences) {
      const refWeight = await this.calculateWeight(refCardName, new Set(visited));
      totalWeight += refWeight;
    }

    return totalWeight / uniqueReferences.length;
  }

  /**
   * 5. 获取提示
   */
  async getHints(fileCount: number): Promise<HintResult> {
    const cardNames = await this.getAllCardNames();
    const weights: WeightResult[] = [];

    for (const cardName of cardNames) {
      const weight = await this.calculateWeight(cardName);
      weights.push({ cardName, weight });
    }

    // 按权重从高到低排序
    weights.sort((a, b) => b.weight - a.weight);

    const resultCardNames = weights
      .slice(0, fileCount)
      .map(w => w.cardName);

    return {
      cardNames: resultCardNames,
      weights
    };
  }

  /**
   * 6. 获取优化建议
   */
  async getSuggestions(optimizationParam: number, maxFileCount: number): Promise<SuggestionResult> {
    const cardNames = await this.getAllCardNames();
    const values: ValueResult[] = [];

    for (const cardName of cardNames) {
      const card = await this.loadCardFromFile(cardName);
      if (card) {
        const weight = await this.calculateWeight(cardName);
        const characterCount = card.content.length;
        const value = characterCount > 0 ? weight / characterCount : 0;

        values.push({
          cardName,
          value,
          weight,
          characterCount
        });
      }
    }

    // 筛选价值小于优化参数的卡片
    const lowValueCards = values.filter(v => v.value < optimizationParam);

    // 按价值从低到高排序
    lowValueCards.sort((a, b) => a.value - b.value);

    const resultCardNames = lowValueCards
      .slice(0, maxFileCount)
      .map(v => v.cardName);

    return {
      cardNames: resultCardNames,
      values: lowValueCards
    };
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cardCache.clear();
  }

  /**
   * 获取卡片统计信息
   */
  async getStats(): Promise<{
    totalCards: number;
    totalCharacters: number;
    averageCardSize: number;
    lastUpdated: Date | null;
  }> {
    const cardNames = await this.getAllCardNames();
    let totalCharacters = 0;
    let lastUpdated: Date | null = null;

    for (const cardName of cardNames) {
      const card = await this.loadCardFromFile(cardName);
      if (card) {
        totalCharacters += card.content.length;
        if (!lastUpdated || card.updatedAt > lastUpdated) {
          lastUpdated = card.updatedAt;
        }
      }
    }

    return {
      totalCards: cardNames.length,
      totalCharacters,
      averageCardSize: cardNames.length > 0 ? totalCharacters / cardNames.length : 0,
      lastUpdated
    };
  }
}
