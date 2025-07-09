"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ExploreScreen = () => {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, children: "\u5185\u5BB9\u63A8\u8350" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { children: "\u8FD9\u91CC\u5C06\u5C55\u793A\u5E2E\u5E2E\u3001\u79DF\u623F\u3001\u4E8C\u624B\u3001\u62DB\u8058\u7B49\u5206\u7C7B\u4FE1\u606F\u3002" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { children: "\uFF08\u7011\u5E03\u6D41\u5361\u7247\u8BBE\u8BA1\uFF09" })] }));
};
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
});
exports.default = ExploreScreen;
//# sourceMappingURL=ExploreScreen.js.map