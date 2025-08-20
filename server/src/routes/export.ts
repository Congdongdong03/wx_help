import express from "express";
import { requireAuth } from "../middleware/auth";
import { exportService } from "../services/exportService";

const router = express.Router();

// 获取导出信息
router.get("/info", requireAuth, async (req, res) => {
  try {
    const info = await exportService.getExportInfo();
    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    console.error("获取导出信息失败:", error);
    res.status(500).json({
      success: false,
      error: "获取导出信息失败",
    });
  }
});

// 导出用户数据
router.post("/users", requireAuth, async (req, res) => {
  try {
    const { format = "csv", dateRange, filters } = req.body;

    const options = {
      format: format as "csv" | "excel",
      dateRange: dateRange
        ? {
            start: new Date(dateRange.start),
            end: new Date(dateRange.end),
          }
        : undefined,
      filters,
    };

    const csvContent = await exportService.exportUsers(options);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="users_${
        new Date().toISOString().split("T")[0]
      }.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    console.error("导出用户数据失败:", error);
    res.status(500).json({
      success: false,
      error: "导出用户数据失败",
    });
  }
});

// 导出帖子数据
router.post("/posts", requireAuth, async (req, res) => {
  try {
    const { format = "csv", dateRange, filters } = req.body;

    const options = {
      format: format as "csv" | "excel",
      dateRange: dateRange
        ? {
            start: new Date(dateRange.start),
            end: new Date(dateRange.end),
          }
        : undefined,
      filters,
    };

    const csvContent = await exportService.exportPosts(options);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="posts_${
        new Date().toISOString().split("T")[0]
      }.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    console.error("导出帖子数据失败:", error);
    res.status(500).json({
      success: false,
      error: "导出帖子数据失败",
    });
  }
});

// 导出反馈数据
router.post("/feedback", requireAuth, async (req, res) => {
  try {
    const { format = "csv", dateRange } = req.body;

    const options = {
      format: format as "csv" | "excel",
      dateRange: dateRange
        ? {
            start: new Date(dateRange.start),
            end: new Date(dateRange.end),
          }
        : undefined,
    };

    const csvContent = await exportService.exportFeedback(options);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="feedback_${
        new Date().toISOString().split("T")[0]
      }.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    console.error("导出反馈数据失败:", error);
    res.status(500).json({
      success: false,
      error: "导出反馈数据失败",
    });
  }
});

// 导出统计数据
router.post("/statistics", requireAuth, async (req, res) => {
  try {
    const { format = "csv", dateRange } = req.body;

    const options = {
      format: format as "csv" | "excel",
      dateRange: dateRange
        ? {
            start: new Date(dateRange.start),
            end: new Date(dateRange.end),
          }
        : undefined,
    };

    const csvContent = await exportService.exportStatistics(options);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="statistics_${
        new Date().toISOString().split("T")[0]
      }.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    console.error("导出统计数据失败:", error);
    res.status(500).json({
      success: false,
      error: "导出统计数据失败",
    });
  }
});

export default router;
