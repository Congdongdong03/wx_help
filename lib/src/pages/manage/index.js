"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Manage;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@tarojs/components");
const taro_1 = require("@tarojs/taro");
function Manage() {
    return ((0, jsx_runtime_1.jsx)(components_1.View, { className: "index", children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u7BA1\u7406\u9875\u9762" }) }));
}
(0, taro_1.definePageConfig)({
    navigationBarTitleText: "管理",
});
//# sourceMappingURL=index.js.map