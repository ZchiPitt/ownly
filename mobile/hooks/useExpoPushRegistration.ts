import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { supabase } from '../lib/supabase';

type PushPermissionState = Notifications.PermissionStatus | 'undetermined';

type RegisterPushResult = {
  status: PushPermissionState;
  token: string | null;
  error: string | null;
};

function getProjectId(): string | null {
  const easProjectId = Constants.easConfig?.projectId;
  if (easProjectId) {
    return easProjectId;
  }

  const expoProjectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof expoProjectId === 'string' && expoProjectId.length > 0) {
    return expoProjectId;
  }

  return null;
}

async function getPermissionStatus(): Promise<PushPermissionState> {
  const permissions = await Notifications.getPermissionsAsync();
  return permissions.status;
}

async function syncExpoPushToken(userId: string, token: string) {
  const pushSubscriptions = supabase.from('push_subscriptions') as ReturnType<typeof supabase.from>;
  const deviceName = Device.deviceName ?? Device.modelName ?? 'iOS Device';

  const { error: deactivateError } = await pushSubscriptions
    .update({ is_active: false })
    .eq('user_id', userId)
    .ilike('endpoint', 'ExponentPushToken[%')
    .neq('endpoint', token);

  if (deactivateError) {
    throw deactivateError;
  }

  const { error: upsertError } = await pushSubscriptions.upsert(
    {
      user_id: userId,
      endpoint: token,
      p256dh: 'expo',
      auth: 'expo',
      device_name: deviceName,
      user_agent: `${Platform.OS}/${String(Platform.Version)}`,
      is_active: true,
    } as Record<string, unknown>,
    {
      onConflict: 'user_id,endpoint',
    }
  );

  if (upsertError) {
    throw upsertError;
  }
}

async function registerExpoPushToken(userId: string, requestPermission: boolean): Promise<RegisterPushResult> {
  let status = await getPermissionStatus();

  if (status !== 'granted' && requestPermission) {
    const permissionRequest = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    status = permissionRequest.status;
  }

  if (status !== 'granted') {
    return {
      status,
      token: null,
      error: null,
    };
  }

  if (!Device.isDevice) {
    return {
      status,
      token: null,
      error: 'Push notifications require a physical iPhone device.',
    };
  }

  const projectId = getProjectId();
  if (!projectId) {
    return {
      status,
      token: null,
      error: 'Missing EAS project ID in Expo config (`extra.eas.projectId`).',
    };
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await syncExpoPushToken(userId, token);

    return {
      status,
      token,
      error: null,
    };
  } catch (error) {
    return {
      status,
      token: null,
      error: error instanceof Error ? error.message : 'Failed to register push token.',
    };
  }
}

export function useExpoPushRegistration(userId: string | undefined) {
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionState>('undetermined');
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getPermissionStatus()
      .then((status) => {
        if (!isMounted) {
          return;
        }

        setPermissionStatus(status);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setPermissionStatus('undetermined');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const requestPermissionAndRegister = useCallback(async () => {
    if (!userId) {
      return { status: 'undetermined', token: null, error: 'You must be signed in.' } as RegisterPushResult;
    }

    setIsRegistering(true);
    const result = await registerExpoPushToken(userId, true);
    setPermissionStatus(result.status);
    setExpoPushToken(result.token);
    setError(result.error);
    setIsRegistering(false);

    return result;
  }, [userId]);

  const refreshRegistration = useCallback(async () => {
    if (!userId) {
      return { status: 'undetermined', token: null, error: null } as RegisterPushResult;
    }

    setIsRegistering(true);
    const result = await registerExpoPushToken(userId, false);
    setPermissionStatus(result.status);
    setExpoPushToken(result.token);
    setError(result.error);
    setIsRegistering(false);

    return result;
  }, [userId]);

  return {
    permissionStatus,
    expoPushToken,
    isRegistering,
    error,
    requestPermissionAndRegister,
    refreshRegistration,
  };
}
