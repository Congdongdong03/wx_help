import { createSelector } from "reselect";
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

// 用户ID选择器
export const selectUserId = (state: RootState): string | number | null =>
  state.user.currentUser?.id || null;

export const selectUserOpenid = (state: RootState): string | null =>
  state.user.currentUser?.openid || null;

// 用户基本信息选择器
export const selectUserNickname = (state: RootState): string =>
  state.user.currentUser?.nickName || "";

export const selectUserAvatar = (state: RootState): string =>
  state.user.currentUser?.avatarUrl || "";

// 组合选择器 - 使用 createSelector 进行 memoization
export const selectUserBasicInfo = createSelector(
  [selectCurrentUser, selectIsLoggedIn],
  (currentUser, isLoggedIn) => ({
    id: currentUser?.id,
    openid: currentUser?.openid,
    nickName: currentUser?.nickName,
    avatarUrl: currentUser?.avatarUrl,
    isLoggedIn,
  })
);

// 登录状态选择器 - 使用 createSelector 进行 memoization
export const selectLoginStatus = createSelector(
  [selectIsLoggedIn, selectIsLoading, selectError],
  (isLoggedIn, isLoading, error) => ({
    isLoggedIn,
    isLoading,
    error,
  })
);
