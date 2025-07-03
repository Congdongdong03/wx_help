# Redux Compatibility Fix for WeChat Mini Program

## Problem

The application was encountering the following error in WeChat Mini Program:

```
TypeError: Cannot read property 'useSyncExternalStore' of undefined
```

## Root Cause

This error occurred because:

1. The project was using **Redux 5.0.1** which internally uses the `useSyncExternalStore` hook
2. The `useSyncExternalStore` hook is not available in the WeChat Mini Program environment
3. Redux 5.x requires React 18+ and uses newer React APIs that aren't fully supported in Taro/WeChat Mini Program

## Solution

Downgraded Redux to version 4.x which doesn't use `useSyncExternalStore`:

### Package.json Changes

```json
{
  "react-redux": "^8.1.3", // Changed from ^9.2.0
  "redux": "^4.2.1", // Changed from ^5.0.1
  "redux-thunk": "^2.4.2" // Changed from ^3.1.0
}
```

### Store Configuration Changes

In `src/store/index.ts`, changed the import:

```typescript
// Before (Redux 5)
import { thunk } from "redux-thunk";

// After (Redux 4)
import thunk from "redux-thunk";
```

## Compatibility Notes

### Redux 4 vs Redux 5

- **Redux 4**: Uses `useSelector` and `useDispatch` hooks, compatible with WeChat Mini Program
- **Redux 5**: Uses `useSyncExternalStore` internally, not compatible with WeChat Mini Program

### React-Redux 8 vs 9

- **React-Redux 8**: Compatible with Redux 4 and WeChat Mini Program
- **React-Redux 9**: Requires Redux 5 and uses newer React APIs

## Verification

After the fix:

1. ✅ Build completes successfully without errors
2. ✅ No `useSyncExternalStore` errors in console
3. ✅ Redux store functionality remains intact
4. ✅ All existing Redux actions and reducers continue to work

## Recommendations

### For Future Development

1. **Stick with Redux 4.x** for WeChat Mini Program projects
2. **Test thoroughly** when upgrading Redux versions
3. **Consider alternatives** like Zustand or Context API for simpler state management

### Alternative State Management

For new projects, consider:

- **Zustand**: Lighter weight, no compatibility issues
- **Context API**: Built into React, no external dependencies
- **Taro's built-in state management**: For simple cases

## Build Commands

```bash
# Clean and rebuild
rm -rf dist/ && npm run build:weapp

# Development mode
npm run dev:weapp
```

## Related Files

- `package.json` - Dependency versions
- `src/store/index.ts` - Redux store configuration
- `src/store/user/actions.ts` - User actions (compatible)
- `src/store/posts/actions.ts` - Posts actions (compatible)
