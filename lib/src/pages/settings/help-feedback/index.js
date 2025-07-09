"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HelpFeedbackPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const taro_1 = require("@tarojs/taro");
const react_1 = require("react");
const components_1 = require("@tarojs/components");
const debounce_1 = require("../../../utils/debounce");
const request_1 = require("../../../utils/request");
require("./index.scss");
const faqs = [
    {
        id: "q1",
        question: "如何发布信息？",
        answer: "在首页点击底部的发布按钮，选择对应的分类，填写信息并上传图片即可。",
    },
    {
        id: "q2",
        question: "信息审核需要多久？",
        answer: "我们会在24小时内完成审核，请耐心等待。",
    },
    {
        id: "q3",
        question: "如何避免交易被骗？",
        answer: "请尽量选择当面交易，核实对方身份。对于线上交易，警惕要求提前支付或向陌生账户转账的行为。",
    },
    {
        id: "q4",
        question: "信用等级是如何计算的？",
        answer: "信用等级会根据您的发帖历史、交易评价、举报情况等综合计算。",
    },
];
function HelpFeedbackPage() {
    const [feedbackText, setFeedbackText] = (0, react_1.useState)("");
    const [feedbackImage, setFeedbackImage] = (0, react_1.useState)(null);
    const [expandedFAQ, setExpandedFAQ] = (0, react_1.useState)(null);
    const handleToggleFAQ = (id) => {
        setExpandedFAQ(expandedFAQ === id ? null : id);
    };
    const handleFeedbackTextChange = (0, debounce_1.debounce)((e) => {
        setFeedbackText(e.detail.value);
    }, 300);
    const handleChooseImage = (0, debounce_1.throttle)(() => {
        taro_1.default.chooseImage({
            count: 1,
            sizeType: ["original", "compressed"],
            sourceType: ["album", "camera"],
            success: (res) => {
                setFeedbackImage(res.tempFilePaths[0]);
            },
            fail: (err) => {
                if (err.errMsg.includes("cancel"))
                    return;
                taro_1.default.showToast({ title: "选择图片失败", icon: "none" });
            },
        });
    }, 1000);
    const handleRemoveImage = () => {
        setFeedbackImage(null);
    };
    const handleSubmitFeedback = (0, debounce_1.throttle)(async () => {
        var _a, _b;
        if (!feedbackText.trim()) {
            taro_1.default.showToast({ title: "请填写反馈内容后再提交", icon: "none" });
            return;
        }
        taro_1.default.showLoading({ title: "提交中..." });
        try {
            let imageUrl = null;
            if (feedbackImage) {
                try {
                    const uploadResult = await (0, request_1.uploadFile)("/api/upload", feedbackImage, {
                        name: "file",
                        retryCount: 3,
                        retryDelay: 1000,
                    });
                    imageUrl = uploadResult.url;
                }
                catch (error) {
                    console.error("图片上传失败:", error);
                    taro_1.default.showToast({
                        title: "图片上传失败，是否继续提交？",
                        icon: "none",
                        duration: 2000,
                    });
                }
            }
            await (0, request_1.request)("/api/feedback", {
                method: "POST",
                data: {
                    content: feedbackText.trim(),
                    imageUrl,
                },
                retryCount: 3,
                retryDelay: 1000,
                retryableStatusCodes: [408, 429, 500, 502, 503, 504],
            });
            taro_1.default.hideLoading();
            taro_1.default.showToast({
                title: "反馈已提交，我们会尽快查看～",
                icon: "success",
                duration: 2000,
            });
            setFeedbackText("");
            setFeedbackImage(null);
        }
        catch (error) {
            taro_1.default.hideLoading();
            let errorMessage = "提交失败，请稍后重试";
            if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes("HTTP 429")) {
                errorMessage = "提交过于频繁，请稍后再试";
            }
            else if ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes("HTTP 5")) {
                errorMessage = "服务器暂时不可用，请稍后再试";
            }
            taro_1.default.showToast({
                title: errorMessage,
                icon: "none",
                duration: 2000,
            });
        }
    }, 2000);
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "help-feedback-page", children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: "section faq-section", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "section-title", children: "\u5E38\u89C1\u95EE\u9898 Q&A" }), faqs.map((faq) => ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "faq-item", children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: `faq-question ${expandedFAQ === faq.id ? "expanded" : ""}`, onClick: () => handleToggleFAQ(faq.id), children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: faq.question }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "faq-arrow", children: expandedFAQ === faq.id ? "▲" : "▼" })] }), expandedFAQ === faq.id && ((0, jsx_runtime_1.jsx)(components_1.View, { className: "faq-answer", children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: faq.answer }) }))] }, faq.id)))] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "section feedback-submission-section", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "section-title", children: "\u63D0\u4EA4\u53CD\u9988" }), (0, jsx_runtime_1.jsx)(components_1.Textarea, { className: "feedback-textarea", placeholder: "\u8BF7\u8BE6\u7EC6\u63CF\u8FF0\u60A8\u9047\u5230\u7684\u95EE\u9898\u6216\u5EFA\u8BAE\uFF08\u5FC5\u586B\uFF09", value: feedbackText, onInput: handleFeedbackTextChange, maxlength: 500, autoHeight: true }), (0, jsx_runtime_1.jsx)(components_1.View, { className: "image-uploader-container", children: feedbackImage ? ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "image-preview-item", children: [(0, jsx_runtime_1.jsx)(components_1.Image, { src: feedbackImage, mode: "aspectFill", className: "preview-image" }), (0, jsx_runtime_1.jsx)(components_1.View, { className: "remove-image-btn", onClick: handleRemoveImage, children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u2715" }) })] })) : ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "add-image-btn", onClick: handleChooseImage, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "plus-icon", children: "+" }), (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u6DFB\u52A0\u56FE\u7247 (\u53EF\u9009, \u6700\u591A1\u5F20)" })] })) }), (0, jsx_runtime_1.jsx)(components_1.Button, { className: "submit-feedback-btn", type: "primary", onClick: handleSubmitFeedback, disabled: !feedbackText.trim(), children: "\u63D0\u4EA4\u53CD\u9988" })] })] }));
}
// Optional: Page configuration
definePageConfig({
    navigationBarTitleText: "帮助与反馈",
});
//# sourceMappingURL=index.js.map