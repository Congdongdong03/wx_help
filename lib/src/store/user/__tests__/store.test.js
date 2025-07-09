"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const actions_1 = require("../actions");
describe("Redux Store Configuration", () => {
    it("should have initial state", () => {
        const state = index_1.default.getState();
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
        index_1.default.dispatch((0, actions_1.loginSuccess)(mockUser));
        const state = index_1.default.getState();
        expect(state.user.currentUser).toEqual(mockUser);
        expect(state.user.isLoggedIn).toBe(true);
        expect(state.user.isLoading).toBe(false);
        expect(state.user.error).toBeNull();
    });
    it("should handle user logout", () => {
        index_1.default.dispatch((0, actions_1.logout)());
        const state = index_1.default.getState();
        expect(state.user.currentUser).toBeNull();
        expect(state.user.isLoggedIn).toBe(false);
        expect(state.user.isLoading).toBe(false);
        expect(state.user.error).toBeNull();
    });
    it("should handle user info update", () => {
        var _a;
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
        index_1.default.dispatch((0, actions_1.loginSuccess)(mockUser));
        // 然后更新用户信息
        index_1.default.dispatch((0, actions_1.updateUserInfo)({ nickName: "新昵称" }));
        const state = index_1.default.getState();
        expect((_a = state.user.currentUser) === null || _a === void 0 ? void 0 : _a.nickName).toBe("新昵称");
        expect(state.user.isLoggedIn).toBe(true);
    });
});
//# sourceMappingURL=store.test.js.map