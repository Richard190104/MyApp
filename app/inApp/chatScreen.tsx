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

const socket = io(`http://${ipAddr}:5000`);

const ChatScreen = () => {
  const params = useLocalSearchParams();
  const teamID = params.teamID;
  const userID = parseInt(params.userID as string);

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
      const res = await fetch(`http://${ipAddr}:5000/getMessages?teamID=${teamID}&offset=${offset}&limit=${limit}`);
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
    fetchMessages(true); // first load

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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <TopBar />
      <View style={styles.header}>
        <Text style={styles.headerText}>MTAA Project team chat</Text>
      </View>

      {initialLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#70ABAF" />
        </View>
      ) : (
        <ScrollView
          style={styles.chatBox}
          ref={scrollViewRef}
          scrollEventThrottle={100}
          onScroll={({ nativeEvent }) => {
            if (nativeEvent.contentOffset.y <= 10) {
              fetchMessages();
            }
          }}
        >
          {loadingMore && (
            <ActivityIndicator size="small" color="#70ABAF" style={{ marginBottom: 10 }} />
          )}

          {messages.map((msg, index) => {
            const isUser = msg.sender_id === userID;
            return (
              <View key={index} style={[styles.messageBubble, isUser ? styles.myMessage : styles.otherMessage]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="person-circle-outline" size={16} color="black" style={{ marginRight: 5 }} />
                  <Text style={styles.senderName}>{isUser ? 'You' : msg.sender_name || 'Member'}</Text>
                </View>
                <Text>{msg.content}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.inputRow}>
        <TextInput
          placeholder="say something..."
          value={newMessage}
          onChangeText={setNewMessage}
          style={styles.input}
        />
        <TouchableOpacity onPress={sendMessage}>
          <Ionicons name="send" size={24} color="#70ABAF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    backgroundColor: '#ddd',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#e0e0e0',
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
