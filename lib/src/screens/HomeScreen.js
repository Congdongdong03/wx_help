"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const HomeScreen = () => {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, children: "\u9996\u9875" }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.categoryContainer, children: [(0, jsx_runtime_1.jsx)(react_native_1.Button, { title: "\u5E2E\u5E2E (\u7A81\u51FA)", onPress: () => { }, color: "#FF6347" }), (0, jsx_runtime_1.jsx)(react_native_1.Button, { title: "\u79DF\u623F", onPress: () => { } }), (0, jsx_runtime_1.jsx)(react_native_1.Button, { title: "\u4E8C\u624B", onPress: () => { } }), (0, jsx_runtime_1.jsx)(react_native_1.Button, { title: "\u62DB\u8058", onPress: () => { } })] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.fixedPostContainer, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.fixedPostText, children: "Coles & Woolworths \u6298\u6263 (\u56FA\u5B9A)" }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { children: "\u968F\u673A\u63A8\u8350\u5185\u5BB9\u533A\u57DF..." })] }));
};
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
    categoryContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    fixedPostContainer: {
        backgroundColor: "#f0f0f0",
        padding: 15,
        marginBottom: 20,
        width: "90%",
        alignItems: "center",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    fixedPostText: {
        fontSize: 16,
        fontWeight: "bold",
    },
});
exports.default = HomeScreen;
//# sourceMappingURL=HomeScreen.js.map