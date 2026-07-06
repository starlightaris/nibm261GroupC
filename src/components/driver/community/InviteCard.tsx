import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { Colors, Radius, Spacing } from '@styles/tokens';

interface Props {
  inviteCode: string;
  vehicleName: string;
  plateNumber: string;
  memberCount: number;
}

export default function InviteCard({
  inviteCode,
  vehicleName,
  plateNumber,
  memberCount,
}: Props) {
  const [copied,    setCopied]    = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <View style={styles.card}>
        {/* Vehicle row */}
        <View style={styles.vehicleRow}>
          <View style={styles.vehicleIcon}>
            <Text style={styles.vehicleEmoji}>🚌</Text>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>{vehicleName}</Text>
            <Text style={styles.plateNumber}>{plateNumber}</Text>
          </View>
          <View style={styles.memberBadge}>
            <Text style={styles.memberCount}>{memberCount}</Text>
            <Text style={styles.memberLabel}>members</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Invite code */}
        <Text style={styles.inviteLabel}>Passenger invite code</Text>
        <View style={styles.codeRow}>
          <Text style={styles.code} selectable>
            {inviteCode.split('').join('  ')}
          </Text>
          <TouchableOpacity
            style={[styles.copyBtn, copied && styles.copyBtnDone]}
            onPress={handleCopy}
            activeOpacity={0.8}
          >
            <Text style={[styles.copyBtnText, copied && styles.copyBtnDoneText]}>
              {copied ? '✓  Copied' : 'Copy'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* QR button */}
        <TouchableOpacity
          style={styles.qrBtn}
          onPress={() => setQrVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.qrBtnText}>Show QR Code</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Share this code or QR with passengers so they can join your community.
        </Text>
      </View>

      {/* QR Modal */}
      <Modal
        visible={qrVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setQrVisible(false)}>
          <Pressable style={styles.qrModal}>
            <Text style={styles.qrTitle}>{vehicleName}</Text>
            <Text style={styles.qrSub}>Scan to join</Text>
            <View style={styles.qrWrapper}>
              <QRCode
                value={inviteCode}
                size={200}
                color={Colors.textPrimary}
                backgroundColor={Colors.white}
              />
            </View>
            <Text style={styles.qrCode}>
              {inviteCode.split('').join('  ')}
            </Text>
            <TouchableOpacity
              style={styles.qrCloseBtn}
              onPress={() => setQrVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.qrCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },

  vehicleRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  vehicleIcon:  { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  vehicleEmoji: { fontSize: 22 },
  vehicleInfo:  { flex: 1 },
  vehicleName:  { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  plateNumber:  { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },

  memberBadge: { alignItems: 'center', backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.pill },
  memberCount: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  memberLabel: { fontSize: 9, color: Colors.primary, fontWeight: '600', textTransform: 'uppercase' },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.lg },

  inviteLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.md },
  codeRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  code:        { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 4, fontVariant: ['tabular-nums'] },

  copyBtn:         { backgroundColor: Colors.primaryLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.button },
  copyBtnDone:     { backgroundColor: '#DCFCE7' },
  copyBtnText:     { fontSize: 13, fontWeight: '700', color: Colors.primary },
  copyBtnDoneText: { color: '#15803D' },

  qrBtn:     { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.button, paddingVertical: 10, alignItems: 'center', marginBottom: Spacing.md },
  qrBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  hint: { fontSize: 12, color: Colors.muted, lineHeight: 18 },

  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  qrModal:   { backgroundColor: Colors.white, borderRadius: Radius.card, padding: Spacing.xxl, alignItems: 'center', width: 300 },
  qrTitle:   { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  qrSub:     { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.xl },
  qrWrapper: { padding: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg },
  qrCode:    { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 4, fontVariant: ['tabular-nums'], marginBottom: Spacing.xl },
  qrCloseBtn:     { backgroundColor: Colors.primary, borderRadius: Radius.button, paddingVertical: 12, paddingHorizontal: 40 },
  qrCloseBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
});