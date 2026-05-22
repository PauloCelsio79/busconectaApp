import { StyleSheet, Text, View } from 'react-native';

import { Palette, Spacing, Typography } from '@/constants/theme';

type SectionTitleProps = {
  title: string;
  hint?: string;
};

export function SectionTitle({ title, hint }: SectionTitleProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.label,
    fontSize: 16,
    color: Palette.text,
  },
  hint: {
    fontSize: 12,
    color: Palette.textMuted,
    fontWeight: '600',
  },
});
