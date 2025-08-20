// 用户信息接口
export interface UserInfo {
  id: string | number;
  openid: string;
  nickName: string;
  avatarUrl: string;
  gender?: number;
  city?: string;
  province?: string;
  country?: string;
  language?: string;
  status?: string;
  token?: string;
}

// 用户状态接口
export interface UserState {
  currentUser: UserInfo | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
}

// Action 类型
export const USER_ACTION_TYPES = {
  LOGIN_START: "user/LOGIN_START",
  LOGIN_SUCCESS: "user/LOGIN_SUCCESS",
  LOGIN_FAILURE: "user/LOGIN_FAILURE",
  LOGOUT: "user/LOGOUT",
  UPDATE_USER_INFO: "user/UPDATE_USER_INFO",
  CLEAR_ERROR: "user/CLEAR_ERROR",
  INIT_USER_STATE: "user/INIT_USER_STATE",
} as const;

// Action 类型定义
export type UserActionTypes =
  (typeof USER_ACTION_TYPES)[keyof typeof USER_ACTION_TYPES];

// Action 接口
export interface LoginStartAction {
  type: typeof USER_ACTION_TYPES.LOGIN_START;
}

export interface LoginSuccessAction {
  type: typeof USER_ACTION_TYPES.LOGIN_SUCCESS;
  payload: UserInfo;
}

export interface LoginFailureAction {
  type: typeof USER_ACTION_TYPES.LOGIN_FAILURE;
  payload: string;
}

export interface LogoutAction {
  type: typeof USER_ACTION_TYPES.LOGOUT;
}

export interface UpdateUserInfoAction {
  type: typeof USER_ACTION_TYPES.UPDATE_USER_INFO;
  payload: Partial<UserInfo>;
}

export interface ClearErrorAction {
  type: typeof USER_ACTION_TYPES.CLEAR_ERROR;
}

export interface InitUserStateAction {
  type: typeof USER_ACTION_TYPES.INIT_USER_STATE;
  payload: UserInfo | null;
}

// 联合类型
export type UserAction =
  | LoginStartAction
  | LoginSuccessAction
  | LoginFailureAction
  | LogoutAction
  | UpdateUserInfoAction
  | ClearErrorAction
  | InitUserStateAction;
