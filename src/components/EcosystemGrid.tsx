// src/components/EcosystemGrid.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';

const { width: W } = Dimensions.get('window');
const CARD_SIZE = (W - 32 - 40) / 5;

const ECOSYSTEM = [
  { name: 'Meteora',   logo: require('../../assets/logos/protocols/meteora.png') },
  { name: 'Kamino',   logo: require('../../assets/logos/protocols/kamino.png') },
  { name: 'Save',     logo: require('../../assets/logos/protocols/save.png') },
  { name: 'Jupiter',  logo: require('../../assets/logos/protocols/jupiter.png') },
  { name: 'Orca',     logo: require('../../assets/logos/protocols/orca.png') },
  { name: 'Raydium',  logo: require('../../assets/logos/protocols/raydium.png') },
  { name: 'Jito',     logo: require('../../assets/logos/protocols/jito.png') },
  { name: 'Marinade', logo: require('../../assets/logos/protocols/marinade.png') },
  { name: 'Phantom',  logo: require('../../assets/logos/wallets/phantom.png') },
  { name: 'Backpack', logo: require('../../assets/logos/wallets/backpack.png') },
  { name: 'Solflare', logo: require('../../assets/logos/wallets/solflare.png') },
  { name: 'Seeker',   logo: require('../../assets/logos/wallets/seeker.png') },
  { name: 'Sol Mobile', logo: require('../../assets/logos/wallets/solanamobile.png') },
];

export const EcosystemGrid: React.FC = () => (
  <View style={s.wrap}>
    <Text style={s.title}>SOLANA ECOSYSTEM</Text>
    <View style={s.grid}>
      {ECOSYSTEM.map((item) => (
        <View key={item.name} style={s.card}>
          <Image source={item.logo} style={s.logo} resizeMode="contain" />
          <Text style={s.name}>{item.name}</Text>
        </View>
      ))}
    </View>
  </View>
);

const s = StyleSheet.create({
  wrap: {
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 10,
    color: '#7a4a30',
    fontFamily: 'SpaceMono',
    letterSpacing: 2,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    width: CARD_SIZE,
    alignItems: 'center',
    backgroundColor: '#130b02',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 5,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  name: {
    fontSize: 7,
    color: 'rgba(255,232,208,0.45)',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
