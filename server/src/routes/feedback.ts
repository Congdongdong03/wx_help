import { Router, Request } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth";

// 扩展Request类型以包含user属性
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    openid?: string;
  };
}

const router = Router();
const prisma = new PrismaClient();

// 提交反馈
router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { content, imageUrl, type = "advice" } = req.body;
    const userId = req.user?.id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        code: 1,
        error: "反馈内容不能为空",
      });
    }

    // 验证反馈类型
    const validTypes = ["advice", "bug", "report"];
    const feedbackType = validTypes.includes(type) ? type : "advice";

    const feedback = await prisma.feedback.create({
      data: {
        user_id: userId!,
        content: content.trim(),
        image: imageUrl || null,
        type: feedbackType as any,
        status: 0, // 默认未处理
      },
      include: {
        users: {
          select: {
            id: true,
            nickname: true,
            username: true,
            created_at: true,
          },
        },
      },
    });

    res.json({
      success: true,
      code: 0,
      data: feedback,
      message: "反馈提交成功，我们会尽快查看～",
    });
  } catch (error) {
    console.error("提交反馈失败:", error);
    res.status(500).json({
      success: false,
      code: 1,
      error: "提交反馈失败",
    });
  }
});

// 举报帖子
router.post("/report", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { postId, reason, description } = req.body;
    const userId = req.user?.id;

    if (!postId || !reason || !description) {
      return res.status(400).json({
        success: false,
        code: 1,
        error: "举报信息不完整",
      });
    }

    // 检查帖子是否存在
    const post = await prisma.posts.findUnique({
      where: { id: parseInt(postId) },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        code: 1,
        error: "帖子不存在",
      });
    }

    const feedback = await prisma.feedback.create({
      data: {
        user_id: userId!,
        content: `举报帖子ID: ${postId}\n举报原因: ${reason}\n详细描述: ${description}`,
        type: "report",
        status: 0,
      },
      include: {
        users: {
          select: {
            id: true,
            nickname: true,
            username: true,
          },
        },
      },
    });

    res.json({
      success: true,
      code: 0,
      data: feedback,
      message: "举报提交成功",
    });
  } catch (error) {
    console.error("提交举报失败:", error);
    res.status(500).json({
      success: false,
      code: 1,
      error: "提交举报失败",
    });
  }
});

export default router;
