import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Image } from 'react-native';

export default function AboutScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bgBase }}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ alignItems: 'center', marginBottom: 32, marginTop: 16 }}>
        <Image
          source={require('../../assets/magma-icon-orange.png')}
          style={{ width: 80, height: 80, borderRadius: 18, marginBottom: 16 }}
          resizeMode="contain"
        />
        <Text style={{ fontSize: 28, fontWeight: '800', color: theme.orange, letterSpacing: 2 }}>MAGMA</Text>
        <Text style={{ fontSize: 12, color: theme.textTertiary, letterSpacing: 4, marginTop: 4 }}>NARRATIVE CAPITAL MARKETS</Text>
        <Text style={{ fontSize: 11, color: theme.textTertiary, marginTop: 8 }}>v1.0.0-alpha · Solana Devnet</Text>
      </View>

      {[
        { label: 'WHAT IS MAGMA', text: 'MAGMA is a Solana-native narrative capital market. Back ideas you believe in with $MAGMA, earn real yield while you wait, and get rewarded when the community validates your conviction.' },
        { label: 'HOW IT WORKS', text: 'Submit a narrative thesis. Stake $MAGMA to back it. Your stake earns yield across integrated Solana DeFi protocols. When the narrative resolves TRUE, backers earn a payout. When it resolves FALSE, 35% flows to the Echo Pool — distributed to correct backers.' },
        { label: 'CONVICTION SCORE', text: 'Every backer earns a Conviction Score based on their backing accuracy, streak, and volume. Higher scores unlock better yield multipliers and a larger share of the Echo Pool.' },
        { label: 'NFT TIERS', text: 'Lava Tier Cards (Ember → Volcanic) multiply your yield up to 2.5×. Genesis Origin Cards give 1.1× Echo Pool weight. 10,000 total supply on Metaplex Core.' },
        { label: 'BUILT BY', text: 'ExiDante Corp · Monolith Hackathon 2026 · Solana Foundation' },
      ].map(({ label, text }) => (
        <View key={label} style={{ marginBottom: 20, padding: 16, backgroundColor: theme.bgSurface, borderRadius: 14, borderWidth: 1, borderColor: theme.cardBorder }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: theme.orange, letterSpacing: 2, marginBottom: 8 }}>{label}</Text>
          <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 20 }}>{text}</Text>
        </View>
      ))}

      <View style={{ gap: 12, marginTop: 8 }}>
        {[
          { label: 'Website', url: 'https://magmaprotocol.xyz' },
          { label: 'GitHub', url: 'https://github.com/plinkdev1/magma-protocol' },
          { label: 'Terms & Conditions', url: null, screen: 'Terms' },
        ].map(({ label, url }) => (
          <TouchableOpacity
            key={label}
            style={{ padding: 14, backgroundColor: theme.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: theme.cardBorder, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            onPress={() => url && Linking.openURL(url)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14, color: theme.textPrimary }}>{label}</Text>
            <Text style={{ fontSize: 14, color: theme.textTertiary }}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ textAlign: 'center', fontSize: 10, color: theme.textTertiary, marginTop: 32, letterSpacing: 1 }}>
        © 2026 ExiDante Corp · All rights reserved
      </Text>
    </ScrollView>
  );
}
