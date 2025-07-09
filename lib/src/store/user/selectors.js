"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectLoginStatus = exports.selectUserBasicInfo = exports.selectUserAvatar = exports.selectUserNickname = exports.selectUserOpenid = exports.selectUserId = exports.selectError = exports.selectIsLoading = exports.selectIsLoggedIn = exports.selectCurrentUser = exports.selectUserState = void 0;
const reselect_1 = require("reselect");
// 基础选择器
const selectUserState = (state) => state.user;
exports.selectUserState = selectUserState;
// 用户信息选择器
const selectCurrentUser = (state) => state.user.currentUser;
exports.selectCurrentUser = selectCurrentUser;
const selectIsLoggedIn = (state) => state.user.isLoggedIn;
exports.selectIsLoggedIn = selectIsLoggedIn;
const selectIsLoading = (state) => state.user.isLoading;
exports.selectIsLoading = selectIsLoading;
const selectError = (state) => state.user.error;
exports.selectError = selectError;
// 用户ID选择器
const selectUserId = (state) => { var _a; return ((_a = state.user.currentUser) === null || _a === void 0 ? void 0 : _a.id) || null; };
exports.selectUserId = selectUserId;
const selectUserOpenid = (state) => { var _a; return ((_a = state.user.currentUser) === null || _a === void 0 ? void 0 : _a.openid) || null; };
exports.selectUserOpenid = selectUserOpenid;
// 用户基本信息选择器
const selectUserNickname = (state) => { var _a; return ((_a = state.user.currentUser) === null || _a === void 0 ? void 0 : _a.nickName) || ""; };
exports.selectUserNickname = selectUserNickname;
const selectUserAvatar = (state) => { var _a; return ((_a = state.user.currentUser) === null || _a === void 0 ? void 0 : _a.avatarUrl) || ""; };
exports.selectUserAvatar = selectUserAvatar;
// 组合选择器 - 使用 createSelector 进行 memoization
exports.selectUserBasicInfo = (0, reselect_1.createSelector)([exports.selectCurrentUser, exports.selectIsLoggedIn], (currentUser, isLoggedIn) => ({
    id: currentUser === null || currentUser === void 0 ? void 0 : currentUser.id,
    openid: currentUser === null || currentUser === void 0 ? void 0 : currentUser.openid,
    nickName: currentUser === null || currentUser === void 0 ? void 0 : currentUser.nickName,
    avatarUrl: currentUser === null || currentUser === void 0 ? void 0 : currentUser.avatarUrl,
    isLoggedIn,
}));
// 登录状态选择器 - 使用 createSelector 进行 memoization
exports.selectLoginStatus = (0, reselect_1.createSelector)([exports.selectIsLoggedIn, exports.selectIsLoading, exports.selectError], (isLoggedIn, isLoading, error) => ({
    isLoggedIn,
    isLoading,
    error,
}));
//# sourceMappingURL=selectors.js.map