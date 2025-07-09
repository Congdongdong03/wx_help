"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reducer_1 = require("../reducer");
const actions_1 = require("../actions");
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
        expect((0, reducer_1.userReducer)(undefined, { type: "UNKNOWN" })).toEqual(initialState);
    });
    it("should handle LOGIN_START", () => {
        const action = (0, actions_1.loginStart)();
        const newState = (0, reducer_1.userReducer)(initialState, action);
        expect(newState).toEqual(Object.assign(Object.assign({}, initialState), { isLoading: true, error: null }));
    });
    it("should handle LOGIN_SUCCESS", () => {
        const action = (0, actions_1.loginSuccess)(mockUser);
        const newState = (0, reducer_1.userReducer)(initialState, action);
        expect(newState).toEqual({
            currentUser: mockUser,
            isLoggedIn: true,
            isLoading: false,
            error: null,
        });
    });
    it("should handle LOGIN_FAILURE", () => {
        const errorMessage = "登录失败";
        const action = (0, actions_1.loginFailure)(errorMessage);
        const newState = (0, reducer_1.userReducer)(initialState, action);
        expect(newState).toEqual(Object.assign(Object.assign({}, initialState), { isLoading: false, error: errorMessage }));
    });
    it("should handle LOGOUT", () => {
        const loggedInState = {
            currentUser: mockUser,
            isLoggedIn: true,
            isLoading: false,
            error: null,
        };
        const action = (0, actions_1.logout)();
        const newState = (0, reducer_1.userReducer)(loggedInState, action);
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
        const action = (0, actions_1.updateUserInfo)(updatedInfo);
        const newState = (0, reducer_1.userReducer)(loggedInState, action);
        expect(newState.currentUser).toEqual(Object.assign(Object.assign({}, mockUser), updatedInfo));
    });
    it("should handle CLEAR_ERROR", () => {
        const stateWithError = Object.assign(Object.assign({}, initialState), { error: "测试错误" });
        const action = (0, actions_1.clearError)();
        const newState = (0, reducer_1.userReducer)(stateWithError, action);
        expect(newState.error).toBeNull();
    });
    it("should handle INIT_USER_STATE with user", () => {
        const action = (0, actions_1.initUserState)(mockUser);
        const newState = (0, reducer_1.userReducer)(initialState, action);
        expect(newState).toEqual({
            currentUser: mockUser,
            isLoggedIn: true,
            isLoading: false,
            error: null,
        });
    });
    it("should handle INIT_USER_STATE without user", () => {
        const action = (0, actions_1.initUserState)(null);
        const newState = (0, reducer_1.userReducer)(initialState, action);
        expect(newState).toEqual({
            currentUser: null,
            isLoggedIn: false,
            isLoading: false,
            error: null,
        });
    });
});
//# sourceMappingURL=user.test.js.map