  import React, { useEffect, useState } from "react";
  import { useNavigation } from "@react-navigation/native";
  import { SafeAreaView, FlatList, StatusBar, StyleSheet, View, TextInput, Button, Text, Image } from "react-native";
  import ButtonMain from "@/components/button";
  import { useRouter } from "expo-router";
  import {getUserId, storeUser, storeUserId} from "@/components/getUser"; 
  import {ipAddr} from "@/components/backendip"; 
  import { useTheme } from '@/components/ThemeContext';
  import { MaterialIcons } from '@expo/vector-icons';
  import { Dimensions } from 'react-native';
  const isTablet = Dimensions.get('window').width >= 768;
  
  const TabletIndex = () => {
    const navigation = useNavigation();
    const router = useRouter();
    const { theme } = useTheme();
    
    useEffect(() => {
      navigation.setOptions({
        gestureEnabled: false, 
      });
    }, [navigation]);


  
      return (
        <View style={[tabletStyles.container, { backgroundColor: theme.background }]}>
          <View style={tabletStyles.leftPanel}>
            <MaterialIcons name="calendar-today" size={150} color={theme.text} />
          </View>
          <View style={tabletStyles.rightPanel}>
            <Text style={[tabletStyles.title, { color: theme.text }]}>TaskMaster</Text>
            <ButtonMain title="Log In" onPress={() => router.push("/auth/login")} styling={1} />
            <ButtonMain title="Register" onPress={() => router.push("/auth/register")} />
          </View>
        </View>
      );
  };
  
  const tabletStyles = StyleSheet.create({
    container: {
      flexDirection: "row",
      height: "100%",
      width: "100%",
      padding: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    leftPanel: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    rightPanel: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 60,
      fontWeight: "bold",
      marginBottom: 40,
    },
  });
  
  export default TabletIndex;
  
  