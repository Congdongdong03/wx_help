import { sensitiveWordService } from "../src/services/sensitiveWordService";

async function testSensitiveWords() {
  try {
    console.log("开始测试敏感词检测功能...\n");

    // 初始化敏感词库
    await sensitiveWordService.initialize();

    // 测试用例
    const testCases = [
      {
        text: "这是一个正常的帖子标题",
        expected: false,
        description: "正常文本",
      },
      {
        text: "我想买一个按摩棒",
        expected: true,
        description: "包含色情类敏感词",
      },
      {
        text: "关于习近平的新闻",
        expected: true,
        description: "包含政治类敏感词",
      },
      {
        text: "招聘兼职工作",
        expected: true,
        description: "包含广告类敏感词",
      },
      {
        text: "访问网站 www.example.com",
        expected: true,
        description: "包含网址类敏感词",
      },
      {
        text: "这是一个包含多个敏感词的帖子：按摩棒、招聘、习近平",
        expected: true,
        description: "包含多个分类的敏感词",
      },
    ];

    for (const testCase of testCases) {
      console.log(`测试: ${testCase.description}`);
      console.log(`文本: "${testCase.text}"`);

      const result = await sensitiveWordService.checkSensitiveWords(
        testCase.text
      );

      console.log(
        `检测结果: ${result.hasSensitiveWords ? "包含敏感词" : "正常"}`
      );
      if (result.hasSensitiveWords) {
        console.log(`命中的敏感词: ${result.matchedWords.join(", ")}`);
        console.log(`敏感词分类: ${result.categories.join(", ")}`);
      }
      console.log(`预期结果: ${testCase.expected ? "包含敏感词" : "正常"}`);
      console.log(
        `测试${
          result.hasSensitiveWords === testCase.expected ? "通过" : "失败"
        }`
      );
      console.log("---\n");
    }

    console.log("敏感词检测功能测试完成！");
    process.exit(0);
  } catch (error) {
    console.error("测试失败:", error);
    process.exit(1);
  }
}

testSensitiveWords();
