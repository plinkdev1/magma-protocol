import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  Image,
  Dimensions,
} from 'react-native';
import { useWallet } from '../context/WalletContext';

const { width } = Dimensions.get('window');

const COLORS = {
  background: '#080400',
  card: '#1a0f0a',
  primary: '#ff6b35',
  accent: '#ffb347',
  text: '#f0d8c0',
  muted: '#7a4a30',
  border: '#3d2a1f',
};

const WALLETS = [
  { id: 'phantom',  name: 'Phantom',  appLink: 'phantom://',  logo: require('../../assets/logos/wallets/phantom.jpg') },
  { id: 'backpack', name: 'Backpack', appLink: 'backpack://', logo: require('../../assets/logos/wallets/backpack.jpg') },
  { id: 'solflare', name: 'Solflare', appLink: 'solflare://', logo: require('../../assets/logos/wallets/solflare.jpg') },
  { id: 'jupiter',  name: 'Jupiter',  appLink: 'jupiter://',  logo: require('../../assets/logos/wallets/jupiter.png') },
];

interface WalletPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const WalletPickerModal: React.FC<WalletPickerModalProps> = ({
  visible,
  onClose,
  onConnected,
}) => {
  const { connect, isConnecting } = useWallet();

  const handleWalletSelect = useCallback(async (appLink: string) => {
    onClose();
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      await Linking.openURL(appLink);
      await new Promise(resolve => setTimeout(resolve, 600));
      await connect();
      onConnected?.();
    } catch (err) {
      console.error('[WalletPickerModal] Failed:', err);
    }
  }, [connect, onClose, onConnected]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Connect Wallet</Text>
          <Text style={styles.subtitle}>Choose your Solana wallet</Text>
          <View style={styles.grid}>
            {WALLETS.map((wallet) => (
              <TouchableOpacity
                key={wallet.id}
                style={styles.walletCard}
                onPress={() => handleWalletSelect(wallet.appLink)}
                disabled={isConnecting}
                activeOpacity={0.7}
              >
                <Image source={wallet.logo} style={styles.walletLogo} resizeMode="contain" />
                <Text style={styles.walletName}>{wallet.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingBottom: 40, paddingHorizontal: 24, borderTopWidth: 1, borderColor: COLORS.border },
  handle: { width: 40, height: 4, backgroundColor: COLORS.muted, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 4, fontFamily: 'SpaceMono' },
  subtitle: { fontSize: 13, color: COLORS.muted, textAlign: 'center', marginBottom: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  walletCard: { width: (width - 72) / 2, backgroundColor: COLORS.background, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 16, alignItems: 'center', gap: 10 },
  walletLogo: { width: 56, height: 56, borderRadius: 12 },
  walletName: { fontSize: 13, fontWeight: '600', color: COLORS.text, fontFamily: 'SpaceMono' },
  cancelButton: { paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 15, color: COLORS.muted },
});

export default WalletPickerModal;
