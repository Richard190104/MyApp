import AsyncStorage from '@react-native-async-storage/async-storage';
import { ipAddr } from "@/components/backendip";
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

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
        crashlytics().log('Syncing data...');

        const data = await response.json();

        if (url.includes('/createTeam') && body?.id?.startsWith('local-') && data.id) {
           await analytics().logEvent('project_created', {
              name: body.teamName,
              description: body.teamDescription,
              user_id: body.userID,
          });
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
            await analytics().logEvent('project_created', {
              name: body.projectName,
              description: body.deadline,
              user_id: body.team_id,
          });
            const localId = body.id;
            const realId = data.id;
          queue = queue.map((req) => {
            const newBody = { ...req.body };
            

            if (newBody.id == localId) {
            newBody.id = realId;
            }

            if (String(newBody.project_id) === localId){
              newBody.project_id = realId;
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
          await analytics().logEvent('task_created', {
            name: body.taskName,
            deadline: body.deadline,
            description: body.description,
            assign: body.assignedToId,
            project_id: body.project_id,
            parent_task_id: body.parent_id || null,
          });  
          const localId = body.id;
            const realId = data.task_id;

            queue = queue.map((req) => {
                const newBody = { ...req.body };

                if (newBody.parent_task_id == localId) {
                newBody.parent_task_id = realId;
                }

                if (newBody.id == localId) {
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

      } else {
        console.warn(`Request failed: ${url}`);
        crashlytics().recordError(new Error(`Request failed: ${url}`));

      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  clearQueue();
};

let hasSynced = false;

export const startNetworkListener = () => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && !hasSynced) {
      hasSynced = true; 

      const queue = getQueue();
      if (queue.length === 0) return; 


      Alert.alert(
        "Connection Restored",
        "You're back online. Do you want to sync your offline data?",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              hasSynced = false; // allow syncing again if user cancels
            }
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
    }

    if (!state.isConnected) {
      hasSynced = false; // reset flag when going offline
    }
  });

  return unsubscribe; // allow caller to clean up if needed
};
