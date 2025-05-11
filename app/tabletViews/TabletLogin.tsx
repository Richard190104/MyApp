import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Button,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import ButtonMain from "@/components/button";
import LoadingOverlay from "@/components/LoadingOverlay";

type TabletLoginProps = {
  email: string;
  password: string;
  onEmailChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  onLogin: () => void;
  onNavigateRegister: () => void;
  onOpenForgot: () => void;
  isLoading: boolean;
  forgotVisible: boolean;
  setForgotVisible: (visible: boolean) => void;
  step: number;
  resetEmail: string;
  resetCode: string;
  newPassword1: string;
  newPassword2: string;
  setResetEmail: (email: string) => void;
  setResetCode: (code: string) => void;
  setNewPassword1: (text: string) => void;
  setNewPassword2: (text: string) => void;
  handleResetFlow: () => void;
  theme: any;
};

const TabletLogin: React.FC<TabletLoginProps> = ({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onNavigateRegister,
  onOpenForgot,
  isLoading,
  forgotVisible,
  setForgotVisible,
  step,
  resetEmail,
  resetCode,
  newPassword1,
  newPassword2,
  setResetEmail,
  setResetCode,
  setNewPassword1,
  setNewPassword2,
  handleResetFlow,
  theme,
}) => {
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.leftPanel}>
        <MaterialIcons name="calendar-today" size={140} color={theme.text} />
        <Text style={[styles.title, { color: theme.text }]}>TaskMaster</Text>
      </View>

      <View style={styles.rightPanel}>
        <Text style={[styles.formTitle, { color: theme.text }]}>Log In</Text>

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

        <ButtonMain title="Log In" onPress={onLogin} styling={1} disabled={isLoading} />
        <Button title="Register" onPress={onNavigateRegister} />

        <TouchableOpacity onPress={onOpenForgot}>
          <Text style={{ color: "blue", marginTop: 10 }}>Forgot password?</Text>
        </TouchableOpacity>

        <Modal visible={forgotVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {step === 1 && (
                <>
                  <Text style={styles.modalTitle}>Enter your email:</Text>
                  <TextInput
                    placeholder="Email"
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    style={styles.modalInput}
                    placeholderTextColor="gray"
                  />
                </>
              )}
              {step === 2 && (
                <>
                  <Text style={styles.modalTitle}>Enter the code you received via email:</Text>
                  <TextInput
                    placeholder="6-digit code"
                    value={resetCode}
                    onChangeText={setResetCode}
                    style={styles.modalInput}
                    placeholderTextColor="gray"
                  />
                </>
              )}
              {step === 3 && (
                <>
                  <Text style={styles.modalTitle}>Enter your new password:</Text>
                  <TextInput
                    placeholder="New password"
                    secureTextEntry
                    value={newPassword1}
                    onChangeText={setNewPassword1}
                    style={styles.modalInput}
                    placeholderTextColor="gray"
                  />
                  <TextInput
                    placeholder="Confirm password"
                    secureTextEntry
                    value={newPassword2}
                    onChangeText={setNewPassword2}
                    style={styles.modalInput}
                    placeholderTextColor="gray"
                  />
                </>
              )}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.okButton}
                  onPress={handleResetFlow}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>OK</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setForgotVisible(false);
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <LoadingOverlay visible={isLoading} />
      </View>
    </View>
  );
};

export default TabletLogin;

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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "85%",
    alignItems: "center",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  modalInput: {
    height: 50,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 6,
    width: "100%",
    paddingHorizontal: 12,
    marginVertical: 10,
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  okButton: {
    flex: 1,
    backgroundColor: "#70ABAF",
    padding: 12,
    marginRight: 5,
    borderRadius: 6,
    alignItems: "center",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F44336",
    padding: 12,
    marginLeft: 5,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
