import { Platform } from 'react-native';

const PUBLIC_IP  = '147.175.191.15';

const EMULATOR_HOST = '10.0.2.2';

export const ipAddr =
  Platform.OS === 'android'
    ? EMULATOR_HOST
    : PUBLIC_IP;
