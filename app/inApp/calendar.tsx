import React, { useState } from 'react';
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

import { MaterialCommunityIcons } from '@expo/vector-icons';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CalendarScreen() {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Mock úlohy (doplň si z API)
    interface Task {
        team: string;
        description: string;
        assignedTo: string;
    }

    const taskMap: Record<string, Task> = {
        '2024-02-19': {
            team: 'MTAA Project Team',
            description: 'Create basic design',
            assignedTo: 'me',
        },
    };

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

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <Topbar />
            <View style={{ flex: 1, display: 'flex', justifyContent: 'center', width: '80%', flexDirection: 'column', alignSelf: 'center', marginBottom: 50}}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => changeMonth(-1)}>
                        <MaterialCommunityIcons name="arrow-left" size={28} />
                    </TouchableOpacity>
                    <Text style={styles.monthText}>{monthNames[month]}</Text>
                    <TouchableOpacity onPress={() => changeMonth(1)}>
                        <MaterialCommunityIcons name="arrow-right" size={28} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={days}
                    keyExtractor={(item) => item.key}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={({ item }) => (
                        <View style={item.task ? styles.dayBoxWithTask : styles.dayBox}>
                            <View>
                                <Text style={styles.dayNumber}>{item.day}</Text>
                                <Text style={styles.weekday}>{item.weekday}</Text>
                            </View>
                            {item.task && (
                                <View style={styles.taskInfo}>
                                    <Text style={styles.taskTeam}>{item.task.team}</Text>
                                    <Text style={styles.taskDescription}>{item.task.description}</Text>
                                    <View style={styles.assignedRow}>
                                        <Text style={styles.assignedText}>Assigned to: {item.task.assignedTo}</Text>
                                        <MaterialCommunityIcons name="account-circle-outline" size={18} color="black" />
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
                />
            </View>
            <BottomBar />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
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
});
