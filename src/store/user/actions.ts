import {
  USER_ACTION_TYPES,
  UserInfo,
  UserAction,
  LoginStartAction,
  LoginSuccessAction,
  LoginFailureAction,
  LogoutAction,
  UpdateUserInfoAction,
  ClearErrorAction,
  InitUserStateAction,
} from "./types";

// Action 创建器
export const loginStart = (): LoginStartAction => ({
  type: USER_ACTION_TYPES.LOGIN_START,
});

export const loginSuccess = (userInfo: UserInfo): LoginSuccessAction => ({
  type: USER_ACTION_TYPES.LOGIN_SUCCESS,
  payload: userInfo,
});

export const loginFailure = (error: string): LoginFailureAction => ({
  type: USER_ACTION_TYPES.LOGIN_FAILURE,
  payload: error,
});

export const logout = (): LogoutAction => ({
  type: USER_ACTION_TYPES.LOGOUT,
});

export const updateUserInfo = (
  userInfo: Partial<UserInfo>
): UpdateUserInfoAction => ({
  type: USER_ACTION_TYPES.UPDATE_USER_INFO,
  payload: userInfo,
});

export const clearError = (): ClearErrorAction => ({
  type: USER_ACTION_TYPES.CLEAR_ERROR,
});

export const initUserState = (
  userInfo: UserInfo | null
): InitUserStateAction => ({
  type: USER_ACTION_TYPES.INIT_USER_STATE,
  payload: userInfo,
});

// 异步 Action 创建器
export const loginUser = (userInfo: UserInfo) => {
  return (dispatch: any) => {
    dispatch(loginStart());

    try {
      // 这里可以添加登录验证逻辑
      dispatch(loginSuccess(userInfo));
    } catch (error) {
      dispatch(
        loginFailure(error instanceof Error ? error.message : "登录失败")
      );
    }
  };
};

export const logoutUser = () => {
  return (dispatch: any) => {
    try {
      // 这里可以添加登出清理逻辑
      dispatch(logout());
    } catch (error) {
      console.error("登出失败:", error);
    }
  };
};

export const updateUserProfile = (userInfo: Partial<UserInfo>) => {
  return (dispatch: any) => {
    try {
      dispatch(updateUserInfo(userInfo));
    } catch (error) {
      console.error("更新用户信息失败:", error);
    }
  };
};
