"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const bottom_tabs_1 = require("@react-navigation/bottom-tabs");
const HomeScreen_1 = require("../screens/HomeScreen");
const ExploreScreen_1 = require("../screens/ExploreScreen");
const PublishEntryScreen_1 = require("../screens/PublishEntryScreen");
const ProfileScreen_1 = require("../screens/ProfileScreen");
const Tab = (0, bottom_tabs_1.createBottomTabNavigator)();
const MainTabNavigator = () => {
    return ((0, jsx_runtime_1.jsxs)(Tab.Navigator, { screenOptions: {
            tabBarActiveTintColor: "#FF0000", // Example highlight color (Red)
            tabBarInactiveTintColor: "gray",
        }, children: [(0, jsx_runtime_1.jsx)(Tab.Screen, { name: "\u9996\u9875", component: HomeScreen_1.default }), (0, jsx_runtime_1.jsx)(Tab.Screen, { name: "\u63A8\u8350", component: ExploreScreen_1.default }), (0, jsx_runtime_1.jsx)(Tab.Screen, { name: "\u5E2E\u5E2E", component: PublishEntryScreen_1.default }), (0, jsx_runtime_1.jsx)(Tab.Screen, { name: "\u6211\u7684", component: ProfileScreen_1.default })] }));
};
exports.default = MainTabNavigator;
//# sourceMappingURL=MainTabNavigator.js.map