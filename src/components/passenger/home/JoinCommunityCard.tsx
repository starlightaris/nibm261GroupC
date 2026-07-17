import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Radius, Spacing } from '@styles/tokens';

interface Props {
  joining: boolean;
  error: string | null;
  onJoin: (code: string) => void;
}

export default function JoinCommunityCard({ joining, error, onJoin }: Props) {
  const [code,        setCode]        = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanned,     setScanned]     = useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setScanned(false);
    setScannerOpen(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScannerOpen(false);
    // QR contains the raw invite code — trim and uppercase to be safe
    const scannedCode = data.trim().toUpperCase().slice(0, 6);
    setCode(scannedCode);
    // Auto-join immediately after scan
    onJoin(scannedCode);
  };

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.icon}>🚌</Text>
        <Text style={styles.title}>Join your community</Text>
        <Text style={styles.body}>
          Enter your driver's invite code or scan their QR to get started.
        </Text>

        {/* Tab strip */}
        <View style={styles.tabs}>
          <Text style={styles.tabLabel}>Enter code</Text>
          <View style={styles.tabDivider} />
          <TouchableOpacity onPress={handleOpenScanner} style={styles.tabBtn}>
            <Text style={styles.tabLabelBtn}>📷  Scan QR</Text>
          </TouchableOpacity>
        </View>

        {/* Code input */}
        <TextInput
          style={styles.input}
          placeholder="A B C 1 2 3"
          placeholderTextColor={Colors.muted}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.btn, (!code.trim() || joining) && styles.btnDisabled]}
          onPress={() => onJoin(code)}
          disabled={!code.trim() || joining}
          activeOpacity={0.85}
        >
          {joining
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Text style={styles.btnText}>Join Community</Text>
          }
        </TouchableOpacity>
      </View>

      {/* QR Scanner Modal */}
      <Modal
        visible={scannerOpen}
        animationType="slide"
        onRequestClose={() => setScannerOpen(false)}
      >
        <View style={styles.scannerRoot}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />

          {/* Overlay with cutout guide */}
          <View style={styles.scannerOverlay} pointerEvents="none">
            <View style={styles.scannerDim} />
            <View style={styles.scannerRow}>
              <View style={styles.scannerDim} />
              <View style={styles.scannerWindow}>
                {/* Corner markers */}
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <View style={styles.scannerDim} />
            </View>
            <View style={styles.scannerDim} />
          </View>

          {/* Instructions */}
          <View style={styles.scannerHint}>
            <Text style={styles.scannerHintText}>
              Point your camera at the driver's QR code
            </Text>
          </View>

          {/* Cancel button */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setScannerOpen(false)}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const WINDOW_SIZE = 220;
const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.xxl,
    marginHorizontal: Spacing.lg,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  icon:  { fontSize: 44, marginBottom: Spacing.md },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  body:  { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xl },

  // Tab strip
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.bg,
    borderRadius: Radius.button,
    padding: 4,
  },
  tabLabel:   { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', color: Colors.primary },
  tabDivider: { width: 1, height: 20, backgroundColor: Colors.border },
  tabBtn:     { flex: 1, alignItems: 'center', paddingVertical: 6 },
  tabLabelBtn:{ fontSize: 13, fontWeight: '600', color: Colors.textSecondary },

  // Code input
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: Spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  error:      { fontSize: 12, color: Colors.error, marginBottom: Spacing.md, textAlign: 'center' },
  btn:        { width: '100%', backgroundColor: Colors.primary, borderRadius: Radius.button, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.sm },
  btnDisabled:{ opacity: 0.45 },
  btnText:    { color: Colors.white, fontSize: 15, fontWeight: '700' },

  // Scanner
  scannerRoot:    { flex: 1, backgroundColor: '#000' },
  camera:         { flex: 1 },

  // Semi-transparent overlay with transparent window
  scannerOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
  scannerDim:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  scannerRow:     { flexDirection: 'row', height: WINDOW_SIZE },
  scannerWindow:  { width: WINDOW_SIZE, height: WINDOW_SIZE },

  // Corner markers
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: Colors.white,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },

  scannerHint: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scannerHintText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  cancelBtn: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: Radius.button,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
});