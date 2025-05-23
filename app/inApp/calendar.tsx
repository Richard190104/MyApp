import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Topbar from '@/components/topBar';
import BottomBar from '@/components/bottomBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ipAddr } from "@/components/backendip";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { Platform, Linking } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
import { useTheme } from '@/components/ThemeContext';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CalendarScreen() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { theme, toggleTheme } = useTheme();

    interface Task {
      name: string;
      description: string;
      completed: boolean;
      assignedTo: string;
      deadline: string | null;
      teamName: string;
    }

    const [taskMap, setTaskMap] = useState<Record<string, Task>>({});
    useEffect(() => {
      crashlytics().log('Opened Calendar');
    }, []);

    const getTasks = async (userId: number) => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const netState = await NetInfo.fetch();
    
        if (netState.isConnected) {
          console.log("Internet is connected. Fetching tasks from backend...");
          const response = await fetch(`http://${ipAddr}:5000/getUserTasks?user_id=${userId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
    
          if (!response.ok) {
            throw new Error(`Error fetching tasks: ${response.statusText}`);
          }
    
          const tasks = await response.json();
    
          await AsyncStorage.setItem(`tasks_user_${userId}`, JSON.stringify(tasks));
          console.log("Tasks fetched and stored locally")
          buildTaskMap(tasks);
        } else {
          console.log("No internet connection. Trying to load tasks from cache...");
          const cached = await AsyncStorage.getItem(`tasks_user_${userId}`);
          if (cached) {
            const tasks = JSON.parse(cached);
            console.log("Tasks loaded from cache.");
            buildTaskMap(tasks);
          } else {
            console.warn("No cached tasks found.");
            setTaskMap({});
          }
        }
      } catch (error) {
         if (error instanceof Error) {
            crashlytics().recordError(error);
          } else {
            crashlytics().recordError(new Error(String(error)));
          }
        console.error("Chyba pri získavaní úloh:", error);
      }
    };
    
    const buildTaskMap = (tasks: any[]) => {
      const taskMap: Record<string, Task> = {};
    
      tasks.forEach((task: any) => {
        if (task.deadline) {
          const dateKey = task.deadline.split('T')[0];
          taskMap[dateKey] = {
            name: task.task_name,
            description: task.task_description,
            completed: task.task_completed,
            assignedTo: task.task_assigned_to,
            deadline: task.deadline,
            teamName: task.team_name,
          };
        }
      });
    
      setTaskMap(taskMap);
    };
    
    
    useEffect(() => {
      (async () => {
        const userIdString = await AsyncStorage.getItem('userId');
        const userId = userIdString ? parseInt(userIdString, 10) : null;
        if (userId !== null) {
          console.log(userId);
          getTasks(userId);
        } else {
          console.error('User ID is null or invalid.');
        }
      })();
    }, []);

    const getDaysInMonth = (year: number, month: number) => {
        const days: any[] = [];
        const totalDays = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            days.push({
                key,
                day,
                weekday: weekdays[date.getDay()],
                task: taskMap[key] || null,
            });
        }

        return days;
    };

    const changeMonth = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = getDaysInMonth(year, month);

    async function syncCalendar() {

      async function getCalendarPermissions() {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        console.log('Permission granted!');
      } else {
        console.log('Permission denied.');
        return false;
      }
      return true;
      }

      const hasPermission = await getCalendarPermissions();
      if (!hasPermission) return;

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

      const defaultCalendar = calendars.find(cal => cal.isPrimary) || calendars[0];
      if (!defaultCalendar) {
      console.error('No calendar found to add events.');
      return;
      }
      
      for (const [dateKey, task] of Object.entries(taskMap)) {
        if (task.deadline) {
          const startOfDay = new Date(task.deadline);
          startOfDay.setHours(0, 0, 0, 0);
      
          const endOfDay = new Date(task.deadline);
          endOfDay.setHours(23, 59, 59, 999);
      
          const existingEvents = await Calendar.getEventsAsync(
            [defaultCalendar.id],
            startOfDay,
            endOfDay
          );
      
          const eventExists = existingEvents.some(event => event.title === task.name);
      
          if (!eventExists) {
            await Calendar.createEventAsync(defaultCalendar.id, {
              title: task.name,
              startDate: new Date(task.deadline),
              endDate: new Date(new Date(task.deadline).getTime() + 60 * 60 * 1000),
              notes: task.description,
              timeZone: 'GMT',
            });
          } 
        }
      }
      const openCalendar = async () => {
        if (Platform.OS === 'ios') {
          const url = 'calshow://';
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
        await Linking.openURL(url);
          } else {
        console.error('Unable to open calendar.');
          }
        } else if (Platform.OS === 'android') {
          const url = 'content://com.android.calendar/time/';
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
        await Linking.openURL(url);
          } else {
        console.error('Unable to open calendar.');
          }
        }
      };

      await openCalendar();
    }

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Topbar />
      <View style={{ flex: 1, justifyContent: 'center', width: '80%', flexDirection: 'column', alignSelf: 'center', marginBottom: 50 }}>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>{monthNames[month]}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)}>
            <MaterialCommunityIcons name="arrow-right" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => syncCalendar()}
          style={{
            backgroundColor: theme.card,
            padding: 10,
            borderRadius: 5,
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Text style={{ color: theme.text }}>Sync with Calendar</Text>
        </TouchableOpacity>

        <FlatList
          data={days}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                backgroundColor: item.task ? theme.primary : theme.card,
                borderRadius: 10,
                padding: 15,
                marginBottom: 10,
                width: '100%',
              }}
              onPress={() => {
                if (item.task) {
                  alert(`Team: ${item.task.teamName}\nTask: ${item.task.name}\nDescription: ${item.task.description}\nAssigned to: me`);
                }
              }}
            >
              <View>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>{item.day}</Text>
                <Text style={{ fontSize: 14, color: theme.text }}>{item.weekday}</Text>
              </View>

              {item.task && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.text }}>{item.task.teamName}</Text>
                  <Text style={{ fontSize: 14, color: theme.text }}>{item.task.name}</Text>
                  <Text style={{ fontSize: 12, color: theme.text }}>{item.task.description}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                    <Text style={{ fontSize: 12, color: theme.text }}>Assigned to: me</Text>
                    <MaterialCommunityIcons name="account-circle-outline" size={18} color={theme.text} style={{ marginLeft: 5 }} />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      </View>
      <BottomBar />
    </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dayBox: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayBoxWithTask: {
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '600',
  },
  weekday: {
    fontSize: 14,
    color: '#555',
  },
  taskInfo: {
    marginTop: 8,
  },
  taskTeam: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedText: {
    marginRight: 6,
    fontSize: 13,
  },
  teamItem: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 19,
  }
});