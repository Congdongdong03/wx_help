"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfile = exports.logoutUser = exports.loginUser = exports.initUserState = exports.clearError = exports.updateUserInfo = exports.logout = exports.loginFailure = exports.loginSuccess = exports.loginStart = void 0;
const types_1 = require("./types");
// Action 创建器
const loginStart = () => ({
    type: types_1.USER_ACTION_TYPES.LOGIN_START,
});
exports.loginStart = loginStart;
const loginSuccess = (userInfo) => ({
    type: types_1.USER_ACTION_TYPES.LOGIN_SUCCESS,
    payload: userInfo,
});
exports.loginSuccess = loginSuccess;
const loginFailure = (error) => ({
    type: types_1.USER_ACTION_TYPES.LOGIN_FAILURE,
    payload: error,
});
exports.loginFailure = loginFailure;
const logout = () => ({
    type: types_1.USER_ACTION_TYPES.LOGOUT,
});
exports.logout = logout;
const updateUserInfo = (userInfo) => ({
    type: types_1.USER_ACTION_TYPES.UPDATE_USER_INFO,
    payload: userInfo,
});
exports.updateUserInfo = updateUserInfo;
const clearError = () => ({
    type: types_1.USER_ACTION_TYPES.CLEAR_ERROR,
});
exports.clearError = clearError;
const initUserState = (userInfo) => ({
    type: types_1.USER_ACTION_TYPES.INIT_USER_STATE,
    payload: userInfo,
});
exports.initUserState = initUserState;
// 异步 Action 创建器
const loginUser = (userInfo) => {
    return (dispatch) => {
        dispatch((0, exports.loginStart)());
        try {
            // 这里可以添加登录验证逻辑
            dispatch((0, exports.loginSuccess)(userInfo));
        }
        catch (error) {
            dispatch((0, exports.loginFailure)(error instanceof Error ? error.message : "登录失败"));
        }
    };
};
exports.loginUser = loginUser;
const logoutUser = () => {
    return (dispatch) => {
        try {
            // 这里可以添加登出清理逻辑
            dispatch((0, exports.logout)());
        }
        catch (error) {
            console.error("登出失败:", error);
        }
    };
};
exports.logoutUser = logoutUser;
const updateUserProfile = (userInfo) => {
    return (dispatch) => {
        try {
            dispatch((0, exports.updateUserInfo)(userInfo));
        }
        catch (error) {
            console.error("更新用户信息失败:", error);
        }
    };
};
exports.updateUserProfile = updateUserProfile;
//# sourceMappingURL=actions.js.map