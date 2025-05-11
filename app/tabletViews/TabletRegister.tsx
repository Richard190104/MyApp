import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import ButtonMain from "@/components/button";

type TabletRegisterProps = {
  email: string;
  username: string;
  password: string;
  repeatPassword: string;
  onEmailChange: (text: string) => void;
  onUsernameChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  onRepeatPasswordChange: (text: string) => void;
  onRegister: () => void;
  onNavigateLogin: () => void;
  theme: any;
};

const TabletRegister: React.FC<TabletRegisterProps> = ({
  email,
  username,
  password,
  repeatPassword,
  onEmailChange,
  onUsernameChange,
  onPasswordChange,
  onRepeatPasswordChange,
  onRegister,
  onNavigateLogin,
  theme,
}) => {
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.leftPanel}>
        <MaterialIcons name="person-add" size={140} color={theme.text} />
        <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
      </View>

      <View style={styles.rightPanel}>
        <Text style={[styles.formTitle, { color: theme.text }]}>Register</Text>

        <TextInput
          style={[styles.input, { borderColor: theme.text, color: theme.text }]}
          placeholder="Name..."
          placeholderTextColor={theme.text}
          value={username}
          onChangeText={onUsernameChange}
        />
        <TextInput
          style={[styles.input, { borderColor: theme.text, color: theme.text }]}
          placeholder="Email..."
          placeholderTextColor={theme.text}
          value={email}
          onChangeText={onEmailChange}
        />
        <TextInput
          style={[styles.input, { borderColor: theme.text, color: theme.text }]}
          placeholder="Password..."
          placeholderTextColor={theme.text}
          secureTextEntry
          value={password}
          onChangeText={onPasswordChange}
        />
        <TextInput
          style={[styles.input, { borderColor: theme.text, color: theme.text }]}
          placeholder="Repeat password..."
          placeholderTextColor={theme.text}
          secureTextEntry
          value={repeatPassword}
          onChangeText={onRepeatPasswordChange}
        />

        <ButtonMain title="Register" onPress={onRegister} styling={1} />
        <Button title="Login" onPress={onNavigateLogin} />
      </View>
    </View>
  );
};

export default TabletRegister;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: "100%",
    padding: 40,
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
    marginTop: 20,
  },
  formTitle: {
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 5,
    width: "80%",
    padding: 10,
    marginTop: 20,
    fontSize: 16,
  },
});
