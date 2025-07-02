import { userReducer } from "../reducer";
import { USER_ACTION_TYPES } from "../types";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUserInfo,
  clearError,
  initUserState,
} from "../actions";

describe("User Reducer", () => {
  const initialState = {
    currentUser: null,
    isLoggedIn: false,
    isLoading: false,
    error: null,
  };

  const mockUser = {
    id: 1,
    openid: "test_openid",
    nickName: "测试用户",
    avatarUrl: "https://example.com/avatar.jpg",
    gender: 1,
    city: "北京",
    province: "北京",
    country: "中国",
    language: "zh_CN",
    status: "active",
    token: "test_token",
  };

  it("should return initial state", () => {
    expect(userReducer(undefined, { type: "UNKNOWN" })).toEqual(initialState);
  });

  it("should handle LOGIN_START", () => {
    const action = loginStart();
    const newState = userReducer(initialState, action);

    expect(newState).toEqual({
      ...initialState,
      isLoading: true,
      error: null,
    });
  });

  it("should handle LOGIN_SUCCESS", () => {
    const action = loginSuccess(mockUser);
    const newState = userReducer(initialState, action);

    expect(newState).toEqual({
      currentUser: mockUser,
      isLoggedIn: true,
      isLoading: false,
      error: null,
    });
  });

  it("should handle LOGIN_FAILURE", () => {
    const errorMessage = "登录失败";
    const action = loginFailure(errorMessage);
    const newState = userReducer(initialState, action);

    expect(newState).toEqual({
      ...initialState,
      isLoading: false,
      error: errorMessage,
    });
  });

  it("should handle LOGOUT", () => {
    const loggedInState = {
      currentUser: mockUser,
      isLoggedIn: true,
      isLoading: false,
      error: null,
    };

    const action = logout();
    const newState = userReducer(loggedInState, action);

    expect(newState).toEqual(initialState);
  });

  it("should handle UPDATE_USER_INFO", () => {
    const loggedInState = {
      currentUser: mockUser,
      isLoggedIn: true,
      isLoading: false,
      error: null,
    };

    const updatedInfo = { nickName: "新昵称" };
    const action = updateUserInfo(updatedInfo);
    const newState = userReducer(loggedInState, action);

    expect(newState.currentUser).toEqual({
      ...mockUser,
      ...updatedInfo,
    });
  });

  it("should handle CLEAR_ERROR", () => {
    const stateWithError = {
      ...initialState,
      error: "测试错误",
    };

    const action = clearError();
    const newState = userReducer(stateWithError, action);

    expect(newState.error).toBeNull();
  });

  it("should handle INIT_USER_STATE with user", () => {
    const action = initUserState(mockUser);
    const newState = userReducer(initialState, action);

    expect(newState).toEqual({
      currentUser: mockUser,
      isLoggedIn: true,
      isLoading: false,
      error: null,
    });
  });

  it("should handle INIT_USER_STATE without user", () => {
    const action = initUserState(null);
    const newState = userReducer(initialState, action);

    expect(newState).toEqual({
      currentUser: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,
    });
  });
});
