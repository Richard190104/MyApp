import { View, StyleSheet, TouchableOpacity, Image, SafeAreaView, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/components/ThemeContext';

function goMainPage(){
    router.push('/inApp/homeScreen');
}

function goChat(){
    router.push('/inApp/inviteScreen');
}

function goCalendar(){
    router.push('/inApp/calendar');
}



const BottomBar = () => {
    const insets = useSafeAreaInsets(); 
    const { theme, toggleTheme } = useTheme();

    return (
        <SafeAreaView style={[styles.safeArea, { paddingBottom: insets.bottom,  backgroundColor: theme.bottombar  }]}>
            <View style={styles.container}>
                <TouchableOpacity onPress={goMainPage}>
                    <MaterialIcons name="home" size={35} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={goChat}>
                    <MaterialIcons name="chat" size={35} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={goCalendar}>
                    <MaterialIcons name="calendar-today" size={35} color={theme.text} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        borderRadius: 25,
        zIndex: 1000,
    },
    container: {

        height: 80,
        justifyContent: "space-around",
        alignItems: "center",
        flexDirection: "row",
    },
    icon: { 
        width: 35,
        height: 35,
        margin: 10,
    }
});

export default BottomBar;