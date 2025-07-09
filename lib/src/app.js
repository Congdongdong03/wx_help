"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginModalEventBus = void 0;
exports.getLoggedInUser = getLoggedInUser;
exports.storeLoggedInUser = storeLoggedInUser;
exports.clearLoginState = clearLoginState;
exports.checkLoginAndShowModal = checkLoginAndShowModal;
const jsx_runtime_1 = require("react/jsx-runtime");
const taro_1 = require("@tarojs/taro");
const react_1 = require("react");
const react_redux_1 = require("react-redux");
const store_1 = require("./store");
const LoginModal_1 = require("./components/LoginModal");
const hooks_1 = require("./store/user/hooks");
// 定义事件总线用于显示/隐藏登录弹窗
exports.loginModalEventBus = new taro_1.default.Events();
// Mock API for login simulation
const mockLoginAPI = (profileInfo) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() < 0.1) {
                // 10% chance of failure
                reject({ errMsg: "Network error or random API failure" });
                return;
            }
            const mockUser = Object.assign(Object.assign({}, profileInfo), { avatarUrl: profileInfo.avatarUrl, nickName: profileInfo.nickName, openid: `mock_openid_${Date.now()}`, token: `mock_token_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(7)}` });
            console.log("Mock API: Login successful, returning user:", mockUser);
            resolve(mockUser);
        }, 1000);
    });
};
// 为了向后兼容，保留原有的函数
function getLoggedInUser() {
    try {
        const userInfo = taro_1.default.getStorageSync("userInfo");
        if (userInfo && userInfo.openid) {
            console.log("getLoggedInUser: Found valid user in storage:", userInfo);
            return userInfo;
        }
        console.log("getLoggedInUser: No valid user in storage.");
    }
    catch (e) {
        console.error("getLoggedInUser: Error reading login state from storage", e);
    }
    return null;
}
function storeLoggedInUser(userInfo) {
    try {
        taro_1.default.setStorageSync("userInfo", userInfo);
        console.log("storeLoggedInUser: User stored successfully.");
    }
    catch (e) {
        console.error("storeLoggedInUser: Error storing user info", e);
    }
}
function clearLoginState() {
    try {
        taro_1.default.removeStorageSync("userInfo");
        console.log("clearLoginState: User login state cleared.");
    }
    catch (e) {
        console.error("clearLoginState: Error clearing login state", e);
    }
}
// 检查登录状态并显示登录弹窗
function checkLoginAndShowModal() {
    const user = getLoggedInUser();
    if (!user) {
        console.log("App: No logged-in user found. Emitting event to show login modal.");
        exports.loginModalEventBus.trigger("show", { type: "initial" });
    }
    else {
        console.log("App: User already logged in.", user);
        exports.loginModalEventBus.trigger("hide"); // Ensure it's hidden if somehow stuck
    }
}
// 内部App组件，使用Redux状态管理
function AppContent({ children }) {
    const { isLoggedIn, initializeUserState } = (0, hooks_1.useUser)();
    (0, taro_1.useLaunch)(() => {
        console.log("App launched");
        // 初始化用户状态（从本地存储）
        initializeUserState();
        // 检查本地缓存中的 openid
        const cachedOpenid = taro_1.default.getStorageSync("openid");
        console.log("App: Cached openid:", cachedOpenid);
        // 如果没有登录，显示登录弹窗
        if (!isLoggedIn) {
            console.log("App: No logged-in user found. Emitting event to show login modal.");
            exports.loginModalEventBus.trigger("show", { type: "initial" });
        }
        else {
            console.log("App: User already logged in.");
            exports.loginModalEventBus.trigger("hide");
        }
    });
    (0, taro_1.useDidShow)(() => {
        console.log("App did show");
        // 重新检查登录状态
        if (!isLoggedIn) {
            checkLoginAndShowModal();
        }
    });
    (0, react_1.useEffect)(() => {
        const handleAuthSuccess = (userInfo) => {
            console.log("App: AuthSuccess event received from modal. User:", userInfo);
        };
        const handleAuthReject = () => {
            console.log("App: AuthReject event received from modal.");
        };
        exports.loginModalEventBus.on("authSuccess", handleAuthSuccess);
        exports.loginModalEventBus.on("authReject", handleAuthReject);
        return () => {
            exports.loginModalEventBus.off("authSuccess", handleAuthSuccess);
            exports.loginModalEventBus.off("authReject", handleAuthReject);
        };
    }, []);
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [children, (0, jsx_runtime_1.jsx)(LoginModal_1.default, {})] }));
}
// 主App组件，提供Redux Provider
function App({ children }) {
    return ((0, jsx_runtime_1.jsx)(react_redux_1.Provider, { store: store_1.default, children: (0, jsx_runtime_1.jsx)(AppContent, { children: children }) }));
}
exports.default = App;
// For testing purposes, you might add a global function to trigger logout:
taro_1.default.logout = clearLoginState;
taro_1.default.checkLogin = () => console.log(getLoggedInUser());
taro_1.default.clearLoginAndShowModal = () => {
    clearLoginState();
    checkLoginAndShowModal();
};
//# sourceMappingURL=app.js.map