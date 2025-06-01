// 定义 Action Types
export const FETCH_MY_POSTS_REQUEST = "FETCH_MY_POSTS_REQUEST";
export const FETCH_MY_POSTS_SUCCESS = "FETCH_MY_POSTS_SUCCESS";
export const FETCH_MY_POSTS_FAILURE = "FETCH_MY_POSTS_FAILURE";

// 定义帖子的类型 (与之前 my-posts.tsx 中的 interface Post 相同)
export interface Post {
  id: number;
  title: string;
  content: string;
  images?: string[];
  category: string;
  created_at: string;
  status: "pending" | "approved" | "rejected" | "taken_down";
  views: number;
  likes: number;
}

// 定义 Posts 状态的类型
export interface PostsState {
  posts: Post[];
  loading: boolean;
  error: string | null;
}

// 定义 Action 接口
interface FetchMyPostsRequestAction {
  type: typeof FETCH_MY_POSTS_REQUEST;
}

interface FetchMyPostsSuccessAction {
  type: typeof FETCH_MY_POSTS_SUCCESS;
  payload: Post[];
}

interface FetchMyPostsFailureAction {
  type: typeof FETCH_MY_POSTS_FAILURE;
  payload: string;
}

// 组合所有的 Posts 相关的 Action 类型
export type PostsActionTypes =
  | FetchMyPostsRequestAction
  | FetchMyPostsSuccessAction
  | FetchMyPostsFailureAction;
