# PRESET_PLACEHOLDER_HEIGHTS Import Fix

## Problem

The application was encountering the following error in WeChat Mini Program:

```
ReferenceError: PRESET_PLACEHOLDER_HEIGHTS is not defined
    at index.tsx:127
```

## Root Cause

The `PRESET_PLACEHOLDER_HEIGHTS` constant was being used in `src/pages/index/index.tsx` but was not imported from the constants file where it's defined.

## Location of the Error

- **File**: `src/pages/index/index.tsx`
- **Line**: 127-133
- **Context**: Used in skeleton loading logic for generating random placeholder heights

## Solution

Added the missing import to the constants import statement:

### Before

```typescript
import { CATEGORIES } from "../../constants";
```

### After

```typescript
import { CATEGORIES, PRESET_PLACEHOLDER_HEIGHTS } from "../../constants";
```

## Code Context

The constant is used in the skeleton loading logic:

```typescript
const skeletonItems = Array.from({ length: 10 }).map((_, i) => ({
  id: `skeleton-${i}`,
  mockImagePlaceholderHeight:
    PRESET_PLACEHOLDER_HEIGHTS[
      Math.floor(Math.random() * PRESET_PLACEHOLDER_HEIGHTS.length)
    ],
  // ... other properties
}));
```

## Verification

- ✅ Build completes successfully without errors
- ✅ No more `PRESET_PLACEHOLDER_HEIGHTS is not defined` errors
- ✅ Skeleton loading functionality works correctly

## Related Files

- `src/constants/index.ts` - Where `PRESET_PLACEHOLDER_HEIGHTS` is defined
- `src/pages/index/index.tsx` - Where it was being used without import
- `src/hooks/usePosts.ts` - Also uses this constant (correctly imported)
- `src/utils/postUtils.ts` - Also uses this constant (correctly imported)

## Prevention

To prevent similar issues in the future:

1. Always check imports when using constants from other files
2. Use TypeScript's strict mode to catch undefined variable errors
3. Consider using a linter to detect missing imports
4. When refactoring, ensure all dependencies are properly imported
