import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, Palette, Spacing } from '@/constants/theme';

type Step = {
  label: string;
  done: boolean;
};

type StepIndicatorProps = {
  steps: Step[];
};

export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <View style={styles.row}>
      {steps.map((step, index) => (
        <Fragment key={step.label}>
          <View style={styles.stepItem}>
            <View style={[styles.circle, step.done && styles.circleDone]}>
              <Text style={[styles.circleText, step.done && styles.circleTextDone]}>
                {step.done ? '✓' : index + 1}
              </Text>
            </View>
            <Text style={[styles.label, step.done && styles.labelDone]}>{step.label}</Text>
          </View>
          {index < steps.length - 1 ? (
            <View style={[styles.line, step.done && styles.lineDone]} />
          ) : null}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  stepItem: {
    alignItems: 'center',
    minWidth: 76,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleDone: {
    backgroundColor: Brand.primary,
  },
  circleText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  circleTextDone: {
    color: Brand.white,
  },
  label: {
    fontSize: 11,
    color: Palette.textMuted,
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
  labelDone: {
    color: Brand.primary,
  },
  line: {
    width: 24,
    height: 2,
    backgroundColor: Palette.border,
    marginTop: 15,
    marginHorizontal: 2,
  },
  lineDone: {
    backgroundColor: Brand.primary,
  },
});
