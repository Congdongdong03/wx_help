import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>首页</Text>
      {/* Fixed category buttons - Section 2.2 */}
      <View style={styles.categoryContainer}>
        <Button title="帮帮 (突出)" onPress={() => {}} color="#FF6347" />
        <Button title="租房" onPress={() => {}} />
        <Button title="二手" onPress={() => {}} />
        <Button title="招聘" onPress={() => {}} />
      </View>
      {/* Fixed discount posts - Section 2.3 */}
      <View style={styles.fixedPostContainer}>
        <Text style={styles.fixedPostText}>Coles & Woolworths 折扣 (固定)</Text>
      </View>
      {/* Placeholder for random feed - Section 2.1 */}
      <Text>随机推荐内容区域...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  fixedPostContainer: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    marginBottom: 20,
    width: "90%",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  fixedPostText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default HomeScreen;
