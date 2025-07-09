"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
// 定义 Posts 状态的初始值
const initialState = {
    posts: [],
    loading: false,
    error: null,
};
// Posts Reducer 函数
function postsReducer(state = initialState, action) {
    switch (action.type) {
        case types_1.FETCH_MY_POSTS_REQUEST:
            // 开始请求时，设置 loading 为 true，清除之前的 error
            return Object.assign(Object.assign({}, state), { loading: true, error: null });
        case types_1.FETCH_MY_POSTS_SUCCESS:
            // 请求成功时，更新 posts 列表，设置 loading 为 false
            return Object.assign(Object.assign({}, state), { loading: false, posts: action.payload });
        case types_1.FETCH_MY_POSTS_FAILURE:
            // 请求失败时，设置 error 信息，设置 loading 为 false
            return Object.assign(Object.assign({}, state), { loading: false, error: action.payload, posts: [] });
        default:
            // 对于其他不相关的 action，返回当前 state
            return state;
    }
}
exports.default = postsReducer;
//# sourceMappingURL=reducer.js.map