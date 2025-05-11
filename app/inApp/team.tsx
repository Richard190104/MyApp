import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, TextInput, ScrollView, Modal, Image } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomBar from "@/components/bottomBar";
import TopBar from "@/components/topBar";
import { useEffect, useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ipAddr } from "@/components/backendip";
import { useTheme } from '@/components/ThemeContext';
import {Dimensions} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import crashlytics from '@react-native-firebase/crashlytics';
const TeamScreen = (props: any) => {
    const localParams = useLocalSearchParams();
    const width = Dimensions.get('window').width

    const team_id = props?.team_id || localParams?.team_id;
    const team_name = props?.team_name || localParams?.team_name;
    const team_creator_id = props?.team_creator_id || localParams?.team_creator_id;
    const [isLoading, setIsLoading] = useState(true);

    const [projects, setProjects] = useState<{ id: number; team_id: number; project_name: string; deadline: Date }[]>([]);
    const [user, setUser] = useState<number | null>(null);
    const [teamMembers,setTeamMembers] = useState<{user_id:number; username:string; email:string; role:string; profile_picture?: string}[]>([]);
    const [projectAdmins, setProjectAdmins] = useState<number[]>([])
    const [showInput, setShowInput] = useState(false)
    const [newMemberEmail,setNewMemberEmail] = useState("");
    const [showRoleOptions, setShowRoleOptions] = useState<{ [key: number]: boolean }>({});
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
      crashlytics().log('Opened Team Screen');
    }, []);

    useEffect(() => {
      console.log(localParams.team_id)

      const fetchUserAndTeams = async () => {
        const state = await NetInfo.fetch();
        const token = await AsyncStorage.getItem('authToken');
        if(state.isConnected){
          console.log("Internet is connected. Fetching projects from backend...");

          try {
            const response = await fetch(`http://${ipAddr}:5000/getProjects?teamID=${team_id}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',   
              },
            });
            const data = await response.json();
            if (Array.isArray(data)) {
              setProjects(data);
              await AsyncStorage.setItem(`projects_${team_id}`, JSON.stringify(data));

            }
            if (localParams?.onProject === "1" && localParams?.project_name) {
              const matchedProject = data.find(
                (project: any) => project.project_name === localParams.project_name
              );
              if (matchedProject) {
                router.replace({
                  pathname: '/inApp/projectscreen',
                  params: {
                    project_id: matchedProject.id.toString(),
                    project_name: matchedProject.project_name,
                    team_id: team_id,
                    user_id: user,
                    project_deadline: matchedProject.deadline.toString(),
                    team_name: team_name,
                  },
                });
              } else {
                console.warn("Project with the given name not found.");
              }
            }
          } catch (error) {
              if (error instanceof Error) {
                crashlytics().recordError(error);
              } else {
                crashlytics().recordError(new Error(String(error)));
              }
            console.error("Error fetching team names:", error);

          }
        }
        else{
          console.log("No internet connection. Trying to load projects from cache...");
          const cached = await AsyncStorage.getItem(`projects_${team_id}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            setProjects(parsed);
            console.log(parsed)
            console.log("Projects loaded from cache.");
          } else {
            console.warn("No cached projects found.");
          }
        }

      };
    
      const fetchTeamMembers = async () => {
        const state = await NetInfo.fetch();
        if(state.isConnected){
          console.log("Internet is connected. Fetching teams members from backend...");

          try {
            const token = await AsyncStorage.getItem('authToken');
  
            const response = await fetch(`http://${ipAddr}:5000/getTeamMembers?teamID=${team_id}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            const data = await response.json();
            if (Array.isArray(data)) {
              setTeamMembers(data);
              const membersWithoutPictures = data.map(member => {
                const { profile_picture, ...rest } = member;
                return rest;
              });
              await AsyncStorage.setItem(`teamMembers_${team_id}`, JSON.stringify(membersWithoutPictures));
              const admins = data
                .filter(member => member.role === 'admin' || member.role === 'owner')
                .map(member => member.user_id);
              setProjectAdmins(admins);
              
              
            }
          } catch (error) {
            if (error instanceof Error) {
                crashlytics().recordError(error);
              } else {
                crashlytics().recordError(new Error(String(error)));
              }
            console.error("Error fetching team members:", error);
          }
        }
        else{
          console.log("No internet connection. Trying to load team members from cache...");
          const cached = await AsyncStorage.getItem(`teamMembers_${team_id}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            setTeamMembers(parsed);
            const admins = parsed
            .filter((member: { role: string; }) => member.role === 'admin' || member.role === 'owner')
            .map((member: { user_id: any; }) => member.user_id);
            setProjectAdmins(admins);
            console.log("Team members loaded from cache.");
          } else {
            console.warn("No cached team members found.");
          }
        }

      };
    
      (async () => {
        const storedUserId = await AsyncStorage.getItem('userId');
        setIsLoading(true);

        if (storedUserId) {
          const parsedUserId = parseInt(storedUserId, 10);
          setUser(parsedUserId);
          await fetchUserAndTeams();
          await fetchTeamMembers();
          
        } else {
          console.warn('User ID not found in AsyncStorage');
        }
        setIsLoading(false);
      })();
    
    }, [team_id]);
    

    async function removeTeamMember(user_id: number) {
        const state = await NetInfo.fetch();
        if(!state.isConnected){
            try {
              const token = await AsyncStorage.getItem('authToken');
              const response = await fetch(`http://${ipAddr}:5000/removeTeamMember`, {
              method: 'DELETE',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                  user_id: user_id,
                  team_id: team_id,
              }), 
              });

              if (response.ok) {
              alert("Team member removed successfully!");
              setTeamMembers(prevMembers => prevMembers.filter(member => member.user_id !== user_id));
            
              } else if (response.status === 403) {
              alert("You don't have permission for that.");
              } else if (response.status === 401) {
              alert("We couldn't authenticate you.");
              } else {
              alert("Failed to remove team member");
              }
            } catch (error) {
              if (error instanceof Error) {
                crashlytics().recordError(error);
              } else {
                crashlytics().recordError(new Error(String(error)));
              }
                console.error("Error removing team member:", error);
                alert("Error removing team member");
            }

        }
       else{
            alert("No internet connection. Cannot remove team member.");
       }
    }

    async function SendInvite(email: string) {
        const token = await AsyncStorage.getItem('authToken');
        try {
            const response = await fetch(`http://${ipAddr}:5000/setInvite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                     email: email, 
                     team_id: team_id,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                alert("Invite sent successfully!");
            } else if (response.status === 403) {
                alert("You don't have permission for that.");
            } else if (response.status === 401) {
                alert("We couldn't authenticate you.");
            } else {
                alert("Failed to send invite");
            }
        } catch (error) {
          if (error instanceof Error) {
                crashlytics().recordError(error);
              } else {
                crashlytics().recordError(new Error(String(error)));
              }
            alert("Error sending invite");
        }
    }

    async function modifyUserRole(user_id: number, option: string) {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`http://${ipAddr}:5000/modifyUserRole`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    user_id: user_id,
                    team_id: team_id,
                    new_role: option,
                }),
            });

            if (response.ok) {
                alert("User role updated successfully!");
                setTeamMembers(prevMembers =>
                    prevMembers.map(member =>
                        member.user_id === user_id ? { ...member, role: option } : member
                    )
                );
            } else if (response.status === 403) {
                alert("You don't have permission to modify roles.");
            } else if (response.status === 401) {
                alert("We couldn't authenticate you.");
            } else {
                alert("Failed to update user role.");
            }
        } catch (error) {
          if (error instanceof Error) {
                crashlytics().recordError(error);
              } else {
                crashlytics().recordError(new Error(String(error)));
              }
            console.error("Error updating user role:", error);
            alert("Error updating user role.");
        }
    }
   
    if (isLoading) {
      return (
        <SafeAreaView style={[styles.MainContainer, { backgroundColor: theme.background,flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: theme.text, fontSize: 18 }}>Loading team data...</Text>
        </SafeAreaView>
      );
    }
      return (
    <SafeAreaView
      style={[styles.MainContainer, { backgroundColor: theme.background }]}
      accessible={true}
      accessibilityLabel="Team screen"
      accessibilityHint="View and manage team projects and members"
      accessibilityLanguage="en-US"
    >
      {width < 768 && <TopBar />}

      <Text
        style={[styles.mainText, { color: theme.text }]}
        accessibilityRole="header"
        accessibilityLabel={`Team: ${team_name}`}
        accessibilityLanguage="en-US"
      >
        {team_name}
      </Text>

      <View style={styles.headerRow}>
        <Text
          style={[styles.SmolText, { color: theme.text }]}
          accessibilityRole="header"
          accessibilityLabel="Team projects"
          accessibilityLanguage="en-US"
        >
          Team projects
        </Text>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/inApp/createProjectScreen',
              params: {
                team_id: team_id.toString(),
                team_name: team_name,
                team_creator_id: team_creator_id,
                user: user?.toString(),
              },
            })
          }
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Create new project"
          accessibilityHint="Opens a screen to create a new project"
          accessibilityLanguage="en-US"
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 50 }}
        accessibilityRole="scrollbar"
        accessibilityLabel="Project and member list"
        accessibilityLanguage="en-US"
      >
        <View style={styles.teamList}>
          {projects.length > 0 ? (
            projects.map(project => (
              <TouchableOpacity
                key={project.id}
                style={[styles.teamButton, { backgroundColor: theme.card }]}
                onPress={() =>
                  router.push({
                    pathname: '/inApp/projectscreen',
                    params: {
                      project_id: project.id.toString(),
                      project_name: project.project_name,
                      team_id: team_id,
                      user_id: user,
                      project_deadline: project.deadline.toString(),
                      team_name: team_name,
                    },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Open project: ${project.project_name}`}
                accessibilityHint="Opens the selected project screen"
                accessibilityLanguage="en-US"
              >
                <Text style={[styles.teamButtonText, { color: theme.text }]}>
                  {project.project_name}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text
              style={[styles.noTeamsText, { color: theme.text }]}
              accessibilityRole="text"
              accessibilityLabel="This team does not have any projects"
              accessibilityLanguage="en-US"
            >
              This team does not have any projects
            </Text>
          )}
        </View>

        <View style={styles.teamList}>
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={[styles.SmolText, { color: theme.text }]}
              accessibilityRole="header"
              accessibilityLabel="Team members"
              accessibilityLanguage="en-US"
            >
              Team Members
            </Text>

            <View style={{ flexDirection: 'row', gap: 15 }}>
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: '/inApp/chatScreen', params: { team_id: team_id, user_id: user } })
                }
                accessibilityRole="button"
                accessibilityLabel="Open team chat"
                accessibilityLanguage="en-US"
              >
                <MaterialCommunityIcons name="message-text-outline" size={25} color={theme.text} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowInput(!showInput)}
                accessibilityRole="button"
                accessibilityLabel={showInput ? "Hide invite form" : "Show invite form"}
                accessibilityLanguage="en-US"
              >
                <MaterialCommunityIcons name={showInput ? 'minus' : 'plus'} size={25} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          {showInput && (
            <View
              style={{ marginVertical: 10, width: '100%' }}
              accessible={true}
              accessibilityLabel="Add a new member"
              accessibilityHint="Enter email and press add"
              accessibilityLanguage="en-US"
            >
              <Text style={[{ fontSize: 16, marginBottom: 5 }, { color: theme.text }]}>
                Add a new member:
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: theme.primary,
                    borderRadius: 5,
                    padding: 10,
                    marginRight: 10,
                    color: theme.text,
                  }}
                  placeholder="Enter email"
                  placeholderTextColor={theme.text}
                  onChangeText={setNewMemberEmail}
                  accessibilityLabel="Email input for invite"
                  accessibilityLanguage="en-US"
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: theme.primary,
                    padding: 10,
                    borderRadius: 5,
                  }}
                  onPress={() => {
                    if (newMemberEmail.trim() !== '') {
                      SendInvite(newMemberEmail);
                      setNewMemberEmail('');
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Add team member"
                  accessibilityHint="Invites the user to the team"
                  accessibilityLanguage="en-US"
                >
                  <Text style={{ color: theme.background, fontWeight: 'bold' }}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {teamMembers.length > 0 ? (
            teamMembers.map((member, index) => (
              <View
                key={`${member.user_id}-${index}`}
                style={[styles.memberBlock, { backgroundColor: theme.card }]}
                accessible={true}
                accessibilityLabel={`Team member: ${member.username}, Role: ${member.role}`}
                accessibilityLanguage="en-US"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ marginRight: 10 }}>
                    {member.profile_picture ? (
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${member.profile_picture}` }}
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                        accessibilityLabel={`${member.username}'s profile picture`}
                      />
                    ) : (
                      <Ionicons
                        name="person-circle-outline"
                        size={40}
                        color={theme.text}
                        accessibilityLabel={`${member.username} default avatar`}
                      />
                    )}
                  </View>
                  <View>
                    <Text style={[styles.member, { color: theme.text }]}>{member.username}</Text>
                    <Text
                      style={[
                        styles.memberRole,
                        { color: theme.text },
                        member.role === 'owner' ? { fontWeight: 'bold', color: theme.primary } : {},
                      ]}
                    >
                      {member.role}
                    </Text>
                  </View>
                </View>

                {member.role !== 'owner' &&
                  user !== undefined &&
                  user !== null &&
                  projectAdmins.includes(user) && (
                    <View style={{ flexDirection: 'row', gap: 15, height: '100%', alignItems: 'center' }}>
                      <TouchableOpacity
                        onPress={() =>
                          setShowRoleOptions(prev => ({ ...prev, [member.user_id]: !prev[member.user_id] }))
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`Edit role for ${member.username}`}
                        accessibilityLanguage="en-US"
                      >
                        <MaterialCommunityIcons name="pencil" size={25} color={theme.text} />
                      </TouchableOpacity>

                      {showRoleOptions[member.user_id] && (
                        <Modal
                          transparent
                          visible={showRoleOptions[member.user_id]}
                          animationType="slide"
                          onRequestClose={() =>
                            setShowRoleOptions(prev => ({ ...prev, [member.user_id]: false }))
                          }
                          accessibilityViewIsModal={true}
                        >
                          <View style={[styles.modalOverlay, { gap: 15 }]}>
                            <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
                              <Text
                                style={[styles.modalTitle, { color: theme.text }]}
                                accessibilityRole="header"
                              >
                                Change role for {member.username}
                              </Text>
                              {['member', 'admin'].map(option => (
                                <TouchableOpacity
                                  key={option}
                                  onPress={async () => {
                                    await modifyUserRole(member.user_id, option);
                                    setShowRoleOptions(prev => ({
                                      ...prev,
                                      [member.user_id]: false,
                                    }));
                                  }}
                                  style={[
                                    styles.optionButton,
                                    {
                                      backgroundColor: theme.primary,
                                      marginVertical: 5,
                                      borderRadius: 5,
                                      height: 45,
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                    },
                                  ]}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Assign role: ${option}`}
                                  accessibilityLanguage="en-US"
                                >
                                  <Text style={[styles.optionText, { color: theme.background }]}>
                                    {option}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                              <TouchableOpacity
                                onPress={() => setShowRoleOptions({})}
                                accessibilityRole="button"
                                accessibilityLabel="Cancel role change"
                                accessibilityLanguage="en-US"
                              >
                                <Text style={[styles.cancelText, { color: theme.danger }]}>Zrušiť</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </Modal>
                      )}

                      <TouchableOpacity
                        onPress={() => removeTeamMember(member.user_id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${member.username} from team`}
                        accessibilityLanguage="en-US"
                      >
                        <MaterialCommunityIcons name="close" size={25} color="red" />
                      </TouchableOpacity>
                    </View>
                  )}
              </View>
            ))
          ) : (
            <Text
              style={[styles.noTeamsText, { color: theme.text }]}
              accessibilityLabel="This team does not have any members"
              accessibilityLanguage="en-US"
            >
              This team does not have any members
            </Text>
          )}
        </View>
      </ScrollView>

      {width < 768 && <BottomBar />}
    </SafeAreaView>
  );

};


const styles = StyleSheet.create({
    MainContainer: {
        padding: 10,
        flex: 1,
        width: "100%",
        alignItems: "center",
    },
    SmolText: {
        fontSize: 18,
        marginTop: 10,
        marginBottom: 10,
        fontWeight: "800",
        color: "#333",
        textAlign: "left",
    },
    headerRow: {
        width: "90%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    addButton: {
        padding: 10,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    mainText: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#222",
        textAlign: "center",
        marginBottom: 10,
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
        color: "#444",
    },
    noTeamsText: {
        fontSize: 16,
        fontStyle: 'italic',
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
    },
    teamList: {
        width: "90%",
        marginTop: 10,
        marginBottom: 20,
    },
    memberBlock: {
        width: '80%',
        padding: 10,
        borderRadius: 8,
        marginVertical: 5,
        marginLeft: '10%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    member: {
        fontSize: 16,
        fontWeight: "500",
        color: "black",
    },
    memberRole: {
        color: 'gray',

    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
      modalContainer: {
        borderRadius: 10,
        padding: 20,
        width: '80%',
        elevation: 10,
        alignItems: 'center',
      },
      modalTitle: {
        fontSize: 18,
        marginBottom: 10,
        fontWeight: 'bold',
      },
      optionButton: {
        paddingVertical: 10,
        width: '100%',
        alignItems: 'center',
      },
      optionText: {
        fontSize: 16,
        color: 'black',
      },
      cancelText: {
        marginTop: 20,
        color: 'red',
        fontSize: 16,
      },
});

export default TeamScreen;