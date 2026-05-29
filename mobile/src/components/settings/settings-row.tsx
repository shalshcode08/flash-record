import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BaseRowProps = {
  label: string;
  description?: string;
};

function useCardStyle() {
  const theme = useTheme();
  return {
    backgroundColor: theme.background,
    borderColor: theme.backgroundSelected,
  };
}

export function SettingsToggleRow({
  label,
  description,
  value,
  onValueChange,
}: BaseRowProps & {
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  const theme = useTheme();
  const card = useCardStyle();
  return (
    <View style={[styles.card, styles.rowInline, card]}>
      <View style={styles.textBlock}>
        <ThemedText type="default">{label}</ThemedText>
        {description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={theme.background}
        trackColor={{ false: theme.backgroundSelected, true: theme.text }}
      />
    </View>
  );
}

export type SelectOption<T> = {
  value: T;
  label: string;
};

export function SettingsSelectRow<T extends string | number>({
  label,
  description,
  value,
  options,
  onChange,
}: BaseRowProps & {
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (next: T) => void;
}) {
  const theme = useTheme();
  const card = useCardStyle();
  return (
    <View style={[styles.card, styles.rowStacked, card]}>
      <View style={styles.textBlock}>
        <ThemedText type="default">{label}</ThemedText>
        {description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
      <View style={[styles.pillGroup, { backgroundColor: theme.backgroundElement }]}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.pill,
                {
                  backgroundColor: selected ? theme.background : 'transparent',
                  borderColor: selected ? theme.backgroundSelected : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ThemedText
                type={selected ? 'smallBold' : 'small'}
                themeColor={selected ? 'text' : 'textSecondary'}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SettingsInfoRow({
  label,
  value,
}: BaseRowProps & {
  value: string;
}) {
  const card = useCardStyle();
  return (
    <View style={[styles.card, styles.rowInline, card]}>
      <ThemedText type="default" style={styles.infoLabel}>
        {label}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {value}
      </ThemedText>
    </View>
  );
}

export function SettingsActionRow({
  label,
  description,
  onPress,
  destructive,
}: BaseRowProps & {
  onPress: () => void;
  destructive?: boolean;
}) {
  const theme = useTheme();
  const card = useCardStyle();
  const tint = destructive ? '#E5484D' : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        card,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <ThemedText type="default" style={{ color: tint }}>
        {label}
      </ThemedText>
      {description ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.actionDescription}>
          {description}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </ThemedText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  rowInline: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rowStacked: {
    alignItems: 'stretch',
    flexDirection: 'column',
    gap: Spacing.two,
  },
  textBlock: {
    flex: 1,
    gap: Spacing.half,
  },
  pillGroup: {
    borderRadius: 12,
    flexDirection: 'row',
    gap: Spacing.half,
    padding: Spacing.half,
  },
  pill: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  infoLabel: {
    flex: 1,
  },
  actionDescription: {
    marginTop: Spacing.half,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.three,
    letterSpacing: 1,
  },
  sectionBody: {
    gap: Spacing.two,
  },
});
