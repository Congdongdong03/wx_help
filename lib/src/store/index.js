"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redux_1 = require("redux");
const redux_thunk_1 = require("redux-thunk");
// 导入 postsReducer
const reducer_1 = require("./posts/reducer");
// 导入 userReducer
const reducer_2 = require("./user/reducer");
// 组合所有的 reducers
const rootReducer = (0, redux_1.combineReducers)({
    posts: reducer_1.default,
    user: reducer_2.userReducer, // 添加 userReducer
});
// 创建 Redux Store
// 应用了 redux-thunk 中间件来处理异步 action
const store = (0, redux_1.createStore)(rootReducer, (0, redux_1.applyMiddleware)(redux_thunk_1.default));
exports.default = store;
//# sourceMappingURL=index.js.map