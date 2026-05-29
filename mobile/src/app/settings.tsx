import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BubbleStylePicker } from '@/components/settings/bubble-style-picker';
import {
  SettingsActionRow,
  SettingsInfoRow,
  SettingsSection,
  SettingsSelectRow,
  SettingsTextRow,
  SettingsToggleRow,
} from '@/components/settings/settings-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  type AudioSource,
  type CountdownSeconds,
  type FrameRate,
  sanitizeAlbumName,
  useSettings,
  type VideoQuality,
} from '@/contexts/settings-context';
import { useTheme } from '@/hooks/use-theme';

const VIDEO_QUALITY_OPTIONS = [
  { value: '720p', label: '720p' },
  { value: '1080p', label: '1080p' },
  { value: 'source', label: 'Source' },
] as const satisfies readonly { value: VideoQuality; label: string }[];

const FRAME_RATE_OPTIONS = [
  { value: 30, label: '30 fps' },
  { value: 60, label: '60 fps' },
] as const satisfies readonly { value: FrameRate; label: string }[];

const COUNTDOWN_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 3, label: '3s' },
  { value: 5, label: '5s' },
  { value: 10, label: '10s' },
] as const satisfies readonly { value: CountdownSeconds; label: string }[];

const AUDIO_SOURCE_OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: 'mic', label: 'Mic' },
  { value: 'system', label: 'Screen' },
  { value: 'both', label: 'Both' },
] as const satisfies readonly { value: AudioSource; label: string }[];

const APP_VERSION = Constants.expoConfig?.version ?? '—';

export default function SettingsScreen() {
  const theme = useTheme();
  const { settings, update, reset } = useSettings();

  const confirmReset = () => {
    Alert.alert(
      'Reset all settings?',
      'This restores defaults for capture, bubble, and other preferences. Saved recordings are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: reset },
      ],
    );
  };
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Track the keyboard height so we can pad the scroll content out from under it,
  // and scroll the focused input into view once the layout has settled.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      // Let the new padding apply, then scroll past it.
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToBottomSoon = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.background,
              borderBottomColor: theme.backgroundSelected,
            },
          ]}
        >
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: pressed ? theme.backgroundSelected : theme.background,
                borderColor: theme.backgroundSelected,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <ChevronLeft color={theme.text} size={20} strokeWidth={2} />
          </Pressable>
          <ThemedText type="brand" style={styles.title}>
            Settings
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            // Pad the bottom by the keyboard height so scrollToEnd can reveal
            // the focused input above it.
            { paddingBottom: Math.max(Spacing.six, keyboardHeight + Spacing.three) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>
            <SettingsSection title="Capture">
              <SettingsSelectRow
                label="Video quality"
                description="Higher resolution produces larger files."
                value={settings.videoQuality}
                options={VIDEO_QUALITY_OPTIONS}
                onChange={(next) => update('videoQuality', next)}
              />
              <SettingsSelectRow
                label="Frame rate"
                description="60 fps captures smoother motion."
                value={settings.frameRate}
                options={FRAME_RATE_OPTIONS}
                onChange={(next) => update('frameRate', next)}
              />
              <SettingsSelectRow
                label="Countdown"
                description="Delay before recording starts."
                value={settings.countdownSeconds}
                options={COUNTDOWN_OPTIONS}
                onChange={(next) => update('countdownSeconds', next)}
              />
              <SettingsToggleRow
                label="Show taps on screen"
                description="Draw a marker where you tap, so viewers can see what's being touched in the recording."
                value={settings.showTouches}
                onValueChange={(next) => update('showTouches', next)}
              />
            </SettingsSection>

            <SettingsSection title="Audio">
              <SettingsSelectRow
                label="Audio source"
                description="Mic uses any connected microphone (Bluetooth, wired, or built-in). Screen captures on-screen / playback audio."
                value={settings.audioSource}
                options={AUDIO_SOURCE_OPTIONS}
                onChange={(next) => update('audioSource', next)}
              />
            </SettingsSection>

            <SettingsSection title="Bubble">
              <SettingsToggleRow
                label="Show floating bubble"
                description="The draggable controller that opens the action menu."
                value={settings.bubbleVisible}
                onValueChange={(next) => update('bubbleVisible', next)}
              />
              <BubbleStylePicker
                style={settings.bubbleStyle}
                emoji={settings.bubbleEmoji}
                onChangeStyle={(next) => update('bubbleStyle', next)}
                onChangeEmoji={(next) => update('bubbleEmoji', next)}
                onEmojiFocus={scrollToBottomSoon}
              />
            </SettingsSection>

            <SettingsSection title="Storage">
              <SettingsTextRow
                label="Save folder"
                description="Screenshots and recordings save to this album in your gallery."
                value={settings.albumName}
                placeholder="FlashRecord"
                helperText="Letters, numbers, spaces, - and _ only. Max 30 characters."
                maxLength={30}
                onFocus={scrollToBottomSoon}
                onCommit={(next) => {
                  const cleaned = sanitizeAlbumName(next);
                  if (cleaned) update('albumName', cleaned);
                }}
              />
            </SettingsSection>

            <SettingsSection title="About">
              <SettingsInfoRow label="App version" value={APP_VERSION} />
              <SettingsActionRow
                label="Reset all settings"
                description="Restore defaults for everything on this page."
                onPress={confirmReset}
                destructive
              />
            </SettingsSection>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    width: '100%',
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 40,
  },
  headerSpacer: {
    minHeight: 40,
    minWidth: 40,
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: Spacing.six,
    paddingTop: Spacing.four,
  },
  inner: {
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    width: '100%',
  },
});
