const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// 数据库文件路径
const dbPath = path.join(__dirname, "../prisma/wx_help.sqlite");

// 创建数据库连接
const db = new sqlite3.Database(dbPath);

async function createAllTestData() {
  return new Promise((resolve, reject) => {
    console.log("开始为所有表创建测试数据...\n");

    let userId, postId, conversationId;
    const timestamp = Date.now();

    // 开始事务
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // 1. 创建管理员用户
      console.log("创建管理员用户...");
      db.run(
        "INSERT INTO admin_user (username, password_hash, role) VALUES (?, ?, ?)",
        [`admin_test_${timestamp}`, "hashed_password_123", "admin"],
        function (err) {
          if (err) {
            console.error("❌ 管理员用户创建失败:", err.message);
          } else {
            console.log("✅ 管理员用户创建成功, ID:", this.lastID);
          }
        }
      );

      // 2. 创建分类
      console.log("创建分类...");
      db.run(
        "INSERT INTO category (name, code) VALUES (?, ?)",
        [`测试分类_${timestamp}`, `test_category_${timestamp}`],
        function (err) {
          if (err) {
            console.error("❌ 分类创建失败:", err.message);
          } else {
            console.log("✅ 分类创建成功, ID:", this.lastID);
          }
        }
      );

      // 3. 创建城市
      console.log("创建城市...");
      db.run(
        "INSERT INTO cities (name, code, is_hot, sort_order, is_active) VALUES (?, ?, ?, ?, ?)",
        [`悉尼_${timestamp}`, `SYD_${timestamp}`, 1, 1, 1],
        function (err) {
          if (err) {
            console.error("❌ 城市创建失败:", err.message);
          } else {
            console.log("✅ 城市创建成功, ID:", this.lastID);
          }
        }
      );

      // 4. 创建用户
      console.log("创建用户...");
      db.run(
        `INSERT INTO users (
          username, openid, unionid, session_key, nickname, avatar_url, 
          phone, email, gender, city, province, country, language, status, last_login_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `test_user_${timestamp}`,
          `test_openid_${timestamp}`,
          `test_unionid_${timestamp}`,
          `test_session_key_${timestamp}`,
          "测试用户",
          "https://example.com/avatar.jpg",
          "0412345678",
          "test@example.com",
          1,
          "悉尼",
          "新南威尔士",
          "澳大利亚",
          "zh_CN",
          "active",
          new Date().toISOString(),
        ],
        function (err) {
          if (err) {
            console.error("❌ 用户创建失败:", err.message);
          } else {
            userId = this.lastID;
            console.log("✅ 用户创建成功, ID:", userId);

            // 5. 创建帖子（需要用户ID）
            console.log("创建帖子...");
            db.run(
              `INSERT INTO posts (
                user_id, title, content, contact_info, images, category, sub_category,
                city_code, price, price_unit, status, view_count, favorite_count,
                recommend_score, quality_score, is_pinned
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                userId,
                "测试帖子标题",
                "这是一个测试帖子的内容，用于验证数据库功能。",
                "微信: test123",
                "image1.jpg,image2.jpg",
                "help",
                "general",
                "SYD",
                "100",
                "澳元",
                "published",
                10,
                2,
                "8.5",
                "9.0",
                0,
              ],
              function (err) {
                if (err) {
                  console.error("❌ 帖子创建失败:", err.message);
                } else {
                  postId = this.lastID;
                  console.log("✅ 帖子创建成功, ID:", postId);

                  // 6. 创建收藏（需要用户ID和帖子ID）
                  console.log("创建收藏...");
                  db.run(
                    "INSERT INTO favorite (user_id, post_id) VALUES (?, ?)",
                    [userId, postId],
                    function (err) {
                      if (err) {
                        console.error("❌ 收藏创建失败:", err.message);
                      } else {
                        console.log("✅ 收藏创建成功, ID:", this.lastID);
                      }
                    }
                  );

                  // 7. 创建反馈（需要用户ID）
                  console.log("创建反馈...");
                  db.run(
                    "INSERT INTO feedback (user_id, content, image, type, status) VALUES (?, ?, ?, ?, ?)",
                    [
                      userId,
                      "这是一个测试反馈内容",
                      "feedback_image.jpg",
                      "advice",
                      0,
                    ],
                    function (err) {
                      if (err) {
                        console.error("❌ 反馈创建失败:", err.message);
                      } else {
                        console.log("✅ 反馈创建成功, ID:", this.lastID);
                      }
                    }
                  );

                  // 8. 创建擦亮日志（需要用户ID和帖子ID）
                  console.log("创建擦亮日志...");
                  db.run(
                    "INSERT INTO polish_log (user_id, post_id) VALUES (?, ?)",
                    [userId, postId],
                    function (err) {
                      if (err) {
                        console.error("❌ 擦亮日志创建失败:", err.message);
                      } else {
                        console.log("✅ 擦亮日志创建成功, ID:", this.lastID);
                      }
                    }
                  );

                  // 9. 创建对话（需要帖子ID）
                  console.log("创建对话...");
                  conversationId = "conv_" + timestamp;
                  db.run(
                    "INSERT INTO Conversation (id, postId, participant1Id, participant2Id, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
                    [
                      conversationId,
                      postId,
                      userId.toString(),
                      "2",
                      new Date().toISOString(),
                      new Date().toISOString(),
                    ],
                    function (err) {
                      if (err) {
                        console.error("❌ 对话创建失败:", err.message);
                      } else {
                        console.log("✅ 对话创建成功, ID:", conversationId);

                        // 10. 创建消息（需要对话ID）
                        console.log("创建消息...");
                        db.run(
                          "INSERT INTO Message (id, conversationId, senderId, receiverId, type, content, isRead) VALUES (?, ?, ?, ?, ?, ?, ?)",
                          [
                            "msg_" + timestamp,
                            conversationId,
                            userId.toString(),
                            "2",
                            "text",
                            "这是一条测试消息",
                            0,
                          ],
                          function (err) {
                            if (err) {
                              console.error("❌ 消息创建失败:", err.message);
                            } else {
                              console.log("✅ 消息创建成功, ID:", this.lastID);
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );

      // 11. 创建每周特价
      console.log("创建每周特价...");
      db.run(
        "INSERT INTO weekly_deals (title, image_url, week_start_date, is_active) VALUES (?, ?, ?, ?)",
        [
          `测试每周特价_${timestamp}`,
          "https://example.com/deal.jpg",
          new Date().toISOString(),
          1,
        ],
        function (err) {
          if (err) {
            console.error("❌ 每周特价创建失败:", err.message);
          } else {
            console.log("✅ 每周特价创建成功, ID:", this.lastID);
          }
        }
      );

      // 12. 创建目录图片
      console.log("创建目录图片...");
      db.run(
        "INSERT INTO catalogue_images (store_name, page_number, image_data, week_date) VALUES (?, ?, ?, ?)",
        [
          `Woolworths_${timestamp}`,
          1,
          "base64_encoded_image_data_here",
          new Date().toISOString(),
        ],
        function (err) {
          if (err) {
            console.error("❌ 目录图片创建失败:", err.message);
          } else {
            console.log("✅ 目录图片创建成功, ID:", this.lastID);
          }
        }
      );

      // 13. 创建数据验证规则
      console.log("创建数据验证规则...");
      db.run(
        "INSERT INTO ValidationRule (table_name, field_name, rule_type, rule_value, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [
          "posts",
          "title",
          "required",
          "true",
          new Date().toISOString(),
          new Date().toISOString(),
        ],
        function (err) {
          if (err) {
            console.error("❌ 数据验证规则创建失败:", err.message);
          } else {
            console.log("✅ 数据验证规则创建成功, ID:", this.lastID);
          }
        }
      );

      // 14. 创建系统配置
      console.log("创建系统配置...");
      db.run(
        "INSERT INTO SystemConfig (key, value, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        [
          `max_post_length_${timestamp}`,
          "1000",
          "帖子最大长度限制",
          new Date().toISOString(),
          new Date().toISOString(),
        ],
        function (err) {
          if (err) {
            console.error("❌ 系统配置创建失败:", err.message);
          } else {
            console.log("✅ 系统配置创建成功, ID:", this.lastID);
          }
        }
      );

      // 提交事务
      setTimeout(() => {
        db.run("COMMIT", function (err) {
          if (err) {
            console.error("❌ 提交事务失败:", err.message);
            reject(err);
          } else {
            console.log("\n🎉 所有测试数据创建完成！");
            console.log("\n创建的数据汇总:");
            console.log("- 管理员用户: 1条");
            console.log("- 分类: 1条");
            console.log("- 城市: 1条");
            console.log("- 用户: 1条");
            console.log("- 帖子: 1条");
            console.log("- 收藏: 1条");
            console.log("- 反馈: 1条");
            console.log("- 擦亮日志: 1条");
            console.log("- 每周特价: 1条");
            console.log("- 目录图片: 1条");
            console.log("- 数据验证规则: 1条");
            console.log("- 系统配置: 1条");
            console.log("- 对话: 1条");
            console.log("- 消息: 1条");
            resolve();
          }
        });
      }, 1000); // 等待1秒确保所有异步操作完成
    });
  });
}

// 运行脚本
createAllTestData()
  .then(() => {
    console.log("\n✅ 脚本执行完成");
    db.close();
  })
  .catch((error) => {
    console.error("❌ 脚本执行失败:", error);
    db.close();
  });
