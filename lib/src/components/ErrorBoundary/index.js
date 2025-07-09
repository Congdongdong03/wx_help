"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const taro_1 = require("@tarojs/taro");
const components_1 = require("@tarojs/components");
require("./index.scss");
class ErrorBoundary extends taro_1.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error,
        };
    }
    componentDidCatch(error, errorInfo) {
        console.error("Error caught by boundary:", error, errorInfo);
    }
    render() {
        var _a;
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "error-boundary", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "error-title", children: "\u51FA\u9519\u4E86" }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "error-message", children: ((_a = this.state.error) === null || _a === void 0 ? void 0 : _a.message) || "发生了一些错误" }), (0, jsx_runtime_1.jsx)(components_1.View, { className: "error-retry", onClick: () => this.setState({ hasError: false, error: null }), role: "button", tabIndex: 0, "aria-label": "\u91CD\u8BD5", children: "\u91CD\u8BD5" })] }));
        }
        return this.props.children;
    }
}
exports.default = ErrorBoundary;
//# sourceMappingURL=index.js.map