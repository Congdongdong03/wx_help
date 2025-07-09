"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userReducer = void 0;
const types_1 = require("./types");
// 初始状态
const initialState = {
    currentUser: null,
    isLoggedIn: false,
    isLoading: false,
    error: null,
};
// Reducer
const userReducer = (state = initialState, action) => {
    switch (action.type) {
        case types_1.USER_ACTION_TYPES.LOGIN_START:
            return Object.assign(Object.assign({}, state), { isLoading: true, error: null });
        case types_1.USER_ACTION_TYPES.LOGIN_SUCCESS:
            return Object.assign(Object.assign({}, state), { currentUser: action.payload, isLoggedIn: true, isLoading: false, error: null });
        case types_1.USER_ACTION_TYPES.LOGIN_FAILURE:
            return Object.assign(Object.assign({}, state), { isLoading: false, error: action.payload });
        case types_1.USER_ACTION_TYPES.LOGOUT:
            return Object.assign(Object.assign({}, state), { currentUser: null, isLoggedIn: false, isLoading: false, error: null });
        case types_1.USER_ACTION_TYPES.UPDATE_USER_INFO:
            return Object.assign(Object.assign({}, state), { currentUser: state.currentUser
                    ? Object.assign(Object.assign({}, state.currentUser), action.payload) : null });
        case types_1.USER_ACTION_TYPES.CLEAR_ERROR:
            return Object.assign(Object.assign({}, state), { error: null });
        case types_1.USER_ACTION_TYPES.INIT_USER_STATE:
            return Object.assign(Object.assign({}, state), { currentUser: action.payload, isLoggedIn: !!action.payload, isLoading: false, error: null });
        default:
            return state;
    }
};
exports.userReducer = userReducer;
//# sourceMappingURL=reducer.js.map