import { createStore, applyMiddleware, combineReducers } from "redux";
import thunkMiddleware from "redux-thunk";
// 导入 postsReducer
import postsReducer from "./posts/reducer";
// 导入 PostsState 类型
import { PostsState } from "./posts/types";

// 组合所有的 reducers
const rootReducer = combineReducers({
  // 例如: user: userReducer,
  posts: postsReducer, // 添加 postsReducer
  // 您可以在这里添加其他模块的 reducer
});

// 创建 Redux Store
// 应用了 redux-thunk 中间件来处理异步 action
// 注意：这里的 applyMiddleware(thunkMiddleware) 可能会有 TypeScript 类型错误，我们之后可以再处理
const store = createStore(rootReducer, applyMiddleware(thunkMiddleware));

// 导出 RootState 类型，现在包含 posts 状态
export type RootState = {
  posts: PostsState;
  // 其他模块的状态类型...
};

export default store;
