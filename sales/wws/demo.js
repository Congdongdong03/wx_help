// simple-static-test.js - 简单的静态文件测试服务器
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// 1. 绝对路径静态文件服务
const IMAGES_PATH =
  "/Users/wesley/Desktop/帮帮/未命名文件夹/public/catalogue_images";

console.log("=== 静态文件服务器测试 ===");
console.log("图片目录路径:", IMAGES_PATH);
console.log("检查目录是否存在:", fs.existsSync(IMAGES_PATH));

// 设置静态文件服务 - 使用绝对路径
app.use(
  "/catalogue_images",
  express.static(
    "/Users/wesley/Desktop/帮帮/未命名文件夹/public/catalogue_images"
  )
);
// 2. 调试路由 - 列出所有图片文件
app.get("/debug/images", (req, res) => {
  try {
    const colesDir = path.join(IMAGES_PATH, "coles");
    console.log("Coles目录路径:", colesDir);

    if (fs.existsSync(colesDir)) {
      const files = fs.readdirSync(colesDir);
      console.log("Coles目录中的文件:", files);

      const fileList = files.map((file) => ({
        filename: file,
        url: `http://localhost:${PORT}/catalogue_images/coles/${file}`,
        size: fs.statSync(path.join(colesDir, file)).size,
      }));

      res.json({
        success: true,
        directory: colesDir,
        files: fileList,
        count: files.length,
      });
    } else {
      res.json({
        success: false,
        error: "Coles目录不存在",
        directory: colesDir,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 3. 创建测试图片的路由
app.get("/create-test-image", (req, res) => {
  try {
    const colesDir = path.join(IMAGES_PATH, "coles");

    // 确保目录存在
    if (!fs.existsSync(colesDir)) {
      fs.mkdirSync(colesDir, { recursive: true });
      console.log("已创建目录:", colesDir);
    }

    // 创建一个简单的测试文件
    const testContent = "This is a test file created by the server";
    const testFile = path.join(colesDir, "test.txt");
    fs.writeFileSync(testFile, testContent);

    res.json({
      success: true,
      message: "测试文件已创建",
      file: testFile,
      url: `http://localhost:${PORT}/catalogue_images/coles/test.txt`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 4. 主页 - 显示测试链接
app.get("/", (req, res) => {
  res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>静态文件测试</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .test-link { display: block; margin: 10px 0; padding: 10px; background: #f0f0f0; }
                .success { color: green; }
                .error { color: red; }
            </style>
        </head>
        <body>
            <h1>静态文件服务器测试</h1>
            
            <h2>测试步骤：</h2>
            <ol>
                <li><a href="/debug/images" class="test-link">查看图片列表</a></li>
                <li><a href="/create-test-image" class="test-link">创建测试文件</a></li>
                <li><a href="/catalogue_images/coles/" class="test-link">浏览Coles目录</a></li>
            </ol>
            
            <h2>如果有图片文件，测试这些链接：</h2>
            <div id="image-links">
                <p>点击"查看图片列表"获取实际的图片链接</p>
            </div>
            
            <script>
                // 自动获取图片列表
                fetch('/debug/images')
                    .then(response => response.json())
                    .then(data => {
                        const container = document.getElementById('image-links');
                        if (data.success && data.files.length > 0) {
                            container.innerHTML = '<h3>找到的图片文件：</h3>';
                            data.files.forEach(file => {
                                container.innerHTML += \`
                                    <div class="test-link">
                                        <strong>\${file.filename}</strong> (\${file.size} bytes)<br>
                                        <a href="\${file.url}" target="_blank">\${file.url}</a>
                                    </div>
                                \`;
                            });
                        } else {
                            container.innerHTML = '<p class="error">没有找到图片文件</p>';
                        }
                    })
                    .catch(error => {
                        document.getElementById('image-links').innerHTML = 
                            '<p class="error">获取图片列表失败: ' + error.message + '</p>';
                    });
            </script>
        </body>
        </html>
    `);
});

// 5. 错误处理中间件
app.use((req, res) => {
  res.status(404).send(`
        <h1>404 - 文件未找到</h1>
        <p>请求的文件: ${req.url}</p>
        <p><a href="/">返回首页</a></p>
    `);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🚀 测试服务器启动成功！`);
  console.log(`📋 访问首页: http://localhost:${PORT}`);
  console.log(`🔍 查看图片: http://localhost:${PORT}/debug/images`);
  console.log(`📁 图片目录: ${IMAGES_PATH}`);
  console.log(`\n如果看到图片，说明静态文件服务正常！\n`);
});
