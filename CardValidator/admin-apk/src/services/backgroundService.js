// src/services/backgroundService.js
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager     from 'expo-task-manager';
import * as Notifications   from 'expo-notifications';
import AsyncStorage         from '@react-native-async-storage/async-storage';
import { fetchValidations } from './supabase';

export const HEARTBEAT_TASK = 'cardvalidator-heartbeat';
const LAST_SEEN_KEY         = 'cv_last_seen_id';

// ── Notification handler ──────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:    true,
    shouldPlaySound:    true,
    shouldSetBadge:     true,
    priority:           Notifications.AndroidNotificationPriority.MAX,
  }),
});

// ── Register background task ──────────────────────────────────
TaskManager.defineTask(HEARTBEAT_TASK, async () => {
  try {
    const validations = await fetchValidations({ limit: 5 });
    if (!validations || validations.length === 0)
      return BackgroundFetch.BackgroundFetchResult.NoData;

    const lastSeenId = await AsyncStorage.getItem(LAST_SEEN_KEY);
    const newest     = validations[0];

    if (newest.id !== lastSeenId) {
      await AsyncStorage.setItem(LAST_SEEN_KEY, newest.id);
      await sendNotification(newest);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerHeartbeat() {
  const status = await BackgroundFetch.getStatusAsync();
  if (
    status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
    status === BackgroundFetch.BackgroundFetchStatus.Denied
  ) {
    console.warn('[Heartbeat] Background fetch not available');
    return;
  }
  await BackgroundFetch.registerTaskAsync(HEARTBEAT_TASK, {
    minimumInterval:      30,   // seconds between polls
    stopOnTerminate:      false, // keep running after app closed
    startOnBoot:          true,  // start on device reboot
  });
  console.log('[Heartbeat] Registered');
}

export async function unregisterHeartbeat() {
  await BackgroundFetch.unregisterTaskAsync(HEARTBEAT_TASK);
}

// ── Send notification ─────────────────────────────────────────
export async function sendNotification(validation) {
  const settings = await getNotificationSettings();
  const statusLabels = { valid: '✅ Valid', used: '⚠️ Used', invalid: '❌ Invalid' };
  const label = statusLabels[validation.status] || '🔍 Unknown';

  await Notifications.scheduleNotificationAsync({
    content: {
      title:    `New Card Validation — ${label}`,
      body:     `Code: ${validation.card_code}`,
      data:     { validationId: validation.id },
      sound:    settings.soundEnabled ? settings.customSound || true : false,
      badge:    1,
      priority: 'max',
      vibrate:  settings.vibrate ? [0, 250, 100, 250] : undefined,
      android:  {
        channelId: 'card-validations',
        priority:  'max',
        color:     '#7c6dfa',
        largeIcon: '@mipmap/ic_launcher',
      },
    },
    trigger: null, // send immediately
  });
}

// ── Notification settings helpers ─────────────────────────────
const SETTINGS_KEY = 'cv_notif_settings';
export const DEFAULT_SETTINGS = {
  enabled:      true,
  soundEnabled: true,
  customSound:  'hardcore',  // matches app.json sounds array
  vibrate:      true,
  onValid:      true,
  onUsed:       true,
  onInvalid:    true,
};

export async function getNotificationSettings() {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}

export async function saveNotificationSettings(settings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ── Create Android notification channel ───────────────────────
export async function setupNotificationChannel() {
  await Notifications.setNotificationChannelAsync('card-validations', {
    name:                  'Card Validations',
    description:           'Alerts when users validate cards',
    importance:            Notifications.AndroidImportance.MAX,
    sound:                 'hardcore.mp3',
    vibrationPattern:      [0, 250, 100, 250],
    lockscreenVisibility:  Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd:             true,
  });
}

// ── Permission request ─────────────────────────────────────────
export async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return status === 'granted';
}
