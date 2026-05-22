import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { Brand, Palette, Radius, Spacing, Typography } from '@/constants/theme';

type AppTextInputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
};

export function AppTextInput({
  label,
  error,
  hint,
  style,
  ...props
}: AppTextInputProps) {
  const hasError = Boolean(error);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          hasError && styles.inputError,
          props.editable === false && styles.inputDisabled,
          style,
        ]}
        placeholderTextColor={Palette.textMuted}
        accessibilityLabel={label ?? props.placeholder}
        {...props}
      />
      {hasError ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    color: Palette.text,
    marginBottom: Spacing.sm,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    fontSize: 15,
    color: Palette.text,
    backgroundColor: Palette.surfaceMuted,
  },
  inputError: {
    borderColor: Brand.primary,
    backgroundColor: Brand.primaryLight,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  error: {
    marginTop: Spacing.sm,
    fontSize: 13,
    color: Brand.primary,
  },
  hint: {
    marginTop: Spacing.sm,
    fontSize: 12,
    color: Palette.textMuted,
  },
});
