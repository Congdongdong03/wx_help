"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUserBasicInfo = exports.useUserLoginStatus = exports.useUser = void 0;
const react_redux_1 = require("react-redux");
const selectors_1 = require("./selectors");
const actions_1 = require("./actions");
const utils_1 = require("./utils");
/**
 * 用户状态管理Hook
 */
const useUser = () => {
    const dispatch = (0, react_redux_1.useDispatch)();
    // 基础状态
    const currentUser = (0, react_redux_1.useSelector)(selectors_1.selectCurrentUser);
    const isLoggedIn = (0, react_redux_1.useSelector)(selectors_1.selectIsLoggedIn);
    const isLoading = (0, react_redux_1.useSelector)(selectors_1.selectIsLoading);
    const error = (0, react_redux_1.useSelector)(selectors_1.selectError);
    // 用户信息
    const userId = (0, react_redux_1.useSelector)(selectors_1.selectUserId);
    const userOpenid = (0, react_redux_1.useSelector)(selectors_1.selectUserOpenid);
    const userNickname = (0, react_redux_1.useSelector)(selectors_1.selectUserNickname);
    const userAvatar = (0, react_redux_1.useSelector)(selectors_1.selectUserAvatar);
    // 组合信息
    const userBasicInfo = (0, react_redux_1.useSelector)(selectors_1.selectUserBasicInfo);
    const loginStatus = (0, react_redux_1.useSelector)(selectors_1.selectLoginStatus);
    // 登录方法
    const login = (userInfo) => {
        if ((0, utils_1.validateUserInfo)(userInfo)) {
            (0, utils_1.saveUserToStorage)(userInfo);
            dispatch((0, actions_1.loginUser)(userInfo));
        }
        else {
            console.error("用户信息格式无效:", userInfo);
        }
    };
    // 登出方法
    const logout = () => {
        (0, utils_1.clearUserFromStorage)();
        dispatch((0, actions_1.logoutUser)());
    };
    // 更新用户信息
    const updateUser = (userInfo) => {
        if (currentUser) {
            const updatedUser = Object.assign(Object.assign({}, currentUser), userInfo);
            (0, utils_1.saveUserToStorage)(updatedUser);
            dispatch((0, actions_1.updateUserProfile)(userInfo));
        }
    };
    // 初始化用户状态（从本地存储）
    const initializeUserState = () => {
        const storedUser = (0, utils_1.getUserFromStorage)();
        if (storedUser && (0, utils_1.validateUserInfo)(storedUser)) {
            dispatch((0, actions_1.initUserState)(storedUser));
        }
        else {
            dispatch((0, actions_1.initUserState)(null));
        }
    };
    // 清除错误
    const clearUserError = () => {
        dispatch((0, actions_1.clearError)());
    };
    return {
        // 状态
        currentUser,
        isLoggedIn,
        isLoading,
        error,
        userId,
        userOpenid,
        userNickname,
        userAvatar,
        userBasicInfo,
        loginStatus,
        // 方法
        login,
        logout,
        updateUser,
        initializeUserState,
        clearUserError,
    };
};
exports.useUser = useUser;
/**
 * 简化的用户登录状态Hook
 */
const useUserLoginStatus = () => {
    const { isLoggedIn, isLoading, error } = (0, exports.useUser)();
    return {
        isLoggedIn,
        isLoading,
        error,
    };
};
exports.useUserLoginStatus = useUserLoginStatus;
/**
 * 用户基本信息Hook
 */
const useUserBasicInfo = () => {
    const { currentUser, userNickname, userAvatar, userOpenid } = (0, exports.useUser)();
    return {
        currentUser,
        nickname: userNickname,
        avatar: userAvatar,
        openid: userOpenid,
    };
};
exports.useUserBasicInfo = useUserBasicInfo;
//# sourceMappingURL=hooks.js.map