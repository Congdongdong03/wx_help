import Taro from "@tarojs/taro";
import React, { useState } from "react";
import { View, Text, Textarea, Button, Image } from "@tarojs/components";
import { debounce, throttle } from "../../../utils/debounce";
import { request, uploadFile } from "../../../utils/request";
import "./index.scss";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: "q1",
    question: "如何发布信息？",
    answer:
      "在首页点击底部的发布按钮，选择对应的分类，填写信息并上传图片即可。",
  },
  {
    id: "q2",
    question: "信息审核需要多久？",
    answer: "我们会在24小时内完成审核，请耐心等待。",
  },
  {
    id: "q3",
    question: "如何避免交易被骗？",
    answer:
      "请尽量选择当面交易，核实对方身份。对于线上交易，警惕要求提前支付或向陌生账户转账的行为。",
  },
  {
    id: "q4",
    question: "信用等级是如何计算的？",
    answer: "信用等级会根据您的发帖历史、交易评价、举报情况等综合计算。",
  },
];

export default function HelpFeedbackPage() {
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackImage, setFeedbackImage] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const handleToggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleFeedbackTextChange = debounce((e) => {
    setFeedbackText(e.detail.value);
  }, 300);

  const handleChooseImage = throttle(() => {
    Taro.chooseImage({
      count: 1,
      sizeType: ["original", "compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        setFeedbackImage(res.tempFilePaths[0]);
      },
      fail: (err) => {
        if (err.errMsg.includes("cancel")) return;
        Taro.showToast({ title: "选择图片失败", icon: "none" });
      },
    });
  }, 1000);

  const handleRemoveImage = () => {
    setFeedbackImage(null);
  };

  const handleSubmitFeedback = throttle(async () => {
    if (!feedbackText.trim()) {
      Taro.showToast({ title: "请填写反馈内容后再提交", icon: "none" });
      return;
    }

    Taro.showLoading({ title: "提交中..." });

    try {
      let imageUrl = null;

      if (feedbackImage) {
        try {
          const uploadResult = await uploadFile<{ url: string }>(
            "/api/upload",
            feedbackImage,
            {
              name: "file",
              retryCount: 3,
              retryDelay: 1000,
            }
          );
          imageUrl = uploadResult.url;
        } catch (error) {
          console.error("图片上传失败:", error);
          Taro.showToast({
            title: "图片上传失败，是否继续提交？",
            icon: "none",
            duration: 2000,
          });
        }
      }

      await request("/api/feedback", {
        method: "POST",
        data: {
          content: feedbackText.trim(),
          imageUrl,
        },
        retryCount: 3,
        retryDelay: 1000,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      });

      Taro.hideLoading();
      Taro.showToast({
        title: "反馈已提交，我们会尽快查看～",
        icon: "success",
        duration: 2000,
      });

      setFeedbackText("");
      setFeedbackImage(null);
    } catch (error) {
      Taro.hideLoading();

      let errorMessage = "提交失败，请稍后重试";
      if (error.message?.includes("HTTP 429")) {
        errorMessage = "提交过于频繁，请稍后再试";
      } else if (error.message?.includes("HTTP 5")) {
        errorMessage = "服务器暂时不可用，请稍后再试";
      }

      Taro.showToast({
        title: errorMessage,
        icon: "none",
        duration: 2000,
      });
    }
  }, 2000);

  return (
    <View className="help-feedback-page">
      <View className="section faq-section">
        <Text className="section-title">常见问题 Q&A</Text>
        {faqs.map((faq) => (
          <View key={faq.id} className="faq-item">
            <View
              className={`faq-question ${
                expandedFAQ === faq.id ? "expanded" : ""
              }`}
              onClick={() => handleToggleFAQ(faq.id)}
            >
              <Text>{faq.question}</Text>
              <Text className="faq-arrow">
                {expandedFAQ === faq.id ? "▲" : "▼"}
              </Text>
            </View>
            {expandedFAQ === faq.id && (
              <View className="faq-answer">
                <Text>{faq.answer}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View className="section feedback-submission-section">
        <Text className="section-title">提交反馈</Text>
        <Textarea
          className="feedback-textarea"
          placeholder="请详细描述您遇到的问题或建议（必填）"
          value={feedbackText}
          onInput={handleFeedbackTextChange}
          maxlength={500} // Optional: limit length
          autoHeight
        />

        <View className="image-uploader-container">
          {feedbackImage ? (
            <View className="image-preview-item">
              <Image
                src={feedbackImage}
                mode="aspectFill"
                className="preview-image"
              />
              <View className="remove-image-btn" onClick={handleRemoveImage}>
                <Text>✕</Text>
              </View>
            </View>
          ) : (
            <View className="add-image-btn" onClick={handleChooseImage}>
              <Text className="plus-icon">+</Text>
              <Text>添加图片 (可选, 最多1张)</Text>
            </View>
          )}
        </View>

        <Button
          className="submit-feedback-btn"
          type="primary"
          onClick={handleSubmitFeedback}
          disabled={!feedbackText.trim()} // Disable if no text
        >
          提交反馈
        </Button>
      </View>
    </View>
  );
}

// Optional: Page configuration
definePageConfig({
  navigationBarTitleText: "帮助与反馈",
});
