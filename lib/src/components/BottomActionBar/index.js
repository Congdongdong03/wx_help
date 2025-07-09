"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@tarojs/components");
const BottomActionBar = ({ onSaveDraft, onPublish, isSavingDraft = false, isPublishing = false, saveDraftText = "保存草稿", publishText = "发布", saveDraftLoadingText = "保存中...", publishLoadingText = "发布中...", }) => {
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "form-actions-container", children: [(0, jsx_runtime_1.jsx)(components_1.Button, { className: "save-draft-button", onClick: onSaveDraft, loading: isSavingDraft, disabled: isSavingDraft || isPublishing, children: isSavingDraft ? saveDraftLoadingText : saveDraftText }), (0, jsx_runtime_1.jsx)(components_1.Button, { className: "submit-button", onClick: onPublish, loading: isPublishing, disabled: isSavingDraft || isPublishing, children: isPublishing ? publishLoadingText : publishText })] }));
};
exports.default = BottomActionBar;
//# sourceMappingURL=index.js.map