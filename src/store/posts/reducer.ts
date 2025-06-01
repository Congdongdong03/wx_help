import {
  PostsState,
  PostsActionTypes,
  FETCH_MY_POSTS_REQUEST,
  FETCH_MY_POSTS_SUCCESS,
  FETCH_MY_POSTS_FAILURE,
} from "./types";

// 定义 Posts 状态的初始值
const initialState: PostsState = {
  posts: [],
  loading: false,
  error: null,
};

// Posts Reducer 函数
function postsReducer(
  state = initialState,
  action: PostsActionTypes
): PostsState {
  switch (action.type) {
    case FETCH_MY_POSTS_REQUEST:
      // 开始请求时，设置 loading 为 true，清除之前的 error
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_MY_POSTS_SUCCESS:
      // 请求成功时，更新 posts 列表，设置 loading 为 false
      return {
        ...state,
        loading: false,
        posts: action.payload,
      };
    case FETCH_MY_POSTS_FAILURE:
      // 请求失败时，设置 error 信息，设置 loading 为 false
      return {
        ...state,
        loading: false,
        error: action.payload,
        posts: [], // 清空之前的列表或者保留部分数据，取决于您的需求
      };
    default:
      // 对于其他不相关的 action，返回当前 state
      return state;
  }
}

export default postsReducer;
