import {
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
  GeistMono_700Bold,
  useFonts,
} from '@expo-google-fonts/geist-mono';
import { Stack, usePathname } from 'expo-router';
import { Camera, Video } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FloatingBubble, type FloatingBubbleAction } from '@/components/floating-bubble';
import { SettingsProvider, useSettings } from '@/contexts/settings-context';

const bubbleActions: FloatingBubbleAction[] = [
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
    onPress: () => console.log('TODO: take screenshot'),
  },
];

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
  const showBubble = settings.bubbleVisible && !BUBBLE_HIDDEN_ROUTES.has(pathname);
  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
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
});
