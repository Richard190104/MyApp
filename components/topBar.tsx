import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { logout } from './getUser';
import { useTheme } from '@/components/ThemeContext';

const screenWidth = Dimensions.get('window').width;

export default function TopBar() {
    const insets = useSafeAreaInsets();
    const [menuVisible, setMenuVisible] = React.useState(false);
    const slideAnim = React.useRef(new Animated.Value(-screenWidth)).current;
    const { theme, toggleTheme } = useTheme();

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
        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: theme.background }]}>
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <TouchableOpacity style={styles.iconLeft} onPress={toggleMenu}>
                    <Ionicons name="menu" size={40} color={theme.text} />
                </TouchableOpacity>
                <MaterialCommunityIcons name="calendar-clock" size={50} color={theme.text} style={styles.iconCenter} />
                <TouchableOpacity style={styles.iconRight} onPress={() => { router.back() }}>
                    <Ionicons name="arrow-back" size={40} color={theme.text} />
                </TouchableOpacity>
            </View>

            {menuVisible && (
                <Animated.View style={[styles.menu, { transform: [{ translateX: slideAnim }], backgroundColor: theme.background }]}>
                    <Text style={[styles.mainText, { color: theme.text }]}>Options</Text>
                    <View style={{ width: '100%', display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center', transform: [{ translateY: -120 }] }}>
                        
                    <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={() => { router.push('/settingsScreens/profileScreen') }}>
                            <Text style={[styles.ItemText, { color: theme.text }]}>Manage Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]}>
                            <Text style={[styles.ItemText, { color: theme.text }]}>Notifications</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={() => {router.push('/inApp/themesManagement')}}>
                            <Text style={[styles.ItemText, { color: theme.text }]}>Dark Mode</Text>
                        </TouchableOpacity>

                        

                        <View style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={() => { logout(); router.replace('/') }}>
                                <Text style={[styles.ItemText, { color: theme.text }]}>Logout</Text>
                                <Ionicons name="log-out-outline" size={24} color={theme.text} style={{ marginLeft: 10 }} />
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
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 90,
        paddingHorizontal: 10,
        width: '100%',
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
        zIndex: 999,
        padding: 10,
        display: 'flex',
        alignItems: 'center',
    },
    menuItem: {
        padding: 10,
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
    },
});
