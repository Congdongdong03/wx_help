import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ExploreScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>内容推荐</Text>
      <Text>这里将展示帮帮、租房、二手、招聘等分类信息。</Text>
      <Text>（瀑布流卡片设计）</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});

export default ExploreScreen;
