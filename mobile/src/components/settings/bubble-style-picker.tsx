import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ClosedIcon } from '@/components/floating-bubble';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { type BubbleStyle } from '@/contexts/settings-context';
import { useTheme } from '@/hooks/use-theme';

// Take only the first grapheme (visual character). Handles multi-codepoint
// emojis like flags or ZWJ sequences. Falls back to the first code point if
// Intl.Segmenter is unavailable.
function firstGrapheme(input: string): string {
  if (input.length === 0) return '';
  const SegmenterCtor = (globalThis as { Intl?: { Segmenter?: typeof Intl.Segmenter } }).Intl
    ?.Segmenter;
  if (SegmenterCtor) {
    const seg = new SegmenterCtor('en', { granularity: 'grapheme' });
    const first = seg.segment(input)[Symbol.iterator]().next().value as
      | { segment: string }
      | undefined;
    return first?.segment ?? '';
  }
  return Array.from(input)[0] ?? '';
}

const SWATCH_SIZE = 52;
const SWATCH_ICON_SIZE = 22;

const STYLE_ORDER: { value: BubbleStyle; label: string }[] = [
  { value: 'dot', label: 'Dot' },
  { value: 'record', label: 'Record' },
  { value: 'plus', label: 'Plus' },
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'emoji', label: 'Emoji' },
];

type BubbleStylePickerProps = {
  style: BubbleStyle;
  emoji: string;
  onChangeStyle: (next: BubbleStyle) => void;
  onChangeEmoji: (next: string) => void;
  onEmojiFocus?: () => void;
};

export function BubbleStylePicker({
  style,
  emoji,
  onChangeStyle,
  onChangeEmoji,
  onEmojiFocus,
}: BubbleStylePickerProps) {
  const theme = useTheme();

  // Local draft lets the input go transiently empty while the user backspaces
  // before typing a new emoji. The persisted setting only updates when the
  // draft is non-empty; on blur, an empty draft reverts to the saved emoji.
  // Re-sync when the emoji prop changes (using React's "snapshot prev prop"
  // pattern so we don't fall foul of the no-setState-in-effect rule).
  const [draft, setDraft] = useState(emoji);
  const [lastEmoji, setLastEmoji] = useState(emoji);
  if (emoji !== lastEmoji) {
    setLastEmoji(emoji);
    setDraft(emoji);
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
      ]}
    >
      <View style={styles.textBlock}>
        <ThemedText type="default">Bubble style</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Pick the look of the floating bubble.
        </ThemedText>
      </View>

      <View style={styles.swatchRow}>
        {STYLE_ORDER.map((option) => {
          const selected = option.value === style;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityLabel={`${option.label} bubble style`}
              accessibilityState={{ selected }}
              onPress={() => onChangeStyle(option.value)}
              style={({ pressed }) => [
                styles.swatchWrap,
                {
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: selected ? theme.text : theme.backgroundSelected,
                    borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <ClosedIcon
                  style={option.value}
                  emoji={emoji}
                  color={theme.text}
                  size={SWATCH_ICON_SIZE}
                />
              </View>
              <ThemedText
                type={selected ? 'smallBold' : 'small'}
                themeColor={selected ? 'text' : 'textSecondary'}
                style={styles.swatchLabel}
                numberOfLines={1}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {style === 'emoji' && (
        <View style={[styles.emojiRow, { borderTopColor: theme.backgroundSelected }]}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emojiHint}>
            Tap to type or paste an emoji from your keyboard.
          </ThemedText>
          <TextInput
            value={draft}
            onChangeText={(next) => {
              // Allow an empty draft so the user can clear the field, but
              // otherwise reduce to a single grapheme (one letter or one
              // emoji, never more).
              const single = next.length === 0 ? '' : firstGrapheme(next);
              setDraft(single);
              if (single.length > 0) onChangeEmoji(single);
            }}
            onFocus={onEmojiFocus}
            onBlur={() => {
              if (draft.length === 0) setDraft(emoji);
            }}
            selectTextOnFocus
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="🎬"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.emojiInput,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.backgroundSelected,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  textBlock: {
    gap: Spacing.half,
  },
  swatchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  swatchWrap: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.one,
  },
  swatch: {
    alignItems: 'center',
    borderRadius: SWATCH_SIZE / 2,
    height: SWATCH_SIZE,
    justifyContent: 'center',
    width: SWATCH_SIZE,
  },
  swatchLabel: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  emojiRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  emojiHint: {
    // Sits above the input.
  },
  emojiInput: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 22,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    textAlign: 'center',
  },
});
