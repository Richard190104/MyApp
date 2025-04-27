import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { logout } from './getUser';

const screenWidth = Dimensions.get('window').width;

export default function TopBar() {
    const insets = useSafeAreaInsets();
    const [menuVisible, setMenuVisible] = React.useState(false);
    const slideAnim = React.useRef(new Animated.Value(-screenWidth)).current;

    const toggleMenu = () => {
        if (menuVisible) {
            Animated.timing(slideAnim, {
                toValue: -screenWidth,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setMenuVisible(false));
        } else {
            setMenuVisible(true);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    };


    return (
        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
            <View style={styles.container}>
                <TouchableOpacity style={styles.iconLeft} onPress={toggleMenu}>
                    <Ionicons name="menu" size={40} color="gray" />
                </TouchableOpacity>
                <MaterialCommunityIcons name="calendar-clock" size={50} color="black" style={styles.iconCenter} />
                <TouchableOpacity style={styles.iconRight} onPress={() => { router.back() }}>
                    <Ionicons name="arrow-back" size={40} color="black" />
                </TouchableOpacity>
            </View>
            {menuVisible && (
                <Animated.View style={[styles.menu, { transform: [{ translateX: slideAnim }] }]}>
                    <Text style={styles.mainText}>Options</Text>
                    <View style={{width: '100%', display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center', transform: [{ translateY: -120 }]}}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { router.push('/settingsScreens/profile') }}>
                        <Text style={styles.ItemText}>Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.ItemText}>Notifications</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.ItemText}>Dark Mode</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { router.push('/settingsScreens/profileScreen') }}>
                        <Text style={styles.ItemText}>Manage Profile</Text>
                    </TouchableOpacity>
                    <View style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { logout(); router.replace('/') }}>
                            <Text style={styles.ItemText}>Logout</Text>
                            <Ionicons name="log-out-outline" size={24} color="black" style={{ marginLeft: 10 }} />
                        </TouchableOpacity>
                    </View>
                    </View>
                    
                </Animated.View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        width: '100%',
        zIndex: 999,
    },
    mainText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'black',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 90,
        paddingHorizontal: 10,
        width: '100%',
        backgroundColor: 'white', 
        zIndex: 10000, 
        marginBottom: 10,
    },
    iconLeft: {
        flex: 1,
        width: '33%',
    },
    iconCenter: {
        flex: 1,
        textAlign: 'center',
        width: '33%',
    },
    iconRight: {
        flex: 1,
        width: "33%",
        alignItems: 'flex-end',
    },
    menu: {
        position: 'absolute',
        top: 90, 
        left: 0,
        height: Dimensions.get('window').height - 90,
        width: '100%',
        backgroundColor: 'white',
        zIndex: 999, 
        padding: 10,
        display: 'flex',
        alignItems: 'center',

    },
    menuItem: {
        padding: 10,
        backgroundColor: 'lightgray',
        width: '80%',
        display: 'flex',
        alignItems: 'center',
        borderRadius: 10,
        marginVertical: 5,
        height: 50,
        justifyContent: 'center',
    },
    ItemText: {
        fontSize: 18,
        color: 'black',
    }
});


