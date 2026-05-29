import { router } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function AppHeader() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          borderBottomColor: theme.backgroundSelected,
        },
      ]}>
      <ThemedText type="brand" style={styles.wordmark}>
        FlashRecord
      </ThemedText>

      <Pressable
        accessibilityLabel="Open settings"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => router.push('/settings')}
        style={({ pressed }) => [
          styles.settingsButton,
          {
            backgroundColor: pressed ? theme.backgroundSelected : theme.background,
            borderColor: pressed ? theme.textSecondary : theme.backgroundSelected,
            opacity: pressed ? 0.72 : 1,
          },
        ]}>
        <Settings color={theme.text} size={20} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    width: '100%',
  },
  wordmark: {
    flexShrink: 1,
  },
  settingsButton: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 40,
  },
});
