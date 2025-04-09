import React, { useEffect, useState } from "react";
import { SafeAreaView, FlatList, StatusBar, StyleSheet, View, TextInput, Button, Text, Image } from "react-native";
import ButtonMain from "../components/button";
import { useRouter } from "expo-router";
import {getUserId, storeUserId} from "../components/getUser"; 
import {ipAddr} from "../components/backendip"; 

const App = () => {
  const router = useRouter();

  async function Login() {
    try{
        await getUserId().then((userId) => {
            console.log("User ID:", userId);
            if (userId) {
                router.replace("/inApp/homeScreen");
            }
        });
    } catch (error) {
        console.error("Error fetching user ID:", error);
    }
}

useEffect(() => {
  Login();
}), [];
  return (
    <View style={styles.MainContainer}>
        <Text style={styles.MainText}>TaskMaster</Text>
        <Image source={require('../assets/images/calendar.png')} style={styles.mainLogo} />
        <ButtonMain title="Log In" onPress={() => router.push('/auth/login')} styling={1}></ButtonMain>
        <ButtonMain title="Register" onPress={() => router.push('/auth/register')}></ButtonMain>
        <ButtonMain title="Skip(odstranit toto potom)" onPress={Login}></ButtonMain>
    </View>
  );
};

const styles = StyleSheet.create({
 
  MainContainer: {
    padding: 10,
    display: "flex",
    height: "100%",
    width: "100%",
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  MainText:{
    fontSize: 50,
    fontWeight: "bold",
  },
  mainLogo:{
    width: 150,
    height: 150,
    margin: 40,
  }
});

export default App;

