import { RootState } from "../index";
import { UserInfo } from "./types";

// 基础选择器
export const selectUserState = (state: RootState) => state.user;

// 用户信息选择器
export const selectCurrentUser = (state: RootState): UserInfo | null =>
  state.user.currentUser;

export const selectIsLoggedIn = (state: RootState): boolean =>
  state.user.isLoggedIn;

export const selectIsLoading = (state: RootState): boolean =>
  state.user.isLoading;

export const selectError = (state: RootState): string | null =>
  state.user.error;

// 用户基本信息选择器
export const selectUserNickname = (state: RootState): string =>
  state.user.currentUser?.nickName || "";

export const selectUserAvatar = (state: RootState): string =>
  state.user.currentUser?.avatarUrl || "";

// 简化的组合选择器
export const selectUserBasicInfo = (state: RootState) => ({
  id: state.user.currentUser?.id,
  openid: state.user.currentUser?.openid,
  nickName: state.user.currentUser?.nickName,
  avatarUrl: state.user.currentUser?.avatarUrl,
  isLoggedIn: state.user.isLoggedIn,
});

// 简化的登录状态选择器
export const selectLoginStatus = (state: RootState) => ({
  isLoggedIn: state.user.isLoggedIn,
  isLoading: state.user.isLoading,
  error: state.user.error,
});
