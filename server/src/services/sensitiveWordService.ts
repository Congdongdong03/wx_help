import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

export interface SensitiveWordResult {
  hasSensitiveWords: boolean;
  matchedWords: string[];
  categories: string[];
}

export class SensitiveWordService {
  private sensitiveWords: Map<string, string[]> = new Map(); // category -> words[]
  private isInitialized = false;

  /**
   * 初始化敏感词库
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 从数据库加载敏感词
      const wordsFromDB = await prisma.sensitive_word.findMany({
        select: {
          word: true,
          category: true,
        },
      });

      // 按分类组织词库
      wordsFromDB.forEach((item: { word: string; category: string }) => {
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
   * 从文件导入敏感词到数据库
   */
  async importFromFiles(): Promise<void> {
    const sensitiveWordsDir = path.join(__dirname, "../../sensitive-words");

    const categoryFiles = [
      { filename: "色情类.txt", category: "porn" },
      { filename: "政治类.txt", category: "political" },
      { filename: "广告.txt", category: "advertisement" },
      // { filename: "涉枪涉爆违法信息关键词.txt", category: "illegal" }, // 跳过有编码问题的文件
      { filename: "网址.txt", category: "url" },
    ];

    for (const { filename, category } of categoryFiles) {
      const filePath = path.join(sensitiveWordsDir, filename);

      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          const words = content
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .map((line) => line.replace(/,$/, "")) // 移除末尾的逗号
            .filter((word) => word.length > 0 && !word.includes("\x00")); // 过滤掉空词和包含null字符的词

          console.log(`导入 ${category} 分类，共 ${words.length} 个词`);

          // 批量插入到数据库
          let successCount = 0;
          for (const word of words) {
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
              successCount++;
            } catch (error) {
              console.error(`插入敏感词失败: ${word}`, error);
            }
          }
          console.log(`成功导入 ${successCount} 个词到 ${category} 分类`);
        } catch (error) {
          console.error(`处理文件 ${filename} 失败:`, error);
        }
      } else {
        console.log(`文件不存在: ${filename}`);
      }
    }

    console.log("敏感词库导入完成");
  }

  /**
   * 添加单个敏感词
   */
  async addSensitiveWord(word: string, category: string): Promise<void> {
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
  }

  /**
   * 删除敏感词
   */
  async removeSensitiveWord(word: string, category: string): Promise<void> {
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
  }

  /**
   * 获取所有敏感词分类
   */
  async getCategories(): Promise<string[]> {
    const categories = await prisma.sensitive_word.groupBy({
      by: ["category"],
    });
    return categories.map((c: { category: string }) => c.category);
  }

  /**
   * 获取指定分类的敏感词
   */
  async getWordsByCategory(category: string): Promise<string[]> {
    const words = await prisma.sensitive_word.findMany({
      where: { category },
      select: { word: true },
    });
    return words.map((w: { word: string }) => w.word);
  }
}

// 创建单例实例
export const sensitiveWordService = new SensitiveWordService();
