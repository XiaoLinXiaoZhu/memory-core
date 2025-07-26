import fs from 'fs-extra';
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
  ExtractRange,
  ZettelkastenError,
  ZettelkastenErrorType
} from '../types/index.js';

/**
 * Zettelkasten 记忆片段盒管理器
 * 基于文件系统的记忆片段存储和管理系统
 */
export class ZettelkastenManager {
  private config: Required<ZettelkastenConfig>;
  private cardCache: Map<string, CardContent> = new Map();
  private weightCache: Map<string, number> = new Map();
  private fileLastModified: Map<string, number> = new Map();
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
        await fs.ensureDir(this.config.storageDir);
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
   * 验证记忆片段名称
   */
  private validateCardName(cardName: string): void {
    if (!cardName || cardName.trim() === '') {
      throw new ZettelkastenError(
        ZettelkastenErrorType.INVALID_CARD_NAME,
        'Card name cannot be empty'
      );
    }

    // 检查文件名是否包含非法字符（移除了 / 以支持子目录）
    const invalidChars = /[<>:"|\\?*]/;
    if (invalidChars.test(cardName)) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.INVALID_CARD_NAME,
        `Card name contains invalid characters: ${cardName}`
      );
    }

    // 验证路径中不能有相对路径操作
    if (cardName.includes('..') || cardName.includes('./') || cardName.startsWith('/')) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.INVALID_CARD_NAME,
        `Card name cannot contain relative path operations or start with /: ${cardName}`
      );
    }
  }

  /**
   * 获取记忆片段文件路径（支持嵌套目录）
   */
  private getCardFilePath(cardName: string): string {
    // 将 / 转换为系统路径分隔符，支持嵌套目录
    const normalizedCardName = cardName.replace(/\//g, path.sep);
    const filePath = path.join(this.config.storageDir, `${normalizedCardName}.md`);
    return path.normalize(filePath);
  }

  /**
   * 检查记忆片段是否存在
   */
  private async cardExists(cardName: string): Promise<boolean> {
    const filePath = this.getCardFilePath(cardName);
    return await fs.pathExists(filePath);
  }

  /**
   * 从文件加载记忆片段内容
   */
  private async loadCardFromFile(cardName: string): Promise<CardContent | null> {
    const filePath = this.getCardFilePath(cardName);
    
    try {
      if (!(await fs.pathExists(filePath))) {
        return null;
      }

      const content = await fs.readFile(filePath, this.config.encoding);
      const stats = await fs.stat(filePath);

      // 更新文件修改时间记录
      this.fileLastModified.set(cardName, stats.mtime.getTime());

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
   * 保存记忆片段到文件
   */
  private async saveCardToFile(card: CardContent): Promise<void> {
    const filePath = this.getCardFilePath(card.name);
    
    try {
      // 确保目录存在
      await fs.ensureDir(path.dirname(filePath));
      
      await fs.outputFile(filePath, card.content, this.config.encoding);
      
      // 更新缓存
      const updatedCard = { ...card, updatedAt: new Date() };
      this.cardCache.set(card.name, updatedCard);
      
      // 更新文件修改时间记录
      this.fileLastModified.set(card.name, updatedCard.updatedAt.getTime());
      
      // 清除所有权重缓存（因为任何文件的修改都可能影响权重计算）
      this.invalidateAllWeights();
    } catch (error) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.STORAGE_ERROR,
        `Failed to save card ${card.name}: ${error}`,
        error
      );
    }
  }

  /**
   * 解析记忆片段中的链接引用
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
   * 展开记忆片段内容中的引用
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

    // 查找所有需要展开的引用 [[cardName]]，但排除已经是 start/end 标记的
    let match;
    const expandPattern = /\[\[([^\]]+)\]\]/g;
    while ((match = expandPattern.exec(content)) !== null) {
      const cardName = match[1].trim();
      
      // 跳过已经展开的标记
      if (content.includes(`![[${cardName}]]start`) || content.includes(`![[${cardName}]]end`)) {
        continue;
      }
      
      expandMatches.push({
        cardName,
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

        // 递归展开引用的记忆片段内容
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

    // 分析引用并创建占位文件
    await this.createPlaceholderCards(content);
  }

  /**
   * 分析内容中的引用并为不存在的记忆片段创建占位文件
   */
  private async createPlaceholderCards(content: string): Promise<void> {
    const references = this.parseCardReferences(content);
    const uniqueReferences = [...new Set(references.map(ref => ref.cardName))];

    for (const refCardName of uniqueReferences) {
      try {
        this.validateCardName(refCardName);
        const exists = await this.cardExists(refCardName);
        
        if (!exists) {
          // 创建空的占位文件
          const placeholderContent = `# ${refCardName}\n\n<!-- 这是一个自动创建的占位记忆片段 -->\n`;
          const now = new Date();
          
          const placeholderCard: CardContent = {
            name: refCardName,
            content: placeholderContent,
            createdAt: now,
            updatedAt: now
          };

          await this.saveCardToFile(placeholderCard);
        }
      } catch (error) {
        // 忽略无效的记忆片段名称，继续处理其他引用
        console.warn(`Failed to create placeholder for ${refCardName}:`, error);
      }
    }
  }

  /**
   * 3. 删除文件内容
   */
  async deleteContent(cardName: string): Promise<void> {
    this.validateCardName(cardName);

    const filePath = this.getCardFilePath(cardName);
    
    try {
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        this.cardCache.delete(cardName);
        this.fileLastModified.delete(cardName);
        
        // 清除所有权重缓存
        this.invalidateAllWeights();
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

    // 删除旧记忆片段
    await this.deleteContent(oldCardName);

    // 更新所有引用
    await this.updateAllReferences(oldCardName, newCardName);
  }

  /**
   * 更新所有记忆片段中的引用（支持嵌套目录）
   */
  private async updateAllReferences(oldCardName: string, newCardName: string): Promise<void> {
    try {
      const cardNames = await this.getAllCardNames();

      for (const cardName of cardNames) {
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
   * 递归获取所有记忆片段名称（支持嵌套目录）
   */
  async getAllCardNames(): Promise<string[]> {
    try {
      const cardNames: string[] = [];
      await this.scanDirectory(this.config.storageDir, this.config.storageDir, cardNames);
      return cardNames;
    } catch (error) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.STORAGE_ERROR,
        `Failed to get card names: ${error}`,
        error
      );
    }
  }

  /**
   * 递归扫描目录，收集所有 .md 文件
   */
  private async scanDirectory(
    currentDir: string, 
    baseDir: string, 
    cardNames: string[]
  ): Promise<void> {
    const items = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      
      if (item.isDirectory()) {
        // 递归扫描子目录
        await this.scanDirectory(fullPath, baseDir, cardNames);
      } else if (item.isFile() && item.name.endsWith('.md')) {
        // 计算相对于基础目录的路径作为记忆片段名
        const relativePath = path.relative(baseDir, fullPath);
        const cardName = relativePath.replace(/\.md$/, '').replace(/\\/g, '/');
        cardNames.push(cardName);
      }
    }
  }

  /**
   * 清除所有权重缓存
   */
  private invalidateAllWeights(): void {
    this.weightCache.clear();
  }

  /**
   * 获取缓存的权重
   */
  private getCachedWeight(cardName: string): number | null {
    return this.weightCache.get(cardName) ?? null;
  }

  /**
   * 设置权重缓存
   */
  private setCachedWeight(cardName: string, weight: number): void {
    this.weightCache.set(cardName, weight);
  }

  /**
   * 递归计算记忆片段权重
   * 新算法：当前记忆片段权重 = 其子记忆片段所有权重之和，如果没有子记忆片段，权重为0
   */
  private async calculateWeight(
    cardName: string,
    visited: Set<string> = new Set()
  ): Promise<number> {
    // 检查缓存
    const cachedWeight = this.getCachedWeight(cardName);
    if (cachedWeight !== null) {
      return cachedWeight;
    }

    // 防止循环引用
    if (visited.has(cardName)) {
      return 0;
    }

    const card = await this.loadCardFromFile(cardName);
    if (!card) {
      this.setCachedWeight(cardName, 0);
      return 0;
    }

    const references = this.parseCardReferences(card.content);
    const uniqueReferences = [...new Set(references.map(ref => ref.cardName))];

    // 如果没有引用，权重为0
    if (uniqueReferences.length === 0) {
      this.setCachedWeight(cardName, 0);
      return 0;
    }

    const newVisited = new Set(visited);
    newVisited.add(cardName);

    let totalWeight = 0;
    for (const refCardName of uniqueReferences) {
      const refWeight = await this.calculateWeight(refCardName, newVisited);
      totalWeight += refWeight + 1; // 子记忆片段权重 + 1（代表引用本身的权重）
    }

    // 缓存计算结果
    this.setCachedWeight(cardName, totalWeight);
    return totalWeight;
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
        
        // 新的价值计算公式: f(x) = ((100) / (1 + e^(-0.07x + 1))) / 字符数
        // 其中 x 是权重
        const sigmoidValue = 100 / (1 + Math.exp(-0.07 * weight + 1));
        const value = characterCount > 0 ? sigmoidValue / characterCount : 0;

        values.push({
          cardName,
          value,
          weight,
          characterCount
        });
      }
    }

    // 筛选价值小于优化参数的记忆片段
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
    this.weightCache.clear();
    this.fileLastModified.clear();
  }

  /**
   * 获取记忆片段统计信息
   */
  /**
   * 内容提取功能 - 支持精确范围定位
   * 支持通过行号和正则表达式精确定位内容范围
   */
  async extractContent(
    sourceCardName: string, 
    targetCardName: string, 
    range?: ExtractRange
  ): Promise<void> {
    this.validateCardName(sourceCardName);
    this.validateCardName(targetCardName);

    if (!range) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.INVALID_CONFIG,
        'Extract range is required. If you want to rename a file, please use renameContent method.'
      );
    }

    const sourceCard = await this.loadCardFromFile(sourceCardName);
    if (!sourceCard) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.CARD_NOT_FOUND,
        `Source card not found: ${sourceCardName}`
      );
    }

    const lines = sourceCard.content.split('\n');
    

    // 查找开始位置
    let startIndex: number | null = 0;
    if (range.start) {
      if (range.start.line !== undefined) {
        startIndex = Math.max(0, range.start.line - 1); // 转换为0-based
      }
      if (range.start.regex) {
        const regex = new RegExp(range.start.regex.replace(/^\/|\/$/g, ''));
        let found = false;
        for (let i = startIndex ?? 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            startIndex = i;
            found = true;
            break;
          }
        }
        if (!found) {
          throw new ZettelkastenError(
            ZettelkastenErrorType.INVALID_CONFIG,
            'Start regex did not match any line in the source card.'
          );
        }
      }
    }

    // 查找结束位置
    let endIndex: number | null = lines.length - 1;
    if (range.end) {
      if (range.end.line !== undefined) {
        endIndex = Math.min(lines.length - 1, range.end.line - 1); // 转换为0-based
      }
      if (range.end.regex) {
        const regex = new RegExp(range.end.regex.replace(/^\/|\/$/g, ''));
        let found = false;
        for (let i = endIndex ?? (lines.length - 1); i >= (startIndex ?? 0); i--) {
          if (regex.test(lines[i])) {
            endIndex = i - 1; // 不包含匹配行本身
            found = true;
            break;
          }
        }
        if (!found) {
          throw new ZettelkastenError(
            ZettelkastenErrorType.INVALID_CONFIG,
            'End regex did not match any line in the source card.'
          );
        }
      }
    }


    if (startIndex === null || endIndex === null || startIndex > endIndex) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.INVALID_CONFIG,
        'Invalid range: start position is after end position or not matched.'
      );
    }

    // 提取内容
    const extractedLines = lines.slice(startIndex, endIndex + 1);
    const extractedContent = extractedLines.join('\n');

    if (!extractedContent.trim()) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.INVALID_CONFIG,
        'No content found in the specified range'
      );
    }

    // 检查目标记忆片段是否已存在
    const targetCard = await this.loadCardFromFile(targetCardName);
    let finalContent = extractedContent;
    
    if (targetCard) {
      // 如果目标记忆片段存在，将新内容追加到现有内容中
      finalContent = `${targetCard.content}\n\n---\n\n${extractedContent}`;
    }

    // 创建或更新目标记忆片段
    await this.setContent(targetCardName, finalContent);

    // 在源记忆片段中替换提取的内容为链接
    const beforeLines = lines.slice(0, startIndex);
    const afterLines = lines.slice(endIndex + 1);
    const newSourceLines = [...beforeLines, `[[${targetCardName}]]`, ...afterLines];
    const newSourceContent = newSourceLines.join('\n');
    
    await this.setContent(sourceCardName, newSourceContent);
  }

  /**
   * 在指定位置插入链接
   */
  async insertLinkAt(
    sourceCardName: string, 
    targetCardName: string, 
    linePosition?: number, 
    anchorText?: string
  ): Promise<void> {
    this.validateCardName(sourceCardName);
    this.validateCardName(targetCardName);

    const sourceCard = await this.loadCardFromFile(sourceCardName);
    if (!sourceCard) {
      throw new ZettelkastenError(
        ZettelkastenErrorType.CARD_NOT_FOUND,
        `Source card not found: ${sourceCardName}`
      );
    }

    // 构建链接文本
    const linkText = anchorText ? `${anchorText} [[${targetCardName}]]` : `[[${targetCardName}]]`;
    
    const lines = sourceCard.content.split('\n');
    
    // 处理行位置
    let insertPosition: number;
    if (linePosition === undefined || linePosition === 0) {
      // 默认添加到文件末尾
      insertPosition = lines.length;
    } else if (linePosition < 0) {
      // 负数表示从文件末尾开始计数
      insertPosition = Math.max(0, lines.length + linePosition + 1);
    } else {
      // 正数表示从文件开头开始计数（1-based）
      insertPosition = Math.min(linePosition, lines.length);
    }

    // 插入链接
    lines.splice(insertPosition, 0, linkText);
    
    const newContent = lines.join('\n');
    await this.setContent(sourceCardName, newContent);

    // 确保目标记忆片段存在（创建占位符如果不存在）
    if (!(await this.cardExists(targetCardName))) {
      const placeholderContent = `# ${targetCardName}\n\n<!-- 这是一个自动创建的占位记忆片段 -->\n`;
      await this.setContent(targetCardName, placeholderContent);
    }
  }

  /**
   * 获取指定记忆片段的所有反向链接
   */
  async getBacklinks(cardName: string): Promise<string[]> {
    this.validateCardName(cardName);

    const allCardNames = await this.getAllCardNames();
    const backlinks: string[] = [];

    for (const otherCardName of allCardNames) {
      if (otherCardName === cardName) continue;

      const otherCard = await this.loadCardFromFile(otherCardName);
      if (otherCard) {
        const references = this.parseCardReferences(otherCard.content);
        const hasReference = references.some(ref => ref.cardName === cardName);
        
        if (hasReference) {
          backlinks.push(otherCardName);
        }
      }
    }

    return backlinks;
  }

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
