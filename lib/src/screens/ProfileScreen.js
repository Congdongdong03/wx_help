"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ProfileScreen = () => {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, children: "\u6211\u7684" }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.menuItem, children: (0, jsx_runtime_1.jsx)(react_native_1.Button, { title: "\u4E2A\u4EBA\u8D44\u6599", onPress: () => { } }) }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.menuItem, children: (0, jsx_runtime_1.jsx)(react_native_1.Button, { title: "\u6536\u85CF\u7BA1\u7406", onPress: () => { } }) }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.menuItem, children: (0, jsx_runtime_1.jsx)(react_native_1.Button, { title: "\u6211\u7684\u53D1\u5E03", onPress: () => { } }) }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.menuItem, children: (0, jsx_runtime_1.jsx)(react_native_1.Button, { title: "\u53CD\u9988\u4E0E\u8BBE\u7F6E", onPress: () => { } }) })] }));
};
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 30,
    },
    menuItem: {
        width: "80%",
        marginBottom: 15,
    },
});
exports.default = ProfileScreen;
//# sourceMappingURL=ProfileScreen.js.map