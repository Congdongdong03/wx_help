"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = debounce;
exports.throttle = throttle;
/**
 * 防抖函数
 * @param fn 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 */
function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            fn.apply(this, args);
            timer = null;
        }, delay);
    };
}
/**
 * 节流函数
 * @param fn 需要节流的函数
 * @param delay 延迟时间（毫秒）
 */
function throttle(fn, delay) {
    let lastTime = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastTime >= delay) {
            fn.apply(this, args);
            lastTime = now;
        }
    };
}
//# sourceMappingURL=debounce.js.map