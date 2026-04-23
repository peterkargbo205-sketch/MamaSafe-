import * as Network from 'expo-network';

export const isOnline = async () => {
  try {
    const state = await Network.getNetworkStateAsync();
    return !!(state.isConnected && state.isInternetReachable !== false);
  } catch {
    return false;
  }
};
