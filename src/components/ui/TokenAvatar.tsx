import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';

// ─── CoinGecko CDN URLs ───────────────────────────────────────────────────────

export const TOKEN_LOGOS: Record<string, string> = {
  SOL:     'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  USDC:    'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  BONK:    'https://assets.coingecko.com/coins/images/28600/small/bonk.jpg',
  RAY:     'https://assets.coingecko.com/coins/images/13928/small/PSigc4ie_400x400.jpg',
  JUP:     'https://assets.coingecko.com/coins/images/34188/small/jup.png',
  WIF:     'https://assets.coingecko.com/coins/images/33947/small/wif.png',
  JTO:     'https://assets.coingecko.com/coins/images/33001/small/jto.png',
  PYTH:    'https://assets.coingecko.com/coins/images/31924/small/pyth.png',
  KMNO:    'https://assets.coingecko.com/coins/images/36736/small/kmno.png',
  MET:     'https://assets.coingecko.com/coins/images/36662/small/meteora.png',
  DRIFT:   'https://assets.coingecko.com/coins/images/35162/small/drift.png',
  VIRTUAL: 'https://assets.coingecko.com/coins/images/34051/small/virtual.png',
  PENGU:   'https://assets.coingecko.com/coins/images/34835/small/pengu.png',
  PUMP:    'https://assets.coingecko.com/coins/images/36107/small/pump.png',
  CAKE:    'https://assets.coingecko.com/coins/images/12632/small/pancakeswap-cake-logo.png',
  ETH:     'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  BTC:     'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  USDT:    'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  BNB:     'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  MATIC:   'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
  SKR:     '', // no CoinGecko listing yet
};

// ─── Letter avatar colors ─────────────────────────────────────────────────────

export const AVATAR_COLORS: Record<string, string> = {
  SOL:     '#9945FF',
  USDC:    '#2775CA',
  BONK:    '#F7931A',
  RAY:     '#3ECBC3',
  JUP:     '#C7F284',
  WIF:     '#FF6B6B',
  JTO:     '#6BFFB8',
  PYTH:    '#E6DAFE',
  KMNO:    '#FF8C42',
  MET:     '#00D4AA',
  DRIFT:   '#4B6EF5',
  VIRTUAL: '#7B61FF',
  PENGU:   '#5CB8E4',
  PUMP:    '#FF4500',
  CAKE:    '#1FC7D4',
  ETH:     '#627EEA',
  BTC:     '#F7931A',
  USDT:    '#26A17B',
  BNB:     '#F3BA2F',
  MATIC:   '#8247E5',
  SKR:     '#FF6B35',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface TokenAvatarProps {
  symbol: string;
  size?:  number;
}

const TokenAvatar: React.FC<TokenAvatarProps> = ({ symbol, size = 32 }) => {
  const [imgError, setImgError] = useState(false);
  const logoUri = TOKEN_LOGOS[symbol.toUpperCase()];
  const bg      = AVATAR_COLORS[symbol.toUpperCase()] || '#FF6B35';

  if (logoUri && !imgError) {
    return (
      <Image
        source={{ uri: logoUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <View style={{
      width:           size,
      height:          size,
      borderRadius:    size / 2,
      backgroundColor: bg + '33',
      borderWidth:     1,
      borderColor:     bg + '88',
      alignItems:      'center',
      justifyContent:  'center',
    }}>
      <Text style={{ fontSize: size * 0.38, fontWeight: '700', color: bg }}>
        {symbol.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
};

export default TokenAvatar;
