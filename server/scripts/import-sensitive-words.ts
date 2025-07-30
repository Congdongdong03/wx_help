import { sensitiveWordService } from "../src/services/sensitiveWordService";

async function importSensitiveWords() {
  try {
    console.log("开始导入敏感词库...");
    await sensitiveWordService.importFromFiles();
    console.log("敏感词库导入完成！");

    // 显示统计信息
    console.log("\n正在获取统计信息...");
    const categories = await sensitiveWordService.getCategories();
    console.log("导入的敏感词分类:", categories);

    for (const category of categories) {
      const words = await sensitiveWordService.getWordsByCategory(category);
      console.log(`- ${category}: ${words.length} 个词`);
    }

    console.log("\n导入完成！");
    process.exit(0);
  } catch (error) {
    console.error("导入敏感词库失败:", error);
    process.exit(1);
  }
}

importSensitiveWords();
