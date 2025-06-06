import { Dispatch } from "redux";
import Taro from "@tarojs/taro";
import {
  PostsActionTypes,
  FETCH_MY_POSTS_REQUEST,
  FETCH_MY_POSTS_SUCCESS,
  FETCH_MY_POSTS_FAILURE,
  Post, // 导入 Post 类型
} from "./types";
import { BASE_URL } from "../utils/env";

// Action Creators

export const fetchMyPostsRequest = (): PostsActionTypes => ({
  type: FETCH_MY_POSTS_REQUEST,
});

export const fetchMyPostsSuccess = (posts: Post[]): PostsActionTypes => ({
  type: FETCH_MY_POSTS_SUCCESS,
  payload: posts,
});

export const fetchMyPostsFailure = (error: string): PostsActionTypes => ({
  type: FETCH_MY_POSTS_FAILURE,
  payload: error,
});

// Async Action Creator (Thunk)
// 用于异步获取用户发布的帖子列表
export const fetchMyPosts = () => {
  return async (dispatch: Dispatch<PostsActionTypes>) => {
    dispatch(fetchMyPostsRequest()); // Dispatch 请求开始的 action

    try {
      // TODO: 替换为实际的API调用
      const response = await Taro.request<Post[]>({
        // 使用 Post[] 类型标注响应数据
        url: `${BASE_URL}/api/posts/my`, // 后端接口地址
        method: "GET",
      });

      // 检查响应状态和数据结构
      if (response.statusCode === 200) {
        // 假设接口成功时返回的数据在 response.data
        dispatch(fetchMyPostsSuccess(response.data || [])); // Dispatch 请求成功的 action
      } else {
        // 处理非 200 状态码的错误
        const errorMessage = `Error ${response.statusCode}: ${
          response.errMsg || "Unknown error"
        }`;
        console.error("获取我的发布失败:", errorMessage);
        dispatch(fetchMyPostsFailure(errorMessage)); // Dispatch 请求失败的 action
        Taro.showToast({
          // 显示错误提示
          title: "获取数据失败，请稍后重试",
          icon: "none",
        });
      }
    } catch (error) {
      // 处理网络请求过程中的异常
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("获取我的发布失败:", error);
      dispatch(fetchMyPostsFailure(`Network Error: ${errorMessage}`)); // Dispatch 请求失败的 action
      Taro.showToast({
        // 显示错误提示
        title: "获取数据失败，请稍后重试",
        icon: "none",
      });
    }
  };
};
