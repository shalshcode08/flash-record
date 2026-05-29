import {
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
  GeistMono_700Bold,
  useFonts,
} from '@expo-google-fonts/geist-mono';
import { Stack, usePathname } from 'expo-router';
import { Camera, Video } from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FloatingBubble, type FloatingBubbleAction } from '@/components/floating-bubble';
import { SettingsProvider, useSettings } from '@/contexts/settings-context';
import {
  ScreenshotPermissionError,
  ScreenshotUnavailableError,
  useScreenshot,
} from '@/hooks/use-screenshot';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    GeistMono_400Regular,
    GeistMono_500Medium,
    GeistMono_600SemiBold,
    GeistMono_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <RootShell />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

// Routes where the floating bubble should not appear (it would overlap UI
// the user is trying to interact with).
const BUBBLE_HIDDEN_ROUTES = new Set<string>(['/settings']);

function RootShell() {
  const { settings } = useSettings();
  const pathname = usePathname();
  const { targetRef, capture } = useScreenshot();
  const showBubble = settings.bubbleVisible && !BUBBLE_HIDDEN_ROUTES.has(pathname);

  const bubbleActions = useMemo<FloatingBubbleAction[]>(
    () => [
      {
        key: 'start-capture',
        label: 'Start capturing',
        icon: Video,
        onPress: () => console.log('TODO: start capturing'),
      },
      {
        key: 'screenshot',
        label: 'Take screenshot',
        icon: Camera,
        onPress: () => {
          capture()
            .then((result) => {
              if (result.savedToLibrary) {
                Alert.alert('Screenshot saved', 'Saved to your Photos library.');
              } else {
                Alert.alert(
                  'Screenshot captured',
                  'Saved to the app cache. Build a dev client to enable gallery saves.',
                );
              }
            })
            .catch((error: unknown) => {
              if (error instanceof ScreenshotPermissionError) {
                Alert.alert(
                  'Permission needed',
                  'Allow Photos access in Settings so screenshots can be saved.',
                );
              } else if (error instanceof ScreenshotUnavailableError) {
                Alert.alert(
                  'Screenshots need a dev build',
                  `${error.missing} is not bundled in Expo Go. Run a dev client to use this feature.`,
                );
              } else {
                Alert.alert('Screenshot failed', 'Something went wrong while saving the screenshot.');
              }
            });
        },
      },
    ],
    [capture],
  );

  return (
    <View style={styles.root}>
      {/* Anything inside the captureLayer is included in screenshots. The
          FloatingBubble is rendered as a sibling so it never appears in the
          saved image. */}
      <View ref={targetRef} collapsable={false} style={styles.captureLayer}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </View>
      {showBubble && (
        <FloatingBubble
          actions={bubbleActions}
          bubbleStyle={settings.bubbleStyle}
          bubbleEmoji={settings.bubbleEmoji}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  captureLayer: {
    flex: 1,
  },
});
