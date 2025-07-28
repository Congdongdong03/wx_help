# 无限循环调试指南

## 问题现象

`http://localhost:3000/api/posts/pinned?city=sydney&limit=10` 接口一直在被请求，说明前端存在无限循环。

## 可能的原因

1. **useEffect 依赖项问题**：依赖项数组中的值在每次渲染时都是新的引用
2. **状态更新触发重新渲染**：状态更新导致组件重新渲染，进而触发 useEffect
3. **函数引用问题**：loadPosts 函数在每次渲染时都是新的引用
4. **闭包问题**：函数内部访问的状态在函数执行时已经过期

## 调试步骤

### 1. 检查控制台输出

查看浏览器控制台，应该能看到以下调试信息：

- `🔄 useEffect triggered:` - 显示 useEffect 何时被触发
- `🚀 loadPosts: Starting to load posts...` - 显示 loadPosts 何时开始执行
- `🚫 loadPosts: Already loading, skipping...` - 显示是否跳过重复请求
- `✅ loadPosts: Finished loading posts` - 显示 loadPosts 何时完成

### 2. 临时禁用自动加载

如果问题仍然存在，可以临时注释掉 useEffect 中的 loadPosts 调用：

```typescript
useEffect(() => {
  console.log("🔄 useEffect triggered:", {
    selectedCity,
    selectedCategoryId,
    citiesLength: cities.length,
  });
  if (!selectedCity && cities.length > 0) {
    console.log("🏙️ Setting default city:", cities[0].value);
    setSelectedCity(cities[0].value);
    return;
  }
  if (selectedCity) {
    console.log("📡 Loading posts for:", { selectedCity, selectedCategoryId });
    // 临时注释掉这行来测试
    // loadPosts(selectedCity, selectedCategoryId, 1, false);
  }
}, [selectedCity, selectedCategoryId]);
```

### 3. 检查状态变化

在控制台中观察以下状态的变化：

- `selectedCity` 是否在变化
- `selectedCategoryId` 是否在变化
- `cities.length` 是否在变化

### 4. 使用 React DevTools

1. 安装 React DevTools 浏览器扩展
2. 打开开发者工具，切换到 React 标签
3. 观察组件的重新渲染情况
4. 查看 props 和 state 的变化

## 可能的解决方案

### 方案 1：使用 useRef 避免重复调用

```typescript
const lastLoadRef = useRef({ city: "", category: "" });

useEffect(() => {
  if (!selectedCity && cities.length > 0) {
    setSelectedCity(cities[0].value);
    return;
  }
  if (selectedCity) {
    const key = `${selectedCity}-${selectedCategoryId}`;
    const lastKey = `${lastLoadRef.current.city}-${lastLoadRef.current.category}`;

    if (key !== lastKey) {
      lastLoadRef.current = {
        city: selectedCity,
        category: selectedCategoryId,
      };
      loadPosts(selectedCity, selectedCategoryId, 1, false);
    }
  }
}, [selectedCity, selectedCategoryId]);
```

### 方案 2：使用 useMemo 稳定依赖项

```typescript
const stableDeps = useMemo(
  () => ({
    city: selectedCity,
    category: selectedCategoryId,
  }),
  [selectedCity, selectedCategoryId]
);

useEffect(() => {
  if (stableDeps.city) {
    loadPosts(stableDeps.city, stableDeps.category, 1, false);
  }
}, [stableDeps]);
```

### 方案 3：手动触发加载

完全移除 useEffect 中的自动加载，改为手动触发：

```typescript
// 移除 useEffect 中的 loadPosts 调用
// 在用户交互时手动调用
const handleCategoryChange = (categoryId: string) => {
  setSelectedCategoryId(categoryId);
  loadPosts(selectedCity, categoryId, 1, false);
};
```

## 验证修复

修复后，应该看到：

1. 页面加载时只调用一次 API
2. 切换城市或分类时调用一次 API
3. 控制台没有重复的调试信息
4. 网络面板中只有必要的请求
