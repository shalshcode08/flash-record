import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'flash-record:settings:v1';

export type VideoQuality = '720p' | '1080p' | 'source';
export type FrameRate = 30 | 60;
export type CountdownSeconds = 0 | 3 | 5 | 10;
export type BubbleStyle = 'dot' | 'record' | 'plus' | 'sparkles' | 'emoji';
// 'off' = silent, 'mic' = microphone only (auto-uses any connected mic),
// 'system' = on-screen / playback audio only, 'both' = mic + system mixed.
export type AudioSource = 'off' | 'mic' | 'system' | 'both';

export const BUBBLE_STYLES: readonly BubbleStyle[] = [
  'dot',
  'record',
  'plus',
  'sparkles',
  'emoji',
];

export const AUDIO_SOURCES: readonly AudioSource[] = ['off', 'mic', 'system', 'both'];

export type Settings = {
  videoQuality: VideoQuality;
  frameRate: FrameRate;
  audioSource: AudioSource;
  bubbleVisible: boolean;
  countdownSeconds: CountdownSeconds;
  bubbleStyle: BubbleStyle;
  bubbleEmoji: string;
  showTouches: boolean;
};

export const defaultSettings: Settings = {
  videoQuality: '1080p',
  frameRate: 30,
  audioSource: 'off',
  bubbleVisible: true,
  countdownSeconds: 3,
  bubbleStyle: 'dot',
  bubbleEmoji: '🎬',
  showTouches: false,
};

type SettingsContextValue = {
  settings: Settings;
  hydrated: boolean;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  reset: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function sanitize(raw: unknown): Settings {
  if (!raw || typeof raw !== 'object') return defaultSettings;
  const stored = raw as Partial<Settings> & { micEnabled?: boolean };

  // Migrate the legacy mic toggle into the new audioSource enum.
  let audioSource: AudioSource = defaultSettings.audioSource;
  if (
    typeof stored.audioSource === 'string' &&
    (AUDIO_SOURCES as readonly string[]).includes(stored.audioSource)
  ) {
    audioSource = stored.audioSource as AudioSource;
  } else if (typeof stored.micEnabled === 'boolean') {
    audioSource = stored.micEnabled ? 'mic' : 'off';
  }

  return {
    videoQuality:
      stored.videoQuality === '720p' ||
      stored.videoQuality === '1080p' ||
      stored.videoQuality === 'source'
        ? stored.videoQuality
        : defaultSettings.videoQuality,
    frameRate: stored.frameRate === 60 ? 60 : 30,
    audioSource,
    bubbleVisible:
      typeof stored.bubbleVisible === 'boolean' ? stored.bubbleVisible : defaultSettings.bubbleVisible,
    countdownSeconds:
      stored.countdownSeconds === 0 ||
      stored.countdownSeconds === 3 ||
      stored.countdownSeconds === 5 ||
      stored.countdownSeconds === 10
        ? stored.countdownSeconds
        : defaultSettings.countdownSeconds,
    bubbleStyle:
      typeof stored.bubbleStyle === 'string' &&
      (BUBBLE_STYLES as readonly string[]).includes(stored.bubbleStyle)
        ? (stored.bubbleStyle as BubbleStyle)
        : defaultSettings.bubbleStyle,
    bubbleEmoji:
      typeof stored.bubbleEmoji === 'string' && stored.bubbleEmoji.length > 0
        ? stored.bubbleEmoji
        : defaultSettings.bubbleEmoji,
    showTouches:
      typeof stored.showTouches === 'boolean' ? stored.showTouches : defaultSettings.showTouches,
  };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            setSettings(sanitize(JSON.parse(raw)));
          } catch {
            setSettings(defaultSettings);
          }
        }
        setHydrated(true);
      })
      .catch(() => {
        if (cancelled) return;
        setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: Settings) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
      // Best-effort write; nothing to recover from here.
    });
  }, []);

  const update = useCallback<SettingsContextValue['update']>(
    (key, value) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const reset = useCallback(() => {
    setSettings(defaultSettings);
    persist(defaultSettings);
  }, [persist]);

  const value = useMemo(
    () => ({ settings, hydrated, update, reset }),
    [settings, hydrated, update, reset],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used inside a SettingsProvider');
  }
  return ctx;
}
