import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useWallet } from '../context/WalletContext';

const MLAVA_TIERS = [
  { tier: 'ember',    supply: 6850,  price: 0.5,  multiplier: 1.1, fee: '2.0%',    score: '0–99',    color: '#CC7722' },
  { tier: 'flare',    supply: 2500,  price: 1.5,  multiplier: 1.3, fee: '1.5%',    score: '100–299', color: '#FF6B35' },
  { tier: 'magma',    supply: 400,   price: 5.0,  multiplier: 1.6, fee: '1.5%',    score: '300–599', color: '#FF4500' },
  { tier: 'core',     supply: 150,   price: 12.0, multiplier: 2.0, fee: '1.0%',    score: '600–899', color: '#CC0000' },
  { tier: 'volcanic', supply: 100,   price: 25.0, multiplier: 2.5, fee: 'WAIVED',  score: '900+',    color: '#FF0000' },
];

export default function NFTScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { nftState } = useWallet();

  const s = makeStyles(theme, insets);

  const ownedMlava = nftState?.mlava_tier ?? null;
  const ownedGenesis = nftState?.genesis_holder ?? false;

  return (
    <ScrollView
      style={[s.container, { backgroundColor: theme.bgBase }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >

      {/* Header */}
      <Text style={[s.heading, { color: theme.textPrimary }]}>Lava Tier Cards</Text>
      <Text style={[s.subheading, { color: theme.textSecondary }]}>
        10,000 NFTs · Metaplex Core · Solana
      </Text>

      {/* Owned NFT banner */}
      {ownedMlava ? (
        <View style={[s.ownedBanner, { borderColor: MLAVA_TIERS.find(t => t.tier === ownedMlava)?.color ?? theme.orange }]}>
          <Text style={[s.ownedTitle, { color: MLAVA_TIERS.find(t => t.tier === ownedMlava)?.color ?? theme.orange }]}>
            🌋 {ownedMlava.toUpperCase()} NFT — ACTIVE
          </Text>
          <Text style={[s.ownedSub, { color: theme.textSecondary }]}>
            {(MLAVA_TIERS.find(t => t.tier === ownedMlava)?.multiplier ?? 1.0)}x yield multiplier active
          </Text>
          {nftState?.mlava_mint && (
            <TouchableOpacity onPress={() => Linking.openURL('https://solscan.io/token/' + nftState.mlava_mint + '?cluster=devnet')}>
              <Text style={[s.mintLink, { color: theme.orange }]}>
                {nftState.mlava_mint.slice(0, 8)}...{nftState.mlava_mint.slice(-8)} ↗
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={[s.noNFTBanner, { borderColor: theme.cardBorder, backgroundColor: theme.bgSurface }]}>
          <Text style={[s.noNFTTitle, { color: theme.textPrimary }]}>No NFT held</Text>
          <Text style={[s.noNFTSub, { color: theme.textSecondary }]}>
            Your earned Conviction Score applies.{'\n'}NFT mint opens post-mainnet launch.
          </Text>
        </View>
      )}

      {/* Genesis Origin Card */}
      <View style={[s.genesisCard, {
        borderColor: ownedGenesis ? 'rgba(255,215,0,0.5)' : theme.cardBorder,
        backgroundColor: ownedGenesis ? 'rgba(255,215,0,0.06)' : theme.bgSurface,
      }]}>
        <View style={s.genesisHeader}>
          <Text style={[s.genesisTitle, { color: ownedGenesis ? '#FFD700' : theme.textPrimary }]}>
            Genesis Origin Card
          </Text>
          {ownedGenesis && (
            <View style={[s.ownedPill, { backgroundColor: 'rgba(255,215,0,0.15)', borderColor: 'rgba(255,215,0,0.4)' }]}>
              <Text style={[s.ownedPillText, { color: '#FFD700' }]}>HELD</Text>
            </View>
          )}
        </View>
        <Text style={[s.genesisSupply, { color: theme.textTertiary }]}>Supply: 100 · 0% royalty · Commemorative</Text>
        <View style={[s.benefitRow, { borderTopColor: theme.cardBorder }]}>
          <Text style={[s.benefitLabel, { color: theme.textSecondary }]}>Echo Pool boost</Text>
          <Text style={[s.benefitValue, { color: '#FFD700' }]}>1.1× weight</Text>
        </View>
        <View style={[s.benefitRow, { borderTopColor: theme.cardBorder }]}>
          <Text style={[s.benefitLabel, { color: theme.textSecondary }]}>Yield multiplier</Text>
          <Text style={[s.benefitValue, { color: theme.textTertiary }]}>No effect</Text>
        </View>
        {!ownedGenesis && (
          <Text style={[s.genesisNote, { color: theme.textTertiary }]}>
            Distributed via Galxe campaign raffle. 100 winners only.
          </Text>
        )}
      </View>

      {/* Tier table */}
      <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>ALL TIERS</Text>
      {MLAVA_TIERS.map(tier => (
        <View key={tier.tier} style={[s.tierRow, {
          backgroundColor: ownedMlava === tier.tier ? 'rgba(255,107,53,0.08)' : theme.bgSurface,
          borderColor: ownedMlava === tier.tier ? tier.color : theme.cardBorder,
        }]}>
          <View style={[s.tierColorBar, { backgroundColor: tier.color }]} />
          <View style={s.tierInfo}>
            <View style={s.tierTopRow}>
              <Text style={[s.tierName, { color: tier.color }]}>{tier.tier.toUpperCase()}</Text>
              {ownedMlava === tier.tier && (
                <View style={[s.ownedPill, { backgroundColor: tier.color + '20', borderColor: tier.color + '60' }]}>
                  <Text style={[s.ownedPillText, { color: tier.color }]}>YOURS</Text>
                </View>
              )}
            </View>
            <View style={s.tierStats}>
              <Text style={[s.tierStat, { color: theme.textTertiary }]}>Supply: {tier.supply.toLocaleString()}</Text>
              <Text style={[s.tierStat, { color: theme.textTertiary }]}>Score: {tier.score}</Text>
              <Text style={[s.tierStat, { color: theme.textTertiary }]}>Fee: {tier.fee}</Text>
            </View>
          </View>
          <View style={s.tierRight}>
            <Text style={[s.tierMultiplier, { color: tier.color }]}>{tier.multiplier}x</Text>
            <Text style={[s.tierPrice, { color: theme.textTertiary }]}>{tier.price} SOL</Text>
          </View>
        </View>
      ))}

      {/* Mint CTA */}
      <View style={[s.mintCard, { backgroundColor: theme.bgSurface, borderColor: theme.cardBorder }]}>
        <Text style={[s.mintTitle, { color: theme.textPrimary }]}>Mint opens post-mainnet</Text>
        <Text style={[s.mintSub, { color: theme.textSecondary }]}>
          Lava Tier Cards mint after mainnet launch.{'\n'}Priority access for top waitlist wallets.
        </Text>
        <TouchableOpacity
          style={[s.mintBtn, { backgroundColor: 'rgba(255,107,53,0.1)', borderColor: 'rgba(255,107,53,0.3)' }]}
          onPress={() => Linking.openURL('https://magmaprotocol.xyz')}
          activeOpacity={0.8}
        >
          <Text style={[s.mintBtnText, { color: theme.orange }]}>Join Waitlist ↗</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const makeStyles = (theme: any, insets: any) => StyleSheet.create({
  container:      { flex: 1 },
  content:        { padding: 16, gap: 12, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
  heading:        { fontSize: 24, fontWeight: '800', letterSpacing: 1 },
  subheading:     { fontSize: 12, marginBottom: 4 },
  ownedBanner:    { borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 6 },
  ownedTitle:     { fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  ownedSub:       { fontSize: 13 },
  mintLink:       { fontSize: 11, marginTop: 4 },
  noNFTBanner:    { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6, alignItems: 'center' },
  noNFTTitle:     { fontSize: 15, fontWeight: '700' },
  noNFTSub:       { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  genesisCard:    { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  genesisHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  genesisTitle:   { fontSize: 15, fontWeight: '700' },
  genesisSupply:  { fontSize: 11 },
  benefitRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  benefitLabel:   { fontSize: 13 },
  benefitValue:   { fontSize: 13, fontWeight: '600' },
  genesisNote:    { fontSize: 11, fontStyle: 'italic', marginTop: 4 },
  ownedPill:      { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999, borderWidth: 1 },
  ownedPillText:  { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  sectionTitle:   { fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase', marginTop: 4 },
  tierRow:        { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  tierColorBar:   { width: 4, alignSelf: 'stretch' },
  tierInfo:       { flex: 1, padding: 12, gap: 4 },
  tierTopRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierName:       { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  tierStats:      { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  tierStat:       { fontSize: 11 },
  tierRight:      { padding: 12, alignItems: 'flex-end', gap: 2 },
  tierMultiplier: { fontSize: 20, fontWeight: '900' },
  tierPrice:      { fontSize: 11 },
  mintCard:       { borderRadius: 16, borderWidth: 1, padding: 20, gap: 8, alignItems: 'center', marginTop: 4 },
  mintTitle:      { fontSize: 16, fontWeight: '700' },
  mintSub:        { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  mintBtn:        { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 9999, borderWidth: 1 },
  mintBtnText:    { fontSize: 14, fontWeight: '700' },
});
