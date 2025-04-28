import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import io from 'socket.io-client';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '@/components/topBar';
import {ipAddr} from "@/components/backendip"; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomBar from '@/components/bottomBar';
import { useTheme } from '@/components/ThemeContext';

const socket = io(`http://${ipAddr}:5000`);

const ChatScreen = () => {
  const params = useLocalSearchParams();
  const teamID = params.team_id;
  const userID = parseInt(params.user_id as string);
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchMessages = async (scrollToBottom = false) => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`http://${ipAddr}:5000/getMessages?teamID=${teamID}&offset=${offset}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      });
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
      setMessages(prev => [...data, ...prev]);
      setOffset(prev => prev + data.length);

      if (scrollToBottom) {
        setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
      } else {
      setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }

    setLoadingMore(false);
    setInitialLoading(false);
  };

  useEffect(() => {
    socket.emit('join', { team_id: teamID });
    fetchMessages(true); 

    socket.on('receive_message', (msg: { sender_id: number; sender_name?: string; content: string }) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      socket.off('receive_message');
    };
  }, []);

  const sendMessage = () => {
    if (newMessage.trim() === '') return;

    socket.emit('send_message', {
      sender_id: userID,
      team_id: teamID,
      content: newMessage,
    });

    setNewMessage('');
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <TopBar />

      <View style={styles.header}>
        <Text style={[styles.headerText, { color: theme.text }]}>MTAA Project team chat</Text>
      </View>

      {initialLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          style={[styles.chatBox, { backgroundColor: theme.background }]}
          ref={scrollViewRef}
          scrollEventThrottle={100}
          onScroll={({ nativeEvent }) => {
            if (nativeEvent.contentOffset.y <= 10) {
              fetchMessages();
            }
          }}
        >
          {loadingMore && (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginBottom: 10 }} />
          )}

          {messages.map((msg, index) => {
            const isUser = msg.sender_id === userID;
            return (
              <View key={index} style={[styles.messageBubble, isUser ? styles.myMessage : styles.otherMessage, { backgroundColor: isUser ? theme.primary : theme.card }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="person-circle-outline" size={16} color={theme.text} style={{ marginRight: 5 }} />
                  <Text style={[styles.senderName, { color: theme.text }]}>{isUser ? 'You' : msg.sender_name || 'Member'}</Text>
                </View>
                <Text style={{ color: theme.text }}>{msg.content}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={[styles.inputRow, { backgroundColor: theme.background }]}>
        <TextInput
          placeholder="say something..."
          placeholderTextColor={theme.text}
          value={newMessage}
          onChangeText={setNewMessage}
          style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.primary }]}
        />
        <TouchableOpacity onPress={sendMessage}>
          <Ionicons name="send" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <BottomBar />
    </KeyboardAvoidingView>
   );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    paddingBottom: 20,
  },
  header: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatBox: {
    flex: 1,
    marginVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontWeight: 'bold',
    marginBottom: 3,
    marginRight: 5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 10,
    marginBottom: 100,
  },
  input: {
    flex: 1,
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    color: 'black',
  },
});

export default ChatScreen;
