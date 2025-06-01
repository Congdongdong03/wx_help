import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import ExploreScreen from "../screens/ExploreScreen";
import PublishEntryScreen from "../screens/PublishEntryScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#FF0000", // Example highlight color (Red)
        tabBarInactiveTintColor: "gray",
      }}
    >
      <Tab.Screen name="首页" component={HomeScreen} />
      <Tab.Screen name="推荐" component={ExploreScreen} />
      <Tab.Screen name="帮帮" component={PublishEntryScreen} />
      <Tab.Screen name="我的" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
