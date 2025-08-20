import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface SensitiveWordResult {
  hasSensitiveWords: boolean;
  matchedWords: string[];
  categories: string[];
}

export class SensitiveWordService {
  private sensitiveWords: Map<string, string[]> = new Map();
  private isInitialized = false;

  /**
   * 初始化敏感词库
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const wordsFromDB = await prisma.sensitive_word.findMany({
        select: { word: true, category: true },
      });

      // 按分类组织词库
      wordsFromDB.forEach((item) => {
        if (!this.sensitiveWords.has(item.category)) {
          this.sensitiveWords.set(item.category, []);
        }
        this.sensitiveWords.get(item.category)!.push(item.word);
      });

      this.isInitialized = true;
      console.log("敏感词库初始化完成，共加载", wordsFromDB.length, "个敏感词");
    } catch (error) {
      console.error("初始化敏感词库失败:", error);
      throw error;
    }
  }

  /**
   * 检查文本是否包含敏感词
   */
  async checkSensitiveWords(text: string): Promise<SensitiveWordResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const matchedWords: string[] = [];
    const categories: string[] = [];

    // 遍历所有分类的敏感词
    for (const [category, words] of this.sensitiveWords) {
      for (const word of words) {
        if (text.includes(word)) {
          matchedWords.push(word);
          if (!categories.includes(category)) {
            categories.push(category);
          }
        }
      }
    }

    return {
      hasSensitiveWords: matchedWords.length > 0,
      matchedWords,
      categories,
    };
  }

  /**
   * 添加敏感词
   */
  async addSensitiveWord(word: string, category: string): Promise<void> {
    try {
      await prisma.sensitive_word.upsert({
        where: { word_category: { word, category } },
        update: {},
        create: {
          word,
          category,
          createdAt: new Date(),
        },
      });

      // 更新内存中的词库
      if (!this.sensitiveWords.has(category)) {
        this.sensitiveWords.set(category, []);
      }
      if (!this.sensitiveWords.get(category)!.includes(word)) {
        this.sensitiveWords.get(category)!.push(word);
      }
    } catch (error) {
      console.error("添加敏感词失败:", error);
      throw error;
    }
  }

  /**
   * 删除敏感词
   */
  async removeSensitiveWord(word: string, category: string): Promise<void> {
    try {
      await prisma.sensitive_word.delete({
        where: { word_category: { word, category } },
      });

      // 更新内存中的词库
      const words = this.sensitiveWords.get(category);
      if (words) {
        const index = words.indexOf(word);
        if (index > -1) {
          words.splice(index, 1);
        }
      }
    } catch (error) {
      console.error("删除敏感词失败:", error);
      throw error;
    }
  }
}

export const sensitiveWordService = new SensitiveWordService();
