import { useRef } from 'react';
import { type View } from 'react-native';

export type ScreenshotResult = {
  uri: string;
  /** True if the file landed in the device's photo library, false if only in the app cache. */
  savedToLibrary: boolean;
};

export class ScreenshotPermissionError extends Error {
  constructor() {
    super('Photo library permission denied');
    this.name = 'ScreenshotPermissionError';
  }
}

export class ScreenshotUnavailableError extends Error {
  constructor(public missing: string) {
    super(`${missing} is not available in this build`);
    this.name = 'ScreenshotUnavailableError';
  }
}

// Lazy-require so a missing native module surfaces as a friendly error from
// capture() instead of crashing the entire layout at import time. This keeps
// the app bootable in Expo Go (where neither library is bundled) and only
// errors when the user actually tries to take a screenshot.
// Metro requires require() to use a string literal, so each module gets its
// own try/catch wrapper rather than a generic helper.
type CaptureRefFn = (ref: unknown, options: { format: string; quality: number }) => Promise<string>;
type MediaLibraryShape = {
  requestPermissionsAsync: () => Promise<{ status: string }>;
  saveToLibraryAsync: (uri: string) => Promise<unknown>;
};

function loadViewShot(): { captureRef: CaptureRefFn } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-view-shot') as { captureRef: CaptureRefFn };
  } catch {
    return null;
  }
}

function loadMediaLibrary(): MediaLibraryShape | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-media-library') as MediaLibraryShape;
  } catch {
    return null;
  }
}

export function useScreenshot() {
  const targetRef = useRef<View>(null);

  const capture = async (): Promise<ScreenshotResult> => {
    const viewShot = loadViewShot();
    if (!viewShot?.captureRef) {
      throw new ScreenshotUnavailableError('react-native-view-shot');
    }

    const target = targetRef.current;
    if (!target) {
      throw new Error('Screenshot target not mounted yet');
    }

    const uri = await viewShot.captureRef(target, { format: 'png', quality: 1 });

    const mediaLibrary = loadMediaLibrary();
    if (!mediaLibrary) {
      // Capture succeeded but we can't persist it to the gallery without
      // the native module. Return the cached URI so the caller can decide.
      return { uri, savedToLibrary: false };
    }

    const perm = await mediaLibrary.requestPermissionsAsync();
    if (perm.status !== 'granted') {
      throw new ScreenshotPermissionError();
    }

    await mediaLibrary.saveToLibraryAsync(uri);
    return { uri, savedToLibrary: true };
  };

  return { targetRef, capture };
}
