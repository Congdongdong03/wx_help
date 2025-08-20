import { createStore, applyMiddleware, combineReducers } from "redux";
import thunk from "redux-thunk";
import { userReducer } from "./user/reducer";
import { UserState } from "./user/types";

// 组合所有的 reducers
const rootReducer = combineReducers({
  user: userReducer,
});

// 创建 Redux Store
const store = createStore(rootReducer, applyMiddleware(thunk));

// 导出 RootState 类型
export type RootState = {
  user: UserState;
};

export default store;
