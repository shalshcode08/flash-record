import { Plus, Sparkles, X } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

export type BubbleVisualStyle = 'dot' | 'record' | 'plus' | 'sparkles' | 'emoji';

const BUBBLE_SIZE = 48;
const ACTION_SIZE = 40;
const ACTION_GAP = 10;
const ICON_SIZE = 18;
// When snapped, the bubble tucks slightly past the screen edge (AssistiveTouch-style).
const EDGE_OVERLAP = 12;
// Vertical edge gets a small inset so the bubble never collides with the safe area.
const VERTICAL_INSET = 8;
const SNAP_TENSION = 80;
const SNAP_FRICTION = 9;
const TAP_SLOP = 4;
const FLICK_PROJECTION_MS = 60;
const OPEN_SPRING = { tension: 90, friction: 9, useNativeDriver: false } as const;

export type FloatingBubbleAction = {
  key: string;
  label: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  onPress: () => void;
};

type FloatingBubbleProps = {
  actions?: FloatingBubbleAction[];
  onPress?: () => void;
  initialSide?: 'left' | 'right';
  bubbleStyle?: BubbleVisualStyle;
  bubbleEmoji?: string;
};

type GestureState = {
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  screenWidth: number;
  lastX: number;
  lastY: number;
  moved: boolean;
  onTap: () => void;
  onDragStart: () => void;
  onSnap: (side: 'left' | 'right') => void;
};

export function FloatingBubble({
  actions = [],
  onPress,
  initialSide = 'right',
  bubbleStyle = 'dot',
  bubbleEmoji = '🎬',
}: FloatingBubbleProps) {
  const theme = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const minX = -EDGE_OVERLAP;
  const maxX = screenWidth - BUBBLE_SIZE + EDGE_OVERLAP;
  const minY = insets.top + VERTICAL_INSET;
  const maxY = screenHeight - insets.bottom - BUBBLE_SIZE - VERTICAL_INSET;

  const initialX = initialSide === 'right' ? maxX : minX;
  const initialY = Math.max(minY, screenHeight * 0.5 - BUBBLE_SIZE / 2);

  // Stable Animated values (lazy state init avoids the react-hooks/refs rule).
  const [position] = useState(() => new Animated.ValueXY({ x: initialX, y: initialY }));
  const [scale] = useState(() => new Animated.Value(1));
  const [openProgress] = useState(() => new Animated.Value(0));

  const [isOpen, setIsOpen] = useState(false);
  const [snappedSide, setSnappedSide] = useState<'left' | 'right'>(initialSide);

  const hasActions = actions.length > 0;

  // Drive the open animation whenever isOpen flips.
  useEffect(() => {
    Animated.spring(openProgress, { ...OPEN_SPRING, toValue: isOpen ? 1 : 0 }).start();
  }, [isOpen, openProgress]);

  // Mutable state read inside gesture handlers. Kept in a single ref so the
  // PanResponder can be created once and still see the latest bounds/callbacks.
  const stateRef = useRef<GestureState>({
    bounds: { minX, maxX, minY, maxY },
    screenWidth,
    lastX: initialX,
    lastY: initialY,
    moved: false,
    onTap: () => {},
    onDragStart: () => {},
    onSnap: () => {},
  });

  useEffect(() => {
    stateRef.current.bounds = { minX, maxX, minY, maxY };
    stateRef.current.screenWidth = screenWidth;
    stateRef.current.onTap = () => {
      if (hasActions) {
        setIsOpen((open) => !open);
      } else {
        onPress?.();
      }
    };
    stateRef.current.onDragStart = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };
    stateRef.current.onSnap = (side) => setSnappedSide(side);
  }, [minX, maxX, minY, maxY, screenWidth, onPress, hasActions, isOpen]);

  useEffect(() => {
    const id = position.addListener((value) => {
      stateRef.current.lastX = value.x;
      stateRef.current.lastY = value.y;
    });
    return () => position.removeListener(id);
  }, [position]);

  // Keep the bubble inside bounds if the window resizes (rotation, split-view).
  useEffect(() => {
    const { lastX, lastY } = stateRef.current;
    const clampedX = Math.min(Math.max(lastX, minX), maxX);
    const clampedY = Math.min(Math.max(lastY, minY), maxY);
    if (clampedX !== lastX || clampedY !== lastY) {
      Animated.spring(position, {
        toValue: { x: clampedX, y: clampedY },
        tension: SNAP_TENSION,
        friction: SNAP_FRICTION,
        useNativeDriver: false,
      }).start();
    }
  }, [minX, maxX, minY, maxY, position]);

  // PanResponder handlers only fire on touch events, never during render, so
  // the react-hooks/refs rule is a false positive on this stable factory call.
  /* eslint-disable react-hooks/refs */
  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > TAP_SLOP || Math.abs(gesture.dy) > TAP_SLOP,
      onPanResponderGrant: () => {
        stateRef.current.moved = false;
        position.setOffset({ x: stateRef.current.lastX, y: stateRef.current.lastY });
        position.setValue({ x: 0, y: 0 });
        Animated.spring(scale, {
          toValue: 1.08,
          tension: 200,
          friction: 8,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > TAP_SLOP || Math.abs(gesture.dy) > TAP_SLOP) {
          if (!stateRef.current.moved) {
            stateRef.current.onDragStart();
          }
          stateRef.current.moved = true;
        }
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        position.flattenOffset();
        Animated.spring(scale, {
          toValue: 1,
          tension: 200,
          friction: 8,
          useNativeDriver: false,
        }).start();

        if (!stateRef.current.moved) {
          stateRef.current.onTap();
          return;
        }

        const { bounds, screenWidth: w } = stateRef.current;
        const projectedX = stateRef.current.lastX + gesture.vx * FLICK_PROJECTION_MS;
        const projectedY = stateRef.current.lastY + gesture.vy * FLICK_PROJECTION_MS;

        const center = projectedX + BUBBLE_SIZE / 2;
        const side: 'left' | 'right' = center < w / 2 ? 'left' : 'right';
        const snapX = side === 'left' ? bounds.minX : bounds.maxX;
        const snapY = Math.min(Math.max(projectedY, bounds.minY), bounds.maxY);

        stateRef.current.onSnap(side);
        Animated.spring(position, {
          toValue: { x: snapX, y: snapY },
          tension: SNAP_TENSION,
          friction: SNAP_FRICTION,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderTerminate: () => {
        position.flattenOffset();
        Animated.spring(scale, {
          toValue: 1,
          tension: 200,
          friction: 8,
          useNativeDriver: false,
        }).start();
      },
    }),
  );
  /* eslint-enable react-hooks/refs */

  const bubbleTransform: Animated.WithAnimatedObject<ViewStyle> = {
    transform: [...position.getTranslateTransform(), { scale }],
  };

  // Collapsed position: item centered behind the bubble so it's fully
  // occluded when the menu is closed (no shadow/ghost peeks out).
  const collapsedX = (BUBBLE_SIZE - ACTION_SIZE) / 2;
  // Vertical center: actions sit at the bubble's vertical midline.
  const verticalCenterOffset = (BUBBLE_SIZE - ACTION_SIZE) / 2;
  // Per-item pitch for the expanded layout.
  const itemPitch = ACTION_SIZE + ACTION_GAP;

  const handleAction = (action: FloatingBubbleAction) => {
    setIsOpen(false);
    action.onPress();
  };

  return (
    <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.layer]}>
      {isOpen && (
        <Pressable
          accessibilityLabel="Close menu"
          onPress={() => setIsOpen(false)}
          style={StyleSheet.absoluteFill}
        />
      )}

      {actions.map((action, index) => {
        // Expanded position: items fan out toward screen center, fully
        // symmetric on both sides. Distance is measured from the bubble's
        // inner edge to the item's inner edge.
        const expandedDistance = ACTION_GAP + index * itemPitch;
        const expandedX =
          snappedSide === 'right'
            ? -ACTION_SIZE - expandedDistance
            : BUBBLE_SIZE + expandedDistance;
        // Stagger so later items appear slightly after earlier ones.
        const inputStart = Math.min(0.05 * index, 0.3);
        const inputEnd = Math.min(0.4 + 0.1 * index, 1);

        const itemTranslateX = Animated.add(
          position.x,
          openProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [collapsedX, expandedX],
          }),
        );
        const itemTranslateY = Animated.add(position.y, new Animated.Value(verticalCenterOffset));
        const itemOpacity = openProgress.interpolate({
          inputRange: [0, inputStart, inputEnd, 1],
          outputRange: [0, 0, 1, 1],
          extrapolate: 'clamp',
        });
        const itemScale = openProgress.interpolate({
          inputRange: [0, inputEnd],
          outputRange: [0.6, 1],
          extrapolate: 'clamp',
        });

        const IconComp = action.icon;

        return (
          <Animated.View
            key={action.key}
            pointerEvents={isOpen ? 'auto' : 'none'}
            style={[
              styles.actionWrap,
              {
                opacity: itemOpacity,
                transform: [
                  { translateX: itemTranslateX },
                  { translateY: itemTranslateY },
                  { scale: itemScale },
                ],
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={() => handleAction(action)}
              style={({ pressed }) => [
                styles.action,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.backgroundSelected,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <IconComp size={ICON_SIZE} color={theme.text} />
            </Pressable>
          </Animated.View>
        );
      })}

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.bubble,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.backgroundSelected,
          },
          bubbleTransform,
        ]}
      >
        <BubbleIcon
          color={theme.text}
          openProgress={openProgress}
          bubbleStyle={bubbleStyle}
          bubbleEmoji={bubbleEmoji}
        />
      </Animated.View>
    </Animated.View>
  );
}

function BubbleIcon({
  color,
  openProgress,
  bubbleStyle,
  bubbleEmoji,
}: {
  color: string;
  openProgress: Animated.Value;
  bubbleStyle: BubbleVisualStyle;
  bubbleEmoji: string;
}) {
  const closedOpacity = openProgress.interpolate({
    inputRange: [0, 0.6],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const xOpacity = openProgress.interpolate({
    inputRange: [0.4, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const rotate = openProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <Animated.View style={[styles.iconStack, { transform: [{ rotate }] }]}>
      <Animated.View style={[styles.iconLayer, { opacity: closedOpacity }]}>
        <ClosedIcon style={bubbleStyle} emoji={bubbleEmoji} color={color} />
      </Animated.View>
      <Animated.View style={[styles.iconLayer, { opacity: xOpacity }]}>
        <X size={ICON_SIZE} color={color} />
      </Animated.View>
    </Animated.View>
  );
}

export function ClosedIcon({
  style,
  emoji,
  color,
  size = ICON_SIZE,
}: {
  style: BubbleVisualStyle;
  emoji: string;
  color: string;
  size?: number;
}) {
  switch (style) {
    case 'record':
      return <View style={[styles.recordDot, { width: size - 4, height: size - 4 }]} />;
    case 'plus':
      return <Plus size={size} color={color} strokeWidth={2.4} />;
    case 'sparkles':
      return <Sparkles size={size} color={color} strokeWidth={2} />;
    case 'emoji':
      return (
        <Text style={[styles.emoji, { fontSize: size + 2, lineHeight: size + 6 }]}>{emoji}</Text>
      );
    case 'dot':
    default:
      return <View style={[styles.dot, { backgroundColor: color }]} />;
  }
}

const styles = StyleSheet.create({
  layer: {
    zIndex: 1000,
    elevation: 1000,
  },
  bubble: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  iconStack: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    opacity: 0.85,
  },
  recordDot: {
    backgroundColor: '#E5484D',
    borderRadius: 999,
  },
  emoji: {
    textAlign: 'center',
  },
  actionWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ACTION_SIZE,
    height: ACTION_SIZE,
  },
  action: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    borderRadius: ACTION_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    // No shadow/elevation here: Android's elevation casts a shadow that
    // ignores the opacity animation, leaving a ghost dot visible after the
    // menu closes. The bubble itself still has a shadow for depth.
  },
});
