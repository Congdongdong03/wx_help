import Taro from "@tarojs/taro";

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天前`;
  }
  if (hours > 0) {
    return `${hours}小时前`;
  }
  if (minutes > 0) {
    return `${minutes}分钟前`;
  }
  return "刚刚";
};

export const handlePostError = (error: any): void => {
  console.error("Post operation error:", error);

  let errorMessage = "操作失败，请重试";

  if (error.response) {
    switch (error.response.status) {
      case 401:
        errorMessage = "请先登录";
        break;
      case 403:
        errorMessage = "没有权限执行此操作";
        break;
      case 404:
        errorMessage = "内容不存在";
        break;
      case 500:
        errorMessage = "服务器错误，请稍后重试";
        break;
    }
  }

  Taro.showToast({
    title: errorMessage,
    icon: "none",
    duration: 2000,
  });
};

export const validatePostData = (data: any): boolean => {
  if (!data.title || data.title.trim().length === 0) {
    Taro.showToast({
      title: "标题不能为空",
      icon: "none",
      duration: 2000,
    });
    return false;
  }

  if (data.title.length > 100) {
    Taro.showToast({
      title: "标题不能超过100个字符",
      icon: "none",
      duration: 2000,
    });
    return false;
  }

  if (data.description && data.description.length > 500) {
    Taro.showToast({
      title: "描述不能超过500个字符",
      icon: "none",
      duration: 2000,
    });
    return false;
  }

  return true;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return "";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};
