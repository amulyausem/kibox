import { Image } from 'react-native';

interface Props {
  size?: number;
}

export function BrandMark({ size = 28 }: Props) {
  return (
    <Image
      source={require('@/assets/brand/kibox-logo.png')}
      style={{ width: size, height: size, borderRadius: 7 }}
      accessibilityLabel="Kibox"
    />
  );
}
