"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
require("./index.scss");
const LazyImage = ({ src, alt = "", className = "", width, height, placeholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmNWY1ZjUiLz48L3N2Zz4=", }) => {
    const [status, setStatus] = (0, react_1.useState)("loading");
    const imgRef = (0, react_1.useRef)(null);
    const observerRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        const img = imgRef.current;
        if (!img)
            return;
        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                var _a;
                if (entry.isIntersecting) {
                    img.src = src;
                    (_a = observerRef.current) === null || _a === void 0 ? void 0 : _a.unobserve(img);
                }
            });
        }, {
            rootMargin: "50px 0px",
            threshold: 0.01,
        });
        observerRef.current.observe(img);
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [src]);
    const handleLoad = () => {
        setStatus("loaded");
    };
    const handleError = () => {
        setStatus("error");
    };
    return ((0, jsx_runtime_1.jsx)("img", { ref: imgRef, src: placeholder, alt: alt, className: `lazy-image ${status} ${className}`, style: { width, height }, onLoad: handleLoad, onError: handleError }));
};
exports.default = LazyImage;
//# sourceMappingURL=index.js.map