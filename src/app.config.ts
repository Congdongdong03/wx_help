export default defineAppConfig({
  pages: ["pages/index/index", "pages/my/index", "pages/square/index"],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "WeChat",
    navigationBarTextStyle: "black",
  },
  tabBar: {
    color: "#333",
    selectedColor: "#1AAD19",
    backgroundColor: "#fff",
    borderStyle: "black",
    list: [
      {
        pagePath: "pages/index/index",
        text: "首页",
        iconPath: "assets/tabbar/home.png", // 请替换为你的图标路径
        selectedIconPath: "assets/tabbar/home_selected.png", // 请替换为你的选中图标路径
      },
      {
        pagePath: "pages/square/index",
        text: "广场",
        iconPath: "assets/tabbar/square.png", // 请替换为你的图标路径
        selectedIconPath: "assets/tabbar/square_selected.png", // 请替换为你的选中图标路径
      },
      {
        pagePath: "pages/my/index",
        text: "我的",
        iconPath: "assets/tabbar/my.png", // 请替换为你的图标路径
        selectedIconPath: "assets/tabbar/my_selected.png", // 请替换为你的选中图标路径
      },
    ],
  },
});
