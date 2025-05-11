import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import BottomBar from '@/components/bottomBar';
import { getUserId } from '@/components/getUser';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '@/components/topBar';
import { Ionicons } from '@expo/vector-icons';
import { ipAddr } from '@/components/backendip';
import { useTheme } from '@/components/ThemeContext'; 
import TabletHomeScreen from '../tabletViews/TabletHomeScreen';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { BackgroundFetchStatus, BackgroundFetchResult } from 'expo-background-fetch';

const isTablet = Dimensions.get('window').width >= 768;

const FETCH_TASK_NAME = 'USER_TASK_FETCH';

TaskManager.defineTask(FETCH_TASK_NAME, async () => {
  const startTime = Date.now();
  let notificationCount = 0;

  try {
    const userId = await getUserId();
    const token = await AsyncStorage.getItem('authToken');
    if (!userId || !token) {
      console.warn('[Metrics] Missing user ID or token');
      return BackgroundFetchResult.NoData;
    }

    const response = await fetch(`http://${ipAddr}:5000/getUserTasks?user_id=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      console.error(`[Metrics] Failed to fetch tasks: ${response.status}`);
      return BackgroundFetchResult.Failed;
    }

    const tasks = await response.json();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const scheduledIds = new Set(scheduled.map(n => n.identifier));
    const now = Date.now();

    for (const task of tasks) {
      if (task.task_completed || !task.deadline) continue;

      const isoString = task.deadline.replace(' ', 'T');
      const deadlineMs = new Date(isoString).getTime();
      const triggerMs = deadlineMs - 24 * 60 * 60 * 1000;
      if (triggerMs <= now) continue;

      const notificationId = `${task.task_name}_${deadlineMs}`;
      if (!scheduledIds.has(notificationId)) {
        await Notifications.scheduleNotificationAsync({
          identifier: notificationId,
          content: {
            title: `${task.task_name} due soon`,
            body: `You have 24 hours left for "${task.task_name}" in ${task.team_name}.`,
            data: { task: task.task_name },
          },
          trigger: { timestamp: triggerMs },
        });
        notificationCount++;
      }
    }

    const duration = Date.now() - startTime;

    console.log(`[Metrics] Background task run complete.`);
    console.log(`[Metrics] Tasks checked: ${tasks.length}`);
    console.log(`[Metrics] New notifications scheduled: ${notificationCount}`);
    console.log(`[Metrics] Duration: ${duration}ms`);

    return BackgroundFetchResult.NewData;
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`[Metrics] ❌ Error during background task:`, err);
    console.log(`[Metrics] Duration before error: ${duration}ms`);
    return BackgroundFetchResult.Failed;
  }
});


export default function HomeScreen() {  
  const router = useRouter();
  const { theme } = useTheme(); 
  const [user, setUser] = useState<number | null>(null);
  const [teams, setTeams] = useState<{ id: number; name: string; creator_id: number }[]>([]);
  const localParams = useLocalSearchParams();

  useEffect(() => {
    const fetchUserAndTeams = async () => {
      try {
        const id = await getUserId();
        const token = await AsyncStorage.getItem('authToken');

        if (id !== null && token !== null) {
          setUser(id); 

          const state = await NetInfo.fetch();
          if (state.isConnected) {
            console.log("Internet is connected. Fetching teams from backend...");
            try {
              const response = await fetch(`http://${ipAddr}:5000/getTeams?userID=${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = await response.json();
              if (Array.isArray(data)) {
                setTeams(data);
                await AsyncStorage.setItem(`teams_${id}`, JSON.stringify(data));
                console.log("Teams fetched and stored locally.");
                
                if (localParams?.onTeam === "1" && localParams?.team_name) {
                  const matchedTeam = data.find(team => team.name === localParams.team_name);
                  if (matchedTeam) {
                    router.replace({
                      pathname: './team',
                      params: {
                        team_id: matchedTeam.id.toString(),
                        team_name: matchedTeam.name,
                        team_creator_id: matchedTeam.creator_id,
                        usero: id.toString()
                      }
                    });
                  } else {
                    console.warn("Team with given name not found.");
                  }
                }
              } else {
                console.warn("Unexpected response:", data);
              }
            } catch (error) {
              console.error("Error fetching teams from backend:", error);
            }
          } else {
            console.log("No internet connection. Trying to load teams from cache...");
            const cached = await AsyncStorage.getItem(`teams_${id}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              setTeams(parsed);
              console.log("Teams loaded from cache.");
            } else {
              console.warn("No cached teams found.");
            }
          }

        } else {
          console.warn("User ID or token was null");
        }
      } catch (error) {
        console.error("Unexpected error in fetchUserAndTeams:", error);
      }
    };

    const registerTask = async () => {
      const status = await BackgroundFetch.getStatusAsync();
      if (status === BackgroundFetchStatus.Available) {
        const tasks = await TaskManager.getRegisteredTasksAsync();
        if (!tasks.find(t => t.taskName === FETCH_TASK_NAME)) {
          await BackgroundFetch.registerTaskAsync(FETCH_TASK_NAME, {
            minimumInterval: 3600,
            stopOnTerminate: false,
            startOnBoot: true,
          });
          console.log("✅ Background fetch task registered");
        }
      } else {
        console.warn("⚠️ Background fetch not available.");
      }
    };

    fetchUserAndTeams();
    registerTask();
  }, []);

  if (isTablet) return <TabletHomeScreen />;

  return (
    <SafeAreaView style={[styles.MainContainer, { backgroundColor: theme.background }]}>
      <TopBar />

      <View style={styles.headerRow}>
        <Text style={[styles.SmolText, { color: theme.text }]}>Teams</Text>

        <TouchableOpacity
          onPress={() => router.push('/inApp/createTeamScreen')}
          style={[styles.addButton, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={[styles.teamList, { paddingBottom: 80 }]}
      >
        {teams.length > 0 ? (
          teams.map(team => (
            <TouchableOpacity
              key={team.id}
              style={[styles.teamButton, { backgroundColor: theme.card }]} 
              onPress={() => router.push({ pathname: './team', params: { team_id: team.id.toString(), team_name: team.name, team_creator_id: team.creator_id, usero: user?.toString() } })}
            >
              <Text style={[styles.teamButtonText, { color: theme.text }]}> {team.name} </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[styles.noTeamsText, { color: theme.text }]}> You are not a member of any team yet. </Text>
        )}
      </ScrollView>

      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  MainContainer: {
    padding: 10,
    flex: 1,
    width: "100%",
  },
  SmolText: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
    fontWeight: "800",
    textAlign: "left",
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 10,
  },
  addButton: {
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  teamButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  teamButtonText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  noTeamsText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  teamList: {
    width: "100%",
    paddingHorizontal: 30,
    marginTop: 10,
  },
});
