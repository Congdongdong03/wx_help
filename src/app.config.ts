export default defineAppConfig({
  pages: [
    "pages/index/index",
    "pages/my/index",
    "pages/my/my-posts/my-posts",
    "pages/publish/index",
    "pages/detail/index",
    "pages/post/index",
    "pages/post/form/index",
    "pages/my/edit-nickname/index",
    "pages/my/favorites/index",
    "pages/settings/about/index",
    "pages/settings/help-feedback/index",
    "pages/settings/user-agreement/index",
    "pages/settings/privacy-policy/index",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "帮帮",
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
        pagePath: "pages/post/index",
        text: "发布",
        iconPath: "assets/tabbar/publish.png", // 请替换为你的图标路径
        selectedIconPath: "assets/tabbar/publish_selected.png", // 请替换为你的选中图标路径
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
