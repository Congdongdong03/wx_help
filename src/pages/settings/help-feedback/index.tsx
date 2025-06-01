import Taro, { chooseImage } from "@tarojs/taro";
import { useState } from "react";
import { View, Text, Textarea, Button, Image } from "@tarojs/components";
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

  const handleFeedbackTextChange = (e) => {
    setFeedbackText(e.detail.value);
  };

  const handleChooseImage = () => {
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
  };

  const handleRemoveImage = () => {
    setFeedbackImage(null);
  };

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      Taro.showToast({ title: "请填写反馈内容后再提交", icon: "none" });
      return;
    }

    // TODO: Implement actual feedback submission logic (API call)
    // This would involve uploading feedbackImage if present
    console.log("Feedback Text:", feedbackText);
    console.log("Feedback Image:", feedbackImage);

    Taro.showLoading({ title: "提交中..." });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showToast({
        title: "反馈已提交，我们会尽快查看～",
        icon: "success",
        duration: 2000,
      });
      setFeedbackText("");
      setFeedbackImage(null);
      // Potentially navigate back or clear form
    }, 1500); // Simulate API call
  };

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
