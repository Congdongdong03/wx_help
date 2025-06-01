import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>我的</Text>
      <View style={styles.menuItem}>
        <Button title="个人资料" onPress={() => {}} />
      </View>
      <View style={styles.menuItem}>
        <Button title="收藏管理" onPress={() => {}} />
      </View>
      <View style={styles.menuItem}>
        <Button title="我的发布" onPress={() => {}} />
      </View>
      <View style={styles.menuItem}>
        <Button title="反馈与设置" onPress={() => {}} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  menuItem: {
    width: "80%",
    marginBottom: 15,
  },
});

export default ProfileScreen;
