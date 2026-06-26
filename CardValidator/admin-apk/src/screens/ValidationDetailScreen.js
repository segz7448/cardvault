// src/screens/ValidationDetailScreen.js
import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image,
  TouchableOpacity, Linking, Alert, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { colors, typography } from '../theme';

const STATUS_CONFIG = {
  valid:   { emoji: '✅', color: colors.success, label: 'Valid' },
  used:    { emoji: '⚠️', color: colors.warn,    label: 'Already Used' },
  invalid: { emoji: '❌', color: colors.danger,  label: 'Invalid' },
  pending: { emoji: '⏳', color: colors.text3,   label: 'Pending' },
};

export default function ValidationDetailScreen({ route, navigation }) {
  const insets     = useSafeAreaInsets();
  const { validation } = route.params;
  const cfg = STATUS_CONFIG[validation.status] || STATUS_CONFIG.pending;

  const downloadImage = async () => {
    if (!validation.image_url) { Alert.alert('No image', 'No image was uploaded for this validation.'); return; }
    await Linking.openURL(validation.image_url);
  };

  const shareValidation = async () => {
    await Share.share({
      message: `CardValidator Result\nCode: ${validation.card_code}\nStatus: ${cfg.label}\nDate: ${format(new Date(validation.created_at), 'PPpp')}`,
    });
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 100 }}
    >
      {/* Status banner */}
      <View style={[styles.banner, { borderColor: cfg.color + '44', backgroundColor: cfg.color + '15' }]}>
        <Text style={styles.bannerEmoji}>{cfg.emoji}</Text>
        <Text style={[styles.bannerLabel, { color: cfg.color }]}>{cfg.label}</Text>
      </View>

      {/* Code */}
      <View style={styles.card}>
        <InfoRow label="Card Code"    value={validation.card_code} mono />
        <InfoRow label="Status"       value={cfg.label} />
        <InfoRow label="Validated At" value={validation.validated_at ? format(new Date(validation.validated_at), 'PPpp') : 'N/A'} />
        <InfoRow label="Submitted At" value={format(new Date(validation.created_at), 'PPpp')} />
        <InfoRow label="IP Address"   value={validation.ip_address || 'Unknown'} />
        <InfoRow label="Record ID"    value={validation.id} mono small />
      </View>

      {/* Card image preview */}
      {validation.image_url ? (
        <View style={styles.imageSection}>
          <Text style={styles.sectionLabel}>Uploaded Card Image</Text>
          <View style={styles.imageCard}>
            <Image
              source={{ uri: validation.image_url }}
              style={styles.cardImage}
              resizeMode="contain"
            />
            {/* Download button */}
            <TouchableOpacity style={styles.downloadBtn} onPress={downloadImage}>
              <Text style={styles.downloadText}>⬇ Download Image</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.noImageCard}>
          <Text style={styles.noImageText}>🖼 No image uploaded</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={shareValidation}>
          <Text style={styles.btnText}>📤 Share Result</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnBack]} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value, mono, small }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.mono, small && styles.small]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.bg },
  banner:        { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  bannerEmoji:   { fontSize: 32 },
  bannerLabel:   { fontSize: 22, fontWeight: '700', fontFamily: typography.display },
  card:          { backgroundColor: colors.glass, borderRadius: 16, borderWidth: 1, borderColor: colors.glassBorder, marginHorizontal: 16, marginBottom: 16, overflow: 'hidden' },
  infoRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', gap: 12 },
  infoLabel:     { color: colors.text3, fontSize: 12, fontFamily: typography.body, flex: 1 },
  infoValue:     { color: colors.text1, fontSize: 14, fontFamily: typography.body, flex: 2, textAlign: 'right' },
  mono:          { fontFamily: 'monospace', letterSpacing: 0.5 },
  small:         { fontSize: 11, color: colors.text2 },
  sectionLabel:  { color: colors.text3, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: 16, marginBottom: 8, fontFamily: typography.body },
  imageSection:  { marginBottom: 16 },
  imageCard:     { backgroundColor: colors.glass, borderRadius: 16, borderWidth: 1, borderColor: colors.glassBorder, marginHorizontal: 16, overflow: 'hidden', alignItems: 'center', padding: 16 },
  cardImage:     { width: '100%', height: 200, borderRadius: 10, marginBottom: 14 },
  downloadBtn:   { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  downloadText:  { color: '#fff', fontWeight: '600', fontFamily: typography.body, fontSize: 14 },
  noImageCard:   { backgroundColor: colors.glass, borderRadius: 16, borderWidth: 1, borderColor: colors.glassBorder, marginHorizontal: 16, padding: 32, alignItems: 'center', marginBottom: 16 },
  noImageText:   { color: colors.text3, fontFamily: typography.body },
  actions:       { flexDirection: 'row', gap: 10, marginHorizontal: 16 },
  btn:           { flex: 1, backgroundColor: colors.glass, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  btnBack:       { backgroundColor: 'rgba(124,109,250,0.12)', borderColor: 'rgba(124,109,250,0.3)' },
  btnText:       { color: colors.text1, fontWeight: '500', fontFamily: typography.body, fontSize: 14 },
});
