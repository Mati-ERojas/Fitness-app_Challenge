import { StyleSheet, View } from 'react-native';

type DumbbellMarkProps = {
  primary: string;
  accent: string;
};

export function DumbbellMark({ primary, accent }: DumbbellMarkProps) {
  return (
    <View accessibilityElementsHidden style={styles.mark}>
      <View style={[styles.bar, { backgroundColor: primary }]} />
      <View style={[styles.plate, styles.outerLeft, { backgroundColor: accent }]} />
      <View style={[styles.plate, styles.innerLeft, { backgroundColor: primary }]} />
      <View style={[styles.plate, styles.innerRight, { backgroundColor: primary }]} />
      <View style={[styles.plate, styles.outerRight, { backgroundColor: accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 4,
    borderRadius: 2,
  },
  plate: {
    position: 'absolute',
    borderRadius: 4,
  },
  outerLeft: {
    left: 5,
    width: 7,
    height: 28,
  },
  innerLeft: {
    left: 13,
    width: 6,
    height: 20,
  },
  innerRight: {
    right: 13,
    width: 6,
    height: 20,
  },
  outerRight: {
    right: 5,
    width: 7,
    height: 28,
  },
});
