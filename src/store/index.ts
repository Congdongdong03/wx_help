import { createStore, applyMiddleware, combineReducers } from "redux";
import thunk from "redux-thunk";
// 导入 postsReducer
import postsReducer from "./posts/reducer";
// 导入 PostsState 类型
import { PostsState } from "./posts/types";
// 导入 userReducer
import { userReducer } from "./user/reducer";
// 导入 UserState 类型
import { UserState } from "./user/types";

// 组合所有的 reducers
const rootReducer = combineReducers({
  posts: postsReducer,
  user: userReducer, // 添加 userReducer
});

// 创建 Redux Store
// 应用了 redux-thunk 中间件来处理异步 action
const store = createStore(rootReducer, applyMiddleware(thunk));

// 导出 RootState 类型，现在包含 posts 和 user 状态
export type RootState = {
  posts: PostsState;
  user: UserState;
};

export default store;
