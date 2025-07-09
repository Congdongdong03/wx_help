"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchMyPosts = exports.fetchMyPostsFailure = exports.fetchMyPostsSuccess = exports.fetchMyPostsRequest = void 0;
const taro_1 = require("@tarojs/taro");
const types_1 = require("./types");
const env_1 = require("../utils/env");
// Action Creators
const fetchMyPostsRequest = () => ({
    type: types_1.FETCH_MY_POSTS_REQUEST,
});
exports.fetchMyPostsRequest = fetchMyPostsRequest;
const fetchMyPostsSuccess = (posts) => ({
    type: types_1.FETCH_MY_POSTS_SUCCESS,
    payload: posts,
});
exports.fetchMyPostsSuccess = fetchMyPostsSuccess;
const fetchMyPostsFailure = (error) => ({
    type: types_1.FETCH_MY_POSTS_FAILURE,
    payload: error,
});
exports.fetchMyPostsFailure = fetchMyPostsFailure;
// Async Action Creator (Thunk)
// 用于异步获取用户发布的帖子列表
const fetchMyPosts = () => {
    return async (dispatch) => {
        dispatch((0, exports.fetchMyPostsRequest)()); // Dispatch 请求开始的 action
        try {
            // TODO: 替换为实际的API调用
            const response = await taro_1.default.request({
                // 使用 Post[] 类型标注响应数据
                url: `${env_1.BASE_URL}/api/posts/my`, // 后端接口地址
                method: "GET",
            });
            // 检查响应状态和数据结构
            if (response.statusCode === 200) {
                // 假设接口成功时返回的数据在 response.data
                dispatch((0, exports.fetchMyPostsSuccess)(response.data || [])); // Dispatch 请求成功的 action
            }
            else {
                // 处理非 200 状态码的错误
                const errorMessage = `Error ${response.statusCode}: ${response.errMsg || "Unknown error"}`;
                console.error("获取我的发布失败:", errorMessage);
                dispatch((0, exports.fetchMyPostsFailure)(errorMessage)); // Dispatch 请求失败的 action
                taro_1.default.showToast({
                    // 显示错误提示
                    title: "获取数据失败，请稍后重试",
                    icon: "none",
                });
            }
        }
        catch (error) {
            // 处理网络请求过程中的异常
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error("获取我的发布失败:", error);
            dispatch((0, exports.fetchMyPostsFailure)(`Network Error: ${errorMessage}`)); // Dispatch 请求失败的 action
            taro_1.default.showToast({
                // 显示错误提示
                title: "获取数据失败，请稍后重试",
                icon: "none",
            });
        }
    };
};
exports.fetchMyPosts = fetchMyPosts;
//# sourceMappingURL=actions.js.map