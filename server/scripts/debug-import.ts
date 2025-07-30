import * as fs from "fs";
import * as path from "path";

async function debugImport() {
  const sensitiveWordsDir = path.join(__dirname, "../sensitive-words");
  console.log("敏感词库目录:", sensitiveWordsDir);
  console.log("目录是否存在:", fs.existsSync(sensitiveWordsDir));

  const categoryFiles = [
    { filename: "色情类.txt", category: "porn" },
    { filename: "政治类.txt", category: "political" },
    { filename: "广告.txt", category: "advertisement" },
    { filename: "涉枪涉爆违法信息关键词.txt", category: "illegal" },
    { filename: "网址.txt", category: "url" },
  ];

  for (const { filename, category } of categoryFiles) {
    const filePath = path.join(sensitiveWordsDir, filename);
    console.log(`\n检查文件: ${filename}`);
    console.log("文件路径:", filePath);
    console.log("文件是否存在:", fs.existsSync(filePath));

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      console.log("文件总行数:", lines.length);

      const words = lines
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => line.replace(/,$/, "")); // 移除末尾的逗号

      console.log("处理后词数:", words.length);
      console.log("前5个词:", words.slice(0, 5));
    }
  }
}

debugImport();
