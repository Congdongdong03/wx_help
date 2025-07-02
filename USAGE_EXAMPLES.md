# 用户状态管理系统使用示例

## 快速开始

### 1. 在组件中使用用户状态

```typescript
import { useUser } from "../store/user/hooks";

function MyComponent() {
  const { currentUser, isLoggedIn, isLoading, login, logout, updateUser } =
    useUser();

  if (isLoading) {
    return <div>加载中...</div>;
  }

  if (!isLoggedIn) {
    return <div>请先登录</div>;
  }

  return (
    <div>
      <h1>欢迎, {currentUser?.nickName}</h1>
      <p>用户ID: {currentUser?.id}</p>
      <p>OpenID: {currentUser?.openid}</p>
      <button onClick={logout}>登出</button>
    </div>
  );
}
```

### 2. 登录流程示例

```typescript
import { useUser } from "../store/user/hooks";
import { UserService } from "../services/userService";

function LoginComponent() {
  const { login } = useUser();

  const handleWechatLogin = async () => {
    try {
      // 1. 获取微信登录凭证
      const loginRes = await Taro.login();

      // 2. 获取用户信息
      const userProfileRes = await Taro.getUserProfile({
        desc: "用于完善会员资料与登录",
      });

      // 3. 调用登录API
      const userInfo = await UserService.wechatLogin(
        loginRes.code,
        userProfileRes.userInfo
      );

      // 4. 更新Redux状态（自动保存到本地存储）
      login(userInfo);

      Taro.showToast({ title: "登录成功", icon: "success" });
    } catch (error) {
      console.error("登录失败:", error);
      Taro.showToast({ title: "登录失败", icon: "none" });
    }
  };

  return <button onClick={handleWechatLogin}>微信一键登录</button>;
}
```

### 3. 更新用户信息示例

```typescript
import { useUser } from "../store/user/hooks";

function EditProfileComponent() {
  const { currentUser, updateUser } = useUser();
  const [newNickname, setNewNickname] = useState("");

  const handleUpdateNickname = () => {
    if (newNickname.trim()) {
      updateUser({ nickName: newNickname.trim() });
      Taro.showToast({ title: "昵称更新成功", icon: "success" });
    }
  };

  return (
    <div>
      <input
        value={newNickname}
        onChange={(e) => setNewNickname(e.target.value)}
        placeholder="输入新昵称"
      />
      <button onClick={handleUpdateNickname}>更新昵称</button>
    </div>
  );
}
```

### 4. 网络请求示例

```typescript
import { requestWithRedux } from "../utils/requestWithRedux";

// 自动添加用户身份信息的网络请求
async function fetchUserPosts() {
  try {
    const response = await requestWithRedux("/api/posts", {
      method: "GET",
      retryCount: 3,
    });

    return response.data;
  } catch (error) {
    console.error("获取帖子失败:", error);
    throw error;
  }
}

// 上传文件示例
async function uploadAvatar(filePath: string) {
  try {
    const response = await uploadFileWithRedux("/api/upload/avatar", filePath, {
      retryCount: 2,
    });

    return response.data;
  } catch (error) {
    console.error("上传头像失败:", error);
    throw error;
  }
}
```

## 高级用法

### 1. 条件渲染

```typescript
function ConditionalComponent() {
  const { isLoggedIn, currentUser } = useUser();

  return (
    <div>
      {isLoggedIn ? (
        <div>
          <h2>已登录用户</h2>
          <p>昵称: {currentUser?.nickName}</p>
          <p>城市: {currentUser?.city}</p>
        </div>
      ) : (
        <div>
          <h2>未登录用户</h2>
          <p>请先登录以查看完整功能</p>
        </div>
      )}
    </div>
  );
}
```

### 2. 权限控制

```typescript
function ProtectedComponent() {
  const { isLoggedIn, currentUser } = useUser();

  // 检查用户是否已登录
  if (!isLoggedIn) {
    return <div>请先登录</div>;
  }

  // 检查用户状态
  if (currentUser?.status !== "active") {
    return <div>账户已被禁用</div>;
  }

  return (
    <div>
      <h2>受保护的内容</h2>
      <p>只有登录用户才能看到这里</p>
    </div>
  );
}
```

### 3. 状态监听

```typescript
function UserStatusMonitor() {
  const { isLoggedIn, currentUser, error } = useUser();

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      console.log("用户已登录:", currentUser.nickName);
    } else {
      console.log("用户未登录");
    }
  }, [isLoggedIn, currentUser]);

  useEffect(() => {
    if (error) {
      console.error("用户状态错误:", error);
      Taro.showToast({ title: error, icon: "none" });
    }
  }, [error]);

  return null; // 这是一个纯监听组件
}
```

### 4. 自定义 Hook

```typescript
// 创建自定义Hook
function useUserProfile() {
  const { currentUser, updateUser } = useUser();

  const updateNickname = useCallback(
    (nickname: string) => {
      updateUser({ nickName: nickname });
    },
    [updateUser]
  );

  const updateAvatar = useCallback(
    (avatarUrl: string) => {
      updateUser({ avatarUrl });
    },
    [updateUser]
  );

  return {
    user: currentUser,
    updateNickname,
    updateAvatar,
  };
}

// 使用自定义Hook
function ProfileComponent() {
  const { user, updateNickname, updateAvatar } = useUserProfile();

  return (
    <div>
      <img src={user?.avatarUrl} alt="头像" />
      <input
        defaultValue={user?.nickName}
        onBlur={(e) => updateNickname(e.target.value)}
      />
    </div>
  );
}
```

## 调试技巧

### 1. 查看当前状态

```typescript
// 在组件中
function DebugComponent() {
  const userState = useUser();

  console.log("当前用户状态:", userState);

  return <div>查看控制台输出</div>;
}

// 在控制台中
console.log(store.getState().user);
```

### 2. 手动触发状态变化

```typescript
// 在控制台中测试
import store from "../store";
import { loginSuccess, logout } from "../store/user/actions";

// 模拟登录
store.dispatch(
  loginSuccess({
    id: "1",
    openid: "test_openid",
    nickName: "测试用户",
    avatarUrl: "https://example.com/avatar.jpg",
  })
);

// 模拟登出
store.dispatch(logout());
```

### 3. 检查本地存储

```typescript
// 在控制台中
console.log("本地存储的用户信息:", Taro.getStorageSync("userInfo"));
```

## 最佳实践

### 1. 错误处理

```typescript
function SafeUserComponent() {
  const { currentUser, isLoggedIn, error, clearUserError } = useUser();

  useEffect(() => {
    if (error) {
      Taro.showToast({ title: error, icon: "none" });
      // 清除错误
      clearUserError();
    }
  }, [error, clearUserError]);

  if (!isLoggedIn) {
    return <div>请先登录</div>;
  }

  return <div>欢迎, {currentUser?.nickName}</div>;
}
```

### 2. 性能优化

```typescript
// 使用useMemo优化计算
function OptimizedComponent() {
  const { currentUser } = useUser();

  const userDisplayName = useMemo(() => {
    return currentUser?.nickName || "未知用户";
  }, [currentUser?.nickName]);

  return <div>{userDisplayName}</div>;
}
```

### 3. 类型安全

```typescript
// 确保类型安全
function TypedComponent() {
  const { currentUser } = useUser();

  // TypeScript会自动推断类型
  const handleUserAction = (user: NonNullable<typeof currentUser>) => {
    console.log("用户信息:", user.nickName);
  };

  return (
    <div>
      {currentUser && (
        <button onClick={() => handleUserAction(currentUser)}>执行操作</button>
      )}
    </div>
  );
}
```

这些示例展示了如何在各种场景中使用用户状态管理系统。记住，所有的状态变化都会自动同步到本地存储，确保应用重启后状态能够恢复。
