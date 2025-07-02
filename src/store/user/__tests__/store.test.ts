import store from "../../index";
import { USER_ACTION_TYPES } from "../types";
import { loginSuccess, logout, updateUserInfo } from "../actions";

describe("Redux Store Configuration", () => {
  it("should have initial state", () => {
    const state = store.getState();

    expect(state).toHaveProperty("user");
    expect(state).toHaveProperty("posts");

    expect(state.user).toEqual({
      currentUser: null,
      isLoggedIn: false,
      isLoading: false,
      error: null,
    });
  });

  it("should handle user login", () => {
    const mockUser = {
      id: "1",
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

    store.dispatch(loginSuccess(mockUser));

    const state = store.getState();
    expect(state.user.currentUser).toEqual(mockUser);
    expect(state.user.isLoggedIn).toBe(true);
    expect(state.user.isLoading).toBe(false);
    expect(state.user.error).toBeNull();
  });

  it("should handle user logout", () => {
    store.dispatch(logout());

    const state = store.getState();
    expect(state.user.currentUser).toBeNull();
    expect(state.user.isLoggedIn).toBe(false);
    expect(state.user.isLoading).toBe(false);
    expect(state.user.error).toBeNull();
  });

  it("should handle user info update", () => {
    const mockUser = {
      id: "1",
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

    // 先登录
    store.dispatch(loginSuccess(mockUser));

    // 然后更新用户信息
    store.dispatch(updateUserInfo({ nickName: "新昵称" }));

    const state = store.getState();
    expect(state.user.currentUser?.nickName).toBe("新昵称");
    expect(state.user.isLoggedIn).toBe(true);
  });
});
