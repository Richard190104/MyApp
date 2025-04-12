import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, TextInput, ScrollView, Modal, Image } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomBar from "@/components/bottomBar";
import TopBar from "@/components/topBar";
import { useEffect, useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ipAddr } from "@/components/backendip";
import { storeTeamMembers } from "@/components/getUser";

const TeamScreen = () => {
    const params = useLocalSearchParams();
    const [projects, setProjects] = useState<{ id: number; team_id: number; project_name: string; deadline: Date }[]>([]);
    const [user, setUser] = useState<number|null>();
    const [teamMembers,setTeamMembers] = useState<{user_id:number; username:string; email:string; role:string; profile_picture?: string}[]>([]);
    const [projectAdmins, setProjectAdmins] = useState<number[]>([])
    const [showInput, setShowInput] = useState(false)
    const [newMemberEmail,setNewMemberEmail] = useState("");
    const [showRoleOptions, setShowRoleOptions] = useState<{ [key: number]: boolean }>({});
    useEffect(() => {
        const fetchUserAndTeams = async () => {
            const token = await AsyncStorage.getItem('authToken');

            if (typeof params.user === "string") {
            setUser(parseInt(params.user, 10));
            } else {
            console.warn("Invalid user parameter:", params.user);
            }

            if (user !== null) {
            try {
                const response = await fetch(`http://${ipAddr}:5000/getProjects?teamID=${params.team_id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                });
                const data = await response.json();
                if (Array.isArray(data)) {
                setProjects(data);
                }
            } catch (error) {
                console.error("Error fetching team names:", error);
            }
            } else {
            console.warn("User ID was null");
            }
        };

        const fetchTeamMembers = async () => {
            try {
            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(`http://${ipAddr}:5000/getTeamMembers?teamID=${params.team_id}`, {
                method: 'GET',
                headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setTeamMembers(data);
                const admins = data
                .filter(member => member.role === 'admin' || member.role === 'owner')
                .map(member => member.user_id);
                setProjectAdmins(admins);
                if (typeof params.team_id === "string") {
                storeTeamMembers(data, parseInt(params.team_id));
                }
            }
            } catch (error) {
            console.error("Error fetching team members:", error);
            }
        };

        fetchTeamMembers();
        fetchUserAndTeams();
        
    }, []);

    async function removeTeamMember(user_id: number) {
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
                team_id: params.team_id,
            }), 
            });

            if (response.ok) {
            alert("Team member removed successfully!");
            setTeamMembers(prevMembers => prevMembers.filter(member => member.user_id !== user_id));
            if (typeof params.team_id === "string") {
                storeTeamMembers(teamMembers, parseInt(params.team_id, 10));
            } else {
                console.warn("Invalid team ID:", params.team_id);
            }
            } else if (response.status === 403) {
            alert("You don't have permission for that.");
            } else if (response.status === 401) {
            alert("We couldn't authenticate you.");
            } else {
            alert("Failed to remove team member");
            }
        } catch (error) {
            console.error("Error removing team member:", error);
            alert("Error removing team member");
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
                     team_id: params.team_id,
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
                    team_id: params.team_id,
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
            console.error("Error updating user role:", error);
            alert("Error updating user role.");
        }
    }

  return (
<SafeAreaView style={styles.MainContainer}>
    <TopBar />
    <Text style={styles.mainText}>{params.team_name}</Text>
    <View style={styles.headerRow}>
        <Text style={styles.SmolText}>Team projects</Text>
        <TouchableOpacity
            onPress={() => router.push({ pathname: '/inApp/createProjectScreen', params: { team_id: params.team_id.toString(), team_name: params.team_name, team_creator_id: params.team_creator_id, user: user?.toString() } })}
            style={styles.addButton}
        >
            <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
    </View>
    
    <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 50 }}>
  
    
        <View style={styles.teamList}>
            {projects.length > 0 ? (
                projects.map(project => (
                    <TouchableOpacity
                        key={project.id}
                        style={styles.teamButton}
                        onPress={() => router.push({ pathname: '/inApp/projectscreen', params: { project_id: project.id.toString(), project_name: project.project_name, team_id: params.team_id, user_id: user, project_deadline: project.deadline.toString(), team_name: params.team_name } })}
                    >
                        <Text style={styles.teamButtonText}>{project.project_name}</Text>
                    </TouchableOpacity>
                ))
            ) : (
                <Text style={styles.noTeamsText}>This team does not have any projects</Text>
            )}
        </View>

        <View style={styles.teamList}>
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.SmolText}>Team Members</Text>
                <View style={{ flexDirection: 'row', gap: 15 }}>
                    <TouchableOpacity onPress={() => router.push({ pathname: '/inApp/chatScreen', params: { team_id: params.team_id, user_id: user } })}>
                        <MaterialCommunityIcons name="message-text-outline" size={25} color="gray" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowInput(!showInput)}>
                        <MaterialCommunityIcons name={showInput ? "minus" : "plus"} size={25} color="gray" />
                    </TouchableOpacity>
                </View>
            </View>

            {showInput && (
                <View style={{ marginVertical: 10, width: '100%' }}>
                    <Text style={{ fontSize: 16, marginBottom: 5 }}>Add a new member:</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                            style={{
                                flex: 1,
                                borderWidth: 1,
                                borderColor: '#ccc',
                                borderRadius: 5,
                                padding: 10,
                                marginRight: 10,
                                color: 'black'
                            }}
                            placeholder="Enter email"
                            onChangeText={setNewMemberEmail}
                        />
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#70ABAF',
                                padding: 10,
                                borderRadius: 5,
                            }}
                            onPress={() => {
                                if (newMemberEmail.trim() !== '') {
                                    SendInvite(newMemberEmail);
                                    setNewMemberEmail('');
                                }
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            {teamMembers.length > 0 ? (
                teamMembers.map((member, index) => (
                    <View key={`${member.user_id}-${index}`} style={styles.memberBlock}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ marginRight: 10 }}>
                                {member.profile_picture ? (
                                    <Image
                                        source={{  uri: `data:image/jpeg;base64,${member.profile_picture}`  }}
                                        style={{ width: 40, height: 40, borderRadius: 20 }}
                                    />
                                ) : (
                                    <Ionicons name="person-circle-outline" size={40} color="black" />
                                )}
                            </View>
                            <View>
                                <Text style={styles.member}>{member.username}</Text>
                                <Text
                                    style={[
                                        styles.memberRole,
                                        member.role === 'owner' ? { fontWeight: 'bold', color: 'black' } : {}
                                    ]}>{member.role}</Text>
                            </View>
                        </View>
                        {member.role !== 'owner' && user !== undefined && user !== null && projectAdmins.includes(user) && (
                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowRoleOptions(prevState => ({
                                            ...prevState,
                                            [member.user_id]: !prevState[member.user_id],
                                        }));
                                    }}
                                >
                                    <MaterialCommunityIcons name="pencil" size={25} color="black" />
                                </TouchableOpacity>
                                {showRoleOptions[member.user_id] && (
                                      <Modal
                                      transparent
                                      visible={showRoleOptions[member.user_id]}
                                      animationType="slide"
                                    onRequestClose={() => setShowRoleOptions(prevState => ({ ...prevState, [member.user_id]: false }))}
                                    >
                                      <View style={styles.modalOverlay}>
                                        <View style={styles.modalContainer}>
                                          <Text style={styles.modalTitle}>Zmeniť rolu pre {member.username}</Text>
                                          {['member', 'admin'].map(option => (
                                            <TouchableOpacity
                                              key={option}
                                              onPress={async () => {
                                                await modifyUserRole(member.user_id, option);
                                                setShowRoleOptions(prevState => ({ ...prevState, [member.user_id]: false }));
                                              }}
                                              style={styles.optionButton}
                                            >
                                              <Text style={styles.optionText}>{option}</Text>
                                            </TouchableOpacity>
                                          ))}
                                        <TouchableOpacity onPress={() => setShowRoleOptions({})}>
                                            <Text style={styles.cancelText}>Zrušiť</Text>
                                          </TouchableOpacity>
                                        </View>
                                      </View>
                                    </Modal>
                                )}
                                <TouchableOpacity onPress={() => removeTeamMember(member.user_id)}>
                                    <MaterialCommunityIcons name="close" size={25} color="red" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))
            ) : (
                <Text style={styles.noTeamsText}>This team does not have any members</Text>
            )}
        </View>
    </ScrollView>
    <BottomBar />

</SafeAreaView>
  );
};


const styles = StyleSheet.create({
    MainContainer: {
        padding: 10,
        flex: 1,
        width: "100%",
        alignItems: "center",
        backgroundColor: "#f9f9f9",
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
        backgroundColor: "#70ABAF",
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
        backgroundColor: '#e0e0e0',
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
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      modalContainer: {
        backgroundColor: 'white',
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
