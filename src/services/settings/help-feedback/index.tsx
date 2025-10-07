import Taro from "@tarojs/taro";
import { useState } from "react";
import { View, Text, Textarea, Button } from "@tarojs/components";
import { request } from "../../../utils/request";
import "./index.scss";

export default function HelpFeedbackPage() {
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackImage, setFeedbackImage] = useState("");
  const [feedbackType, setFeedbackType] = useState("advice");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const handleFeedbackTextChange = (e) => {
    setFeedbackText(e.detail.value);
  };

  const handleToggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        setFeedbackImage(res.tempFilePaths[0]);
      },
      fail: (error) => {
        Taro.showToast({
          title: "选择图片失败",
          icon: "none",
        });
      },
    });
  };

  const handleRemoveImage = () => {
    setFeedbackImage("");
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      Taro.showToast({ title: "请填写反馈内容", icon: "none" });
      return;
    }

    Taro.showLoading({ title: "提交中..." });

    try {
      // 如果有图片，先上传图片
      let imageUrl = "";
      if (feedbackImage) {
        try {
          const uploadRes = await Taro.uploadFile({
            url: "/api/posts/upload",
            filePath: feedbackImage,
            name: "file",
            header: {
              "x-openid": "dev_openid_123",
            },
          });

          const uploadData = JSON.parse(uploadRes.data);
          if (uploadData.code === 0) {
            imageUrl = uploadData.data.url;
          }
        } catch (uploadError) {
          Taro.showToast({
            title: "图片上传失败，但反馈内容已提交",
            icon: "none",
          });
        }
      }

      // 提交反馈（统一到 /api/feedback）
      await request("/api/feedback", {
        method: "POST",
        data: {
          content: feedbackText.trim(),
          type: feedbackType,
          imageUrl: imageUrl,
        },
      });

      Taro.hideLoading();
      Taro.showToast({
        title: "反馈已提交",
        icon: "success",
        duration: 2000,
      });

      // 重置表单
      setFeedbackText("");
      setFeedbackImage("");
      setFeedbackType("advice");
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({
        title: "提交失败，请稍后重试",
        icon: "none",
        duration: 2000,
      });
    }
  };

  const faqData = [
    {
      question: "如何发布商品信息？",
      answer:
        "在首页点击帮帮按钮，填写商品信息并上传图片即可发布。发布前请确保信息真实准确。",
    },
    {
      question: "如何联系卖家？",
      answer:
        "在商品详情页面点击联系卖家按钮，可以通过私信功能与卖家进行沟通。",
    },
    {
      question: "如何举报虚假信息？",
      answer:
        "在商品详情页面点击举报按钮，选择举报原因并提交。我们会尽快处理您的举报。",
    },
    {
      question: "如何修改个人信息？",
      answer: "在我的页面点击头像或昵称，可以修改个人资料信息。",
    },
    {
      question: "忘记密码怎么办？",
      answer:
        "目前我们使用微信授权登录，无需密码。如果遇到登录问题，请尝试重新授权或联系客服。",
    },
  ];

  const feedbackTypes = [
    { value: "advice", label: "建议" },
    { value: "bug", label: "问题" },
    { value: "report", label: "举报" },
  ];

  return (
    <View className="help-feedback-page">
      {/* FAQ 部分 */}
      <View className="section faq-section">
        <Text className="section-title">常见问题</Text>
        {faqData.map((faq, index) => (
          <View key={index} className="faq-item">
            <View
              className={`faq-question ${
                expandedFAQ === index ? "expanded" : ""
              }`}
              onClick={() => handleToggleFAQ(index)}
            >
              <Text>{faq.question}</Text>
              <Text className="faq-arrow">
                {expandedFAQ === index ? "▼" : "▶"}
              </Text>
            </View>
            {expandedFAQ === index && (
              <View className="faq-answer">
                <Text>{faq.answer}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* 反馈提交部分 */}
      <View className="section feedback-submission-section">
        <Text className="section-title">提交反馈</Text>

        {/* 反馈类型选择 */}
        <View className="feedback-type-section">
          <Text className="feedback-type-label">反馈类型：</Text>
          <View className="feedback-type-buttons">
            {feedbackTypes.map((type) => (
              <Button
                key={type.value}
                size="mini"
                type={feedbackType === type.value ? "primary" : "default"}
                onClick={() => setFeedbackType(type.value)}
                className="feedback-type-btn"
              >
                {type.label}
              </Button>
            ))}
          </View>
        </View>

        <Textarea
          className="feedback-textarea"
          placeholder="请详细描述您遇到的问题或建议（必填）"
          value={feedbackText}
          onInput={handleFeedbackTextChange}
          maxlength={500}
          autoHeight
        />

        {/* 图片上传 */}
        <View className="image-uploader-container">
          {feedbackImage ? (
            <View className="image-preview-item">
              <Text
                className="preview-image"
                style={{ backgroundImage: `url(${feedbackImage})` }}
              />
              <View className="remove-image-btn" onClick={handleRemoveImage}>
                ×
              </View>
            </View>
          ) : (
            <View className="add-image-btn" onClick={handleChooseImage}>
              <Text className="plus-icon">+</Text>
              <Text>添加图片</Text>
            </View>
          )}
        </View>

        <Button
          className="submit-feedback-btn"
          type="primary"
          onClick={handleSubmitFeedback}
          disabled={!feedbackText.trim()}
        >
          提交反馈
        </Button>
      </View>
    </View>
  );
}
