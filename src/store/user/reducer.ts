import { UserState, UserAction, USER_ACTION_TYPES } from "./types";

// 初始状态
const initialState: UserState = {
  currentUser: null,
  isLoggedIn: false,
  isLoading: false,
  error: null,
};

// Reducer
export const userReducer = (
  state: UserState = initialState,
  action: UserAction
): UserState => {
  switch (action.type) {
    case USER_ACTION_TYPES.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case USER_ACTION_TYPES.LOGIN_SUCCESS:
      return {
        ...state,
        currentUser: action.payload,
        isLoggedIn: true,
        isLoading: false,
        error: null,
      };

    case USER_ACTION_TYPES.LOGIN_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case USER_ACTION_TYPES.LOGOUT:
      return {
        ...state,
        currentUser: null,
        isLoggedIn: false,
        isLoading: false,
        error: null,
      };

    case USER_ACTION_TYPES.UPDATE_USER_INFO:
      return {
        ...state,
        currentUser: state.currentUser
          ? { ...state.currentUser, ...action.payload }
          : null,
      };

    case USER_ACTION_TYPES.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case USER_ACTION_TYPES.INIT_USER_STATE:
      return {
        ...state,
        currentUser: action.payload,
        isLoggedIn: !!action.payload,
        isLoading: false,
        error: null,
      };

    default:
      return state;
  }
};
