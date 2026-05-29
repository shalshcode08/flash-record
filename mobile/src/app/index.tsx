import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { AppTabBar } from '@/components/app-tab-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <AppHeader />
        <ThemedView style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            New project
          </ThemedText>
          <ThemedText style={styles.subtitle} themeColor="textSecondary">
            The starter boilerplate has been removed. This screen is ready for the next product
            direction.
          </ThemedText>
        </ThemedView>
        <AppTabBar />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    width: '100%',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 360,
    textAlign: 'center',
  },
});
