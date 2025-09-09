import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../index";
import {
  selectCurrentUser,
  selectIsLoggedIn,
  selectIsLoading,
  selectError,
  selectUserNickname,
  selectUserAvatar,
} from "./selectors";
import {
  loginUser,
  logoutUser,
  updateUserProfile,
  initUserState,
  clearError,
} from "./actions";
import { UserInfo } from "./types";
import {
  getUserFromStorage,
  saveUserToStorage,
  clearUserFromStorage,
  validateUserInfo,
} from "./utils";

/**
 * 用户状态管理Hook
 */
export const useUser = () => {
  const dispatch = useDispatch();

  // 基础状态
  const currentUser = useSelector(selectCurrentUser);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  // 用户信息
  const userNickname = useSelector(selectUserNickname);
  const userAvatar = useSelector(selectUserAvatar);

  // 登录方法
  const login = (userInfo: UserInfo) => {
    if (validateUserInfo(userInfo)) {
      saveUserToStorage(userInfo);
      dispatch(loginUser(userInfo));
    } else {
      console.error("用户信息格式无效:", userInfo);
    }
  };

  // 登出方法
  const logout = () => {
    clearUserFromStorage();
    dispatch(logoutUser());
  };

  // 更新用户信息
  const updateUser = (userInfo: Partial<UserInfo>) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userInfo };
      saveUserToStorage(updatedUser);
      dispatch(updateUserProfile(userInfo));
    }
  };

  // 初始化用户状态（从本地存储）
  const initializeUserState = () => {
    const storedUser = getUserFromStorage();
    if (storedUser && validateUserInfo(storedUser)) {
      dispatch(initUserState(storedUser));
    } else {
      dispatch(initUserState(null));
    }
  };

  // 清除错误
  const clearUserError = () => {
    dispatch(clearError());
  };

  return {
    // 状态
    currentUser,
    isLoggedIn,
    isLoading,
    error,
    userNickname,
    userAvatar,

    // 方法
    login,
    logout,
    updateUser,
    initializeUserState,
    clearUserError,
  };
};
