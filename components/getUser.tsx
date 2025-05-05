import AsyncStorage from '@react-native-async-storage/async-storage';
import { ipAddr } from "@/components/backendip";
import messaging from '@react-native-firebase/messaging';

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

export const storeUser = async (user: { id: number; username: string; email: string; profile_picture: string | null }) => {
  try {
    await AsyncStorage.multiSet([
      ['userId', user.id.toString()],
      ['userName', user.username],
      ['userEmail', user.email],
      ['userProfilePicture', user.profile_picture ? user.profile_picture : '']
    ]);
  } catch (e) {
    console.error('Error saving user data', e);
  }
};

export const getUser = async () => {
  try {
    const [id, username, email, profile_picture] = await AsyncStorage.multiGet([
      'userId',
      'userName',
      'userEmail',
      'userProfilePicture'
    ]);

    if (id[1] && username[1] && email[1]) {
      return {
        id: parseInt(id[1], 10),
        username: username[1],
        email: email[1],
        profile_picture: profile_picture[1] ? profile_picture[1] : null,
      };
    }

    return null;
  } catch (e) {
    console.error('Error reading user data', e);
    return null;
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

export const logout = async () => {
  try {
    const authToken = await AsyncStorage.getItem('authToken');
    const fcmToken = await messaging().getToken();

    if (authToken) {
      await fetch(`http://${ipAddr}:5000/device_token`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ is_active: false }),
      });
      console.log('FCM token deactivated successfully');
    }

    await AsyncStorage.removeItem('authToken');
    console.log('Auth token removed successfully');
  } catch (e) {
    console.error('Error during logout process', e);
  }
};


export const storeTeamMembers = async (teamMembers: any[], team_id: number) => {
  try {
    const jsonValue = JSON.stringify(teamMembers);
    await AsyncStorage.setItem(`teamMembers_${team_id}`, jsonValue);
  } catch (e) {
    console.error('Error saving team members', e);
  }
}

export const getTeamMembers = async (team_id: number) => {
  try {
    const jsonValue = await AsyncStorage.getItem(`teamMembers_${team_id}`);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error reading team members', e);
    return null;
  }
}

