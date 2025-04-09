import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeUserId = async (userId: number, token: string) => {
  try {
    await AsyncStorage.multiSet([
      ['userId', userId.toString()],
      ['authToken', token]
    ]);
  } catch (e) {
    console.error('Error saving userId and token', e);
  }
};

export const getUserId = async () => {
  try {
    const id = await AsyncStorage.getItem('userId');
    return id ? parseInt(id, 10) : null;
  } catch (e) {
    console.error('Error reading userId', e);
    return null;
  }
};


export const storeTeamMembers = async (teamMembers: any[], team_id: number) => {
  try {
    const jsonValue = JSON.stringify(teamMembers);
    console.log(jsonValue)
    await AsyncStorage.setItem(`teamMembers_${team_id}`, jsonValue);
  } catch (e) {
    console.error('Error saving team members', e);
  }
}

export const getTeamMembers = async (team_id: number) => {
  try {
    const jsonValue = await AsyncStorage.getItem(`teamMembers_${team_id}`);
    console.log(jsonValue)
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error reading team members', e);
    return null;
  }
}