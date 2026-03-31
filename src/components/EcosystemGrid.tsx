// src/components/EcosystemGrid.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
const { width: W } = Dimensions.get('window');
const CARD_SIZE = (W - 32 - 40) / 5;
const ECOSYSTEM = [
  { name: 'Meteora',    logo: require('../../assets/logos/protocols/meteora.jpg') },
  { name: 'Kamino',    logo: require('../../assets/logos/protocols/kamino.jpg') },
  { name: 'Save',      logo: require('../../assets/logos/protocols/save.jpg') },
  { name: 'Jupiter',   logo: require('../../assets/logos/protocols/jupiter.jpg') },
  { name: 'Orca',      logo: require('../../assets/logos/protocols/orca.jpg') },
  { name: 'Raydium',   logo: require('../../assets/logos/protocols/raydium.jpg') },
  { name: 'Jito',      logo: require('../../assets/logos/protocols/jito.jpg') },
  { name: 'Marinade',  logo: require('../../assets/logos/protocols/marinade.jpg') },
  { name: 'Phantom',   logo: require('../../assets/logos/wallets/phantom.jpg') },
  { name: 'Backpack',  logo: require('../../assets/logos/wallets/backpack.jpg') },
  { name: 'Solflare',  logo: require('../../assets/logos/wallets/solflare.jpg') },
  { name: 'Seeker',    logo: require('../../assets/logos/wallets/seeker.jpg') },
  { name: 'Sol Mobile',logo: require('../../assets/logos/wallets/solanamobile.jpg') },
];
export const EcosystemGrid: React.FC = () => {
  const { theme } = useTheme();
  return (
    <View style={s.wrap}>
      <Text style={[s.title, { color: theme.textTertiary }]}>SOLANA ECOSYSTEM</Text>
      <View style={s.grid}>
        {ECOSYSTEM.map((item) => (
          <View key={item.name} style={[s.card, { backgroundColor: theme.bgSurface, borderColor: theme.cardBorder }]}>
            <Image source={item.logo} style={s.logo} resizeMode="contain" />
            <Text style={[s.name, { color: theme.textTertiary }]}>{item.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
const s = StyleSheet.create({
  wrap: { marginTop: 24, marginBottom: 32 },
  title: { fontSize: 10, fontFamily: 'SpaceMono', letterSpacing: 2, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    width: CARD_SIZE, alignItems: 'center',
    borderWidth: 1, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 4, gap: 5,
  },
  logo: { width: 32, height: 32, borderRadius: 8 },
  name: { fontSize: 7, fontFamily: 'SpaceMono', textAlign: 'center', letterSpacing: 0.2 },
});
