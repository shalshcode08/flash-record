import { Image, Video } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TabKey = 'video' | 'photo';

const tabs = [
  {
    key: 'video',
    label: 'Videos',
    Icon: Video,
  },
  {
    key: 'photo',
    label: 'Photos',
    Icon: Image,
  },
] as const;

export function AppTabBar() {
  const [activeTab, setActiveTab] = useState<TabKey>('video');
  const theme = useTheme();

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.backgroundSelected,
        },
      ]}>
      <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
        {tabs.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;

          return (
            <Pressable
              accessibilityLabel={label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              key={key}
              onPress={() => setActiveTab(key)}
              style={({ pressed }) => [
                styles.tab,
                {
                  backgroundColor: isActive ? theme.background : 'transparent',
                  borderColor: isActive ? theme.backgroundSelected : 'transparent',
                  opacity: pressed ? 0.72 : 1,
                },
              ]}>
              <Icon
                color={isActive ? theme.text : theme.textSecondary}
                size={22}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    width: '100%',
  },
  track: {
    borderRadius: 16,
    flexDirection: 'row',
    gap: Spacing.one,
    maxWidth: 220,
    padding: Spacing.one,
    width: '100%',
  },
  tab: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
});
