import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, Radius, Spacing } from '@styles/tokens';
import { CommunityMember } from '@hooks/useCommunity';
import InitialsAvatar from '@components/driver/activetrip/InitialsAvatar';

// Soft palette — cycles through members to give each a distinct avatar colour
const AVATAR_COLORS = [
  '#DBEAFE', '#EDE9FE', '#FCE7F3', '#D1FAE5',
  '#FEF3C7', '#FFE4E6', '#E0E7FF', '#CCFBF1',
];

function avatarBg(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

interface Props {
  member: CommunityMember;
  index: number;
  isRemoving: boolean;
  onRemove: () => void;
}

export default function MemberRow({ member, index, isRemoving, onRemove }: Props) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [anchorY, setAnchorY]         = useState(0);
  const [anchorX, setAnchorX]         = useState(0);
  const dotsRef = useRef<View>(null);

  const openMenu = () => {
    dotsRef.current?.measure((_fx, _fy, _w, _h, px, py) => {
      setAnchorX(px);
      setAnchorY(py);
      setMenuVisible(true);
    });
  };

  const handleRemove = () => {
    setMenuVisible(false);
    Alert.alert(
      'Remove passenger',
      `Remove ${member.name} from your community? They will need to rejoin with the invite code.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: onRemove,
        },
      ]
    );
  };

  return (
    <View style={styles.row}>
      <InitialsAvatar
        initials={member.initials}
        size={44}
        backgroundColor={avatarBg(index)}
      />

      <View style={styles.info}>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={styles.location} numberOfLines={1}>
          Pickup: {member.pickupLocation.latitude.toFixed(4)},{' '}
          {member.pickupLocation.longitude.toFixed(4)}
        </Text>
      </View>

      {/* Three-dot menu button */}
      {isRemoving ? (
        <ActivityIndicator size="small" color={Colors.muted} style={styles.spinner} />
      ) : (
        <TouchableOpacity
          ref={dotsRef as any}
          style={styles.dotsBtn}
          onPress={openMenu}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.dots}>⋮</Text>
        </TouchableOpacity>
      )}

      {/* Dropdown menu modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View
            style={[
              styles.menu,
              {
                top: anchorY - 8,
                right: 24, // anchor to right edge
              },
            ]}
          >
            <TouchableOpacity style={styles.menuItem} onPress={handleRemove}>
              <Text style={styles.menuItemIcon}>🚫</Text>
              <Text style={styles.menuItemTextDestructive}>
                Remove from community
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  info:     { flex: 1 },
  name:     { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  location: { fontSize: 11, color: Colors.muted, marginTop: 2 },

  dotsBtn: { padding: 4 },
  dots:    { fontSize: 20, color: Colors.textSecondary, fontWeight: '700', lineHeight: 22 },
  spinner: { width: 28 },

  // Dropdown
  overlay: { flex: 1 },
  menu: {
    position: 'absolute',
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    paddingVertical: 4,
    minWidth: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  menuItemIcon:            { fontSize: 15 },
  menuItemTextDestructive: { fontSize: 14, color: Colors.error, fontWeight: '600' },
});