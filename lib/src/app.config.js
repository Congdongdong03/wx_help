"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = defineAppConfig({
    pages: [
        "pages/index/index",
        "pages/my/index",
        "pages/my/my-posts/my-posts",
        "pages/publish/index",
        "pages/detail/index",
        "pages/post/index",
        "pages/post/form/index",
        "pages/my-posts/index",
        "pages/my/edit-nickname/index",
        "pages/my/favorites/index",
        "pages/settings/about/index",
        "pages/settings/help-feedback/index",
        "pages/settings/user-agreement/index",
        "pages/settings/privacy-policy/index",
        "pages/message/index",
        "pages/messages/chat/index",
        "pages/catalogue-image/index",
    ],
    window: {
        backgroundTextStyle: "light",
        navigationBarBackgroundColor: "#fff",
        navigationBarTitleText: "WeChat",
        navigationBarTextStyle: "black",
        enablePullDownRefresh: true,
    },
    tabBar: {
        color: "#999",
        selectedColor: "#007AFF",
        backgroundColor: "#fff",
        borderStyle: "black",
        list: [
            {
                pagePath: "pages/index/index",
                text: "首页",
                iconPath: "assets/tabbar/homepage.png",
                selectedIconPath: "assets/tabbar/homepage.png",
            },
            {
                pagePath: "pages/message/index",
                text: "私信",
                iconPath: "assets/tabbar/message.png",
                selectedIconPath: "assets/tabbar/message.png",
            },
            // {
            //   pagePath: "pages/post/index",
            //   text: "发布",
            //   iconPath: "assets/tabbar/help.png",
            //   selectedIconPath: "assets/tabbar/help.png",
            // },
            {
                pagePath: "pages/publish/index",
                text: "帮帮",
                iconPath: "assets/tabbar/help.png",
                selectedIconPath: "assets/tabbar/help.png",
            },
            {
                pagePath: "pages/my/index",
                text: "我的",
                iconPath: "assets/tabbar/mine.png",
                selectedIconPath: "assets/tabbar/mine.png",
            },
        ],
    },
});
//# sourceMappingURL=app.config.js.map