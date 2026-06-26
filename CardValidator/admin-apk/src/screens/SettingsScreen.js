// src/screens/SettingsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getNotificationSettings,
  saveNotificationSettings,
  DEFAULT_SETTINGS,
  setupNotificationChannel,
  sendNotification,
  registerHeartbeat,
  unregisterHeartbeat,
} from '../services/backgroundService';
import { colors, typography } from '../theme';

const SOUND_OPTIONS = [
  { id: 'hardcore',  label: '🔥 Hardcore (Default)' },
  { id: 'default',   label: '🔔 System Default' },
  { id: 'alert',     label: '⚡ Alert Buzz' },
  { id: 'chime',     label: '🎵 Chime' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving,   setSaving]   = useState(false);
  const [loaded,   setLoaded]   = useState(false);

  useEffect(() => {
    getNotificationSettings().then(s => { setSettings(s); setLoaded(true); });
  }, []);

  const update = async (key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    await saveNotificationSettings(next);
    if (key === 'customSound') await setupNotificationChannel();
  };

  const testNotif = async () => {
    await sendNotification({
      card_code: 'TEST-CARD-000',
      status:    'valid',
      id:        'test',
    });
    Alert.alert('Test Sent', 'You should hear the notification now.');
  };

  const resetSettings = async () => {
    await saveNotificationSettings(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  };

  if (!loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 100 }}
    >
      <Text style={styles.pageTitle}>Settings</Text>

      {/* Notifications section */}
      <SectionLabel label="Notifications" />

      <SettingRow
        label="Enable Notifications"
        description="Receive alerts when users validate cards"
        value={settings.enabled}
        onToggle={v => update('enabled', v)}
      />
      <SettingRow
        label="Sound"
        description="Play sound with notifications"
        value={settings.soundEnabled}
        onToggle={v => update('soundEnabled', v)}
      />
      <SettingRow
        label="Vibrate"
        description="Vibrate on incoming validation"
        value={settings.vibrate}
        onToggle={v => update('vibrate', v)}
      />

      {/* Sound picker */}
      <SectionLabel label="Notification Sound" />
      <View style={styles.card}>
        {SOUND_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={styles.soundOption}
            onPress={() => update('customSound', opt.id)}
          >
            <Text style={styles.soundLabel}>{opt.label}</Text>
            <View style={[styles.radio, settings.customSound === opt.id && styles.radioSelected]}>
              {settings.customSound === opt.id && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Alert types */}
      <SectionLabel label="Alert Types" />
      <View style={styles.card}>
        <SettingRow compact label="Valid Cards"   value={settings.onValid}   onToggle={v => update('onValid',   v)} />
        <SettingRow compact label="Used Cards"    value={settings.onUsed}    onToggle={v => update('onUsed',    v)} />
        <SettingRow compact label="Invalid Cards" value={settings.onInvalid} onToggle={v => update('onInvalid', v)} />
      </View>

      {/* Background */}
      <SectionLabel label="Background Service" />
      <View style={styles.card}>
        <Text style={styles.bgDesc}>
          The heartbeat pings Supabase every 30 seconds to keep your database
          connection alive and check for new validations — even when the app is closed.
        </Text>
        <View style={styles.bgButtons}>
          <TouchableOpacity style={styles.btn} onPress={registerHeartbeat}>
            <Text style={styles.btnText}>▶ Start Heartbeat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={unregisterHeartbeat}>
            <Text style={[styles.btnText, { color: colors.danger }]}>⏹ Stop</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Actions */}
      <SectionLabel label="Actions" />
      <View style={styles.card}>
        <TouchableOpacity style={styles.btn} onPress={testNotif}>
          <Text style={styles.btnText}>🔔 Send Test Notification</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { marginTop: 10 }]} onPress={resetSettings}>
          <Text style={[styles.btnText, { color: colors.text3 }]}>↺ Reset to Defaults</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>CardValidator Admin v1.0.0</Text>
    </ScrollView>
  );
}

function SectionLabel({ label }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function SettingRow({ label, description, value, onToggle, compact }) {
  return (
    <View style={[styles.settingRow, compact && styles.settingRowCompact]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDesc}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.glass, true: colors.accent }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  center:      { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  pageTitle:   { color: colors.text1, fontSize: 28, fontWeight: '700', fontFamily: typography.display, paddingHorizontal: 20, marginBottom: 24 },
  card:        { backgroundColor: colors.glass, borderRadius: 16, borderWidth: 1, borderColor: colors.glassBorder, marginHorizontal: 20, marginBottom: 8, padding: 16, overflow: 'hidden' },
  sectionLabel:{ color: colors.text3, fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 8, marginTop: 20, fontFamily: typography.body },
  settingRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  settingRowCompact: { paddingVertical: 8 },
  settingLabel:{ color: colors.text1, fontSize: 15, fontFamily: typography.body },
  settingDesc: { color: colors.text3, fontSize: 12, marginTop: 2, fontFamily: typography.body },
  soundOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  soundLabel:  { color: colors.text1, fontSize: 14, fontFamily: typography.body },
  radio:       { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.text3, alignItems: 'center', justifyContent: 'center' },
  radioSelected:{ borderColor: colors.accent },
  radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  bgDesc:      { color: colors.text2, fontSize: 13, fontFamily: typography.body, lineHeight: 20, marginBottom: 14 },
  bgButtons:   { flexDirection: 'row', gap: 10 },
  btn:         { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  btnDanger:   { borderColor: 'rgba(255,77,109,0.3)', backgroundColor: 'rgba(255,77,109,0.08)' },
  btnText:     { color: colors.text1, fontSize: 13, fontWeight: '500', fontFamily: typography.body },
  version:     { color: colors.text3, fontSize: 11, textAlign: 'center', marginTop: 32, fontFamily: typography.body },
});
