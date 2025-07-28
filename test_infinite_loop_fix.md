# 无限循环问题修复

## 问题描述

在实现分离的帖子接口后，前端出现了无限循环的问题，导致页面不断重新加载数据。

## 问题原因

无限循环是由以下几个原因造成的：

1. **useCallback 依赖项问题**：`loadPosts` 函数的 `useCallback` 依赖项包含了 `isLoading`，导致每次 `isLoading` 状态变化时都会重新创建函数
2. **useEffect 依赖项问题**：其他函数（`loadMore`, `retryLoad`, `refresh`）的依赖项中包含了 `loadPosts`，形成循环依赖
3. **组件 useEffect 依赖项问题**：在 `src/pages/index/index.tsx` 中，`useEffect` 的依赖项包含了 `loadPosts`，导致每次 `loadPosts` 变化时都会重新执行

## 修复方案

### 1. 修复 loadPosts 的 useCallback 依赖项

```typescript
// 修复前
const loadPosts = useCallback(
  async (
    city: string,
    categoryId: string,
    page: number,
    append: boolean = false
  ) => {
    // ... 函数体
  },
  [isLoading] // ❌ 这会导致无限循环
);

// 修复后
const loadPosts = useCallback(
  async (
    city: string,
    categoryId: string,
    page: number,
    append: boolean = false
  ) => {
    // ... 函数体
  },
  [] // ✅ 移除所有依赖项，避免死循环
);
```

### 2. 修复其他函数的依赖项

```typescript
// 修复前
const loadMore = useCallback(() => {
  // ... 函数体
}, [
  isLoading,
  hasMoreData,
  currentPage,
  loadPosts,
  selectedCity,
  selectedCategoryId,
]); // ❌ 包含 loadPosts

// 修复后
const loadMore = useCallback(() => {
  // ... 函数体
}, [isLoading, hasMoreData, currentPage, selectedCity, selectedCategoryId]); // ✅ 移除 loadPosts
```

### 3. 修复组件的 useEffect 依赖项

```typescript
// 修复前
useEffect(() => {
  if (selectedCity) {
    loadPosts(selectedCity, selectedCategoryId, 1, false);
  }
}, [selectedCity, selectedCategoryId, cities, loadPosts]); // ❌ 包含 loadPosts

// 修复后
useEffect(() => {
  if (selectedCity) {
    loadPosts(selectedCity, selectedCategoryId, 1, false);
  }
}, [selectedCity, selectedCategoryId, cities]); // ✅ 移除 loadPosts
```

## 修复原理

1. **避免循环依赖**：通过移除 `loadPosts` 在依赖项中的引用，避免函数重新创建导致的循环
2. **使用闭包**：`loadPosts` 函数内部可以访问到当前作用域的所有变量，不需要通过依赖项传递
3. **保持稳定性**：其他函数只需要依赖真正会变化的变量，而不是函数本身

## 验证方法

1. 打开浏览器开发者工具的控制台
2. 观察是否有重复的 API 请求
3. 检查 `loadPosts` 函数是否被重复调用
4. 确认页面加载后数据只加载一次

## 注意事项

- 这种修复方式依赖于 React 的闭包特性
- 如果将来需要访问 `loadPosts` 的最新版本，可能需要使用 `useRef` 来存储函数引用
- 建议在开发环境中使用 React DevTools 来监控组件的重新渲染情况
