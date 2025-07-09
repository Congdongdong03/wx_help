"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EditNicknamePage;
const jsx_runtime_1 = require("react/jsx-runtime");
const taro_1 = require("@tarojs/taro");
const components_1 = require("@tarojs/components");
const debounce_1 = require("../../../utils/debounce");
const hooks_1 = require("../../../store/user/hooks");
require("./index.scss");
const react_1 = require("react");
function EditNicknamePage() {
    const router = (0, taro_1.useRouter)();
    const { currentUser, updateUser } = (0, hooks_1.useUser)();
    const [currentNickname, setCurrentNickname] = (0, react_1.useState)("");
    const [originalNickname, setOriginalNickname] = (0, react_1.useState)("");
    const [isSaveDisabled, setIsSaveDisabled] = (0, react_1.useState)(true);
    const [errorText, setErrorText] = (0, react_1.useState)("");
    (0, react_1.useEffect)(() => {
        // 优先使用路由参数，如果没有则使用当前用户信息
        const initialNickname = decodeURIComponent(router.params.nickname || "") ||
            (currentUser === null || currentUser === void 0 ? void 0 : currentUser.nickName) ||
            "";
        setCurrentNickname(initialNickname);
        setOriginalNickname(initialNickname);
        console.log("Initial nickname:", initialNickname);
    }, [router.params.nickname, currentUser === null || currentUser === void 0 ? void 0 : currentUser.nickName]);
    (0, react_1.useEffect)(() => {
        if (currentNickname.trim() === "" || currentNickname === originalNickname) {
            setIsSaveDisabled(true);
        }
        else if (currentNickname.length > 10) {
            setIsSaveDisabled(true);
        }
        else {
            setIsSaveDisabled(false);
        }
        if (currentNickname.length > 10) {
            setErrorText("昵称不能超过10个字符");
        }
        else if (currentNickname.trim() === "") {
            setErrorText("昵称不能为空");
        }
        else {
            setErrorText("");
        }
    }, [currentNickname, originalNickname]);
    // 使用防抖处理输入变化
    const handleInputChange = (0, debounce_1.debounce)((e) => {
        setCurrentNickname(e.detail.value);
    }, 300);
    // 使用节流处理保存操作
    const handleSave = (0, debounce_1.throttle)(() => {
        if (isSaveDisabled || errorText) {
            // Double check with errorText as well
            taro_1.default.showToast({ title: errorText || "昵称无效", icon: "none" });
            return;
        }
        // TODO: Add sensitive word check here (local or backend)
        console.log("Attempting to save nickname:", currentNickname);
        // Simulate API call
        taro_1.default.showLoading({ title: "保存中..." });
        setTimeout(() => {
            taro_1.default.hideLoading();
            // Assume success for now
            try {
                // 使用新的用户状态管理更新昵称
                updateUser({ nickName: currentNickname.trim() });
                console.log("Updated nickname in Redux store:", currentNickname.trim());
                taro_1.default.showToast({ title: "昵称更新成功", icon: "success" });
                taro_1.default.navigateBack();
            }
            catch (e) {
                console.error("Failed to update nickname:", e);
                taro_1.default.showToast({ title: "保存失败，请稍后再试", icon: "none" });
            }
        }, 1000);
    }, 1000);
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "edit-nickname-page", children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: "input-container", children: [(0, jsx_runtime_1.jsx)(components_1.Input, { className: "nickname-input", type: "text", placeholder: "\u8BF7\u8F93\u5165\u65B0\u7684\u6635\u79F0", value: currentNickname, onInput: handleInputChange, maxlength: 10, focus: true }), currentNickname.length > 0 && ((0, jsx_runtime_1.jsx)(components_1.View, { className: "clear-input-btn", onClick: () => setCurrentNickname(""), children: "\u2715" }))] }), errorText && (0, jsx_runtime_1.jsx)(components_1.Text, { className: "error-text", children: errorText }), (0, jsx_runtime_1.jsxs)(components_1.Text, { className: "char-limit-info", children: ["\u8FD8\u80FD\u8F93\u5165 ", 10 - currentNickname.length, " \u5B57"] }), (0, jsx_runtime_1.jsx)(components_1.Button, { className: "save-button", disabled: isSaveDisabled, onClick: handleSave, children: "\u4FDD\u5B58" })] }));
}
//# sourceMappingURL=index.js.map