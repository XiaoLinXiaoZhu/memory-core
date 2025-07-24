/**
 * 卡片内容接口
 */
export interface CardContent {
  /** 卡片名称 */
  name: string;
  /** 卡片内容 */
  content: string;
  /** 创建时间 */
  createdAt: Date;
  /** 最后修改时间 */
  updatedAt: Date;
}

/**
 * 卡片引用接口
 */
export interface CardReference {
  /** 引用的卡片名称 */
  cardName: string;
  /** 在当前卡片中的位置（字符索引） */
  position: number;
}

/**
 * 权重计算结果接口
 */
export interface WeightResult {
  /** 卡片名称 */
  cardName: string;
  /** 权重值 */
  weight: number;
}

/**
 * 价值计算结果接口
 */
export interface ValueResult {
  /** 卡片名称 */
  cardName: string;
  /** 价值值 */
  value: number;
  /** 权重 */
  weight: number;
  /** 字符数 */
  characterCount: number;
}

/**
 * 提示结果接口
 */
export interface HintResult {
  /** 卡片名称列表，按权重从高到低排序 */
  cardNames: string[];
  /** 权重详情 */
  weights: WeightResult[];
}

/**
 * 优化建议结果接口
 */
export interface SuggestionResult {
  /** 建议优化的卡片名称列表，按价值从低到高排序 */
  cardNames: string[];
  /** 价值详情 */
  values: ValueResult[];
}

/**
 * Zettelkasten 管理器配置接口
 */
export interface ZettelkastenConfig {
  /** 存储目录路径 */
  storageDir: string;
  /** 文件编码，默认为 'utf-8' */
  encoding?: 'utf8' | 'utf-8' | 'ascii' | 'base64' | 'hex';
  /** 是否自动创建存储目录，默认为 true */
  autoCreateDir?: boolean;
}

/**
 * 展开选项接口
 */
export interface ExpandOptions {
  /** 展开深度，默认为 1 */
  depth?: number;
  /** 最大展开深度，防止循环引用，默认为 10 */
  maxDepth?: number;
  /** 已展开的卡片集合，用于防止循环引用 */
  expandedCards?: Set<string>;
}

/**
 * 提取范围定位接口
 */
export interface ExtractRange {
  /** 开始位置 */
  start?: {
    /** 起始行号（1-based），如果不提供则从文件开头开始 */
    line?: number;
    /** 正则表达式匹配，从指定行号开始搜索匹配的内容 */
    regex?: string;
  };
  /** 结束位置 */
  end?: {
    /** 结束行号（1-based），如果不提供则从文件结尾开始 */
    line?: number;
    /** 正则表达式匹配，从指定行号开始倒过来搜索匹配的内容 */
    regex?: string;
  };
}

/**
 * 错误类型枚举
 */
export enum ZettelkastenErrorType {
  CARD_NOT_FOUND = 'CARD_NOT_FOUND',
  INVALID_CARD_NAME = 'INVALID_CARD_NAME',
  STORAGE_ERROR = 'STORAGE_ERROR',
  CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE',
  INVALID_CONFIG = 'INVALID_CONFIG'
}

/**
 * Zettelkasten 错误类
 */
export class ZettelkastenError extends Error {
  constructor(
    public type: ZettelkastenErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ZettelkastenError';
  }
}
