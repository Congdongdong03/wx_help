"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const useVirtualList_1 = require("../../hooks/useVirtualList");
require("./index.scss");
function VirtualList({ list, itemHeight, renderItem, overscan = 3, className = "", }) {
    const { virtualItems, totalHeight, containerRef, startIndex } = (0, useVirtualList_1.useVirtualList)(list, {
        itemHeight,
        overscan,
    });
    return ((0, jsx_runtime_1.jsxs)("div", { ref: containerRef, className: `virtual-list ${className}`, style: { height: "100%", overflow: "auto" }, children: [(0, jsx_runtime_1.jsx)("div", { className: "virtual-list-phantom", style: { height: totalHeight } }), (0, jsx_runtime_1.jsx)("div", { className: "virtual-list-content", style: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translateY(${startIndex * itemHeight}px)`,
                }, children: virtualItems.map((item, index) => ((0, jsx_runtime_1.jsx)("div", { style: { height: itemHeight }, children: renderItem(item, startIndex + index) }, startIndex + index))) })] }));
}
exports.default = VirtualList;
//# sourceMappingURL=index.js.map