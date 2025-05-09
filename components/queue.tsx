import AsyncStorage from '@react-native-async-storage/async-storage';
import { ipAddr } from "@/components/backendip";
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import { router } from 'expo-router';

export type QueuedRequest = {
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
};

let requestQueue: QueuedRequest[] = [];

export const addToQueue = (request: QueuedRequest) => {
  requestQueue.push(request);
};

export const getQueue = () => [...requestQueue];

export const clearQueue = () => {
  requestQueue = [];
};

export const removeRequestAt = (index: number) => {
  requestQueue.splice(index, 1);
};


export const updateQueue = (newQueue: QueuedRequest[]) => {
  requestQueue = [...newQueue];
};

export const processQueue = async () => {
  let queue = getQueue();

  for (let i = 0; i < queue.length; i++) {
    const { url, method, body, headers } = queue[i];

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();

        if (url.includes('/createTeam') && body?.id?.startsWith('local-') && data.id) {
          const localId = body.id;
          const realId = data.id;

          queue = queue.map((req) => {
            const newBody = { ...req.body };

            if (newBody.team_id === localId) {
              newBody.team_id = realId;
            }
            if (newBody.id === localId) {
              newBody.id = realId;
            }
            return {
              ...req,
              body: newBody,
            };
          });

          updateQueue(queue); 

           try {
            const userId = body.user_id;
            const teamsKey = `teams_${userId}`;
            const existing = await AsyncStorage.getItem(teamsKey);
            const parsed: any[] = existing ? JSON.parse(existing) : [];

            const updatedTeams = parsed.map(team =>
                team.id === localId ? { ...team, id: realId } : team
            );

            await AsyncStorage.setItem(teamsKey, JSON.stringify(updatedTeams));
            } catch (err) {
            console.warn("Failed to update team in AsyncStorage:", err);
            }
        }
        if (url.includes('/createProject') && body?.id?.startsWith('local-') && data.id) {
            const localId = body.id;
            const realId = data.id;

        queue = queue.map((req) => {
            const newBody = { ...req.body };

            if (newBody.id === localId) {
            newBody.id = realId;
            }

            return {
            ...req,
            body: newBody,
            };
        });
        updateQueue(queue);

        try {
            const teamId = body.team_id;
            const key = `projects_${teamId}`;
            const existing = await AsyncStorage.getItem(key);
            const parsed: [any] = existing ? JSON.parse(existing) : [];

            const updatedProjects = parsed.map(project =>
            project.id === localId ? { ...project, id: realId } : project
            );

            await AsyncStorage.setItem(key, JSON.stringify(updatedProjects));
        } catch (err) {
            console.warn('Failed to update project in AsyncStorage:', err);
        }
        }

        if (url.includes('/createTask') && body?.id?.startsWith('local-') && data.task_id) {
            const localId = body.id;
            const realId = data.task_id;

            // Aktualizuj queued požiadavky
            queue = queue.map((req) => {
                const newBody = { ...req.body };

                // Ak task mal parent_task_id == localId, nastav nový
                if (newBody.parent_task_id === localId) {
                newBody.parent_task_id = realId;
                }

                // Nahrad id samotného tasku
                if (newBody.id === localId) {
                newBody.id = realId;
                }

                return {
                ...req,
                body: newBody,
                };
            });

            updateQueue(queue);

            try {
                const projectId = body.project_id;
                const key = `tasks_${projectId}`;
                const existing = await AsyncStorage.getItem(key);
                const parsed: any[] = existing ? JSON.parse(existing) : [];

                const updatedTasks = parsed.map(task => {
                if (task.id === localId) {
                    return { ...task, id: realId };
                } else if (task.parent_task_id === localId) {
                    return { ...task, parent_task_id: realId };
                }
                return task;
                });

                await AsyncStorage.setItem(key, JSON.stringify(updatedTasks));
            } catch (err) {
                console.warn('Failed to update task in AsyncStorage:', err);
            }
            }


        removeRequestAt(i);
      } else {
        console.warn(`Request failed: ${url}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  clearQueue();
};

export const startNetworkListener = () => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
        console.log(getQueue())
      Alert.alert(
        "Connection Restored",
        "You're back online. Do you want to sync your offline data?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Sync",
            onPress: async () => {
              await processQueue();
              router.replace('/inApp/homeScreen');
            }
          }
        ],
        { cancelable: true }
      );

      unsubscribe();
    }
  });
};