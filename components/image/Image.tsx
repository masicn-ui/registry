// File: components/image/Image.tsx

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Image as RNImage,
  Modal,
  Pressable,
  View,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  type ImageProps as RNImageProps,
  type ImageSourcePropType,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme, spacing, radius, sizes, motion, opacity } from '@masicn/ui';
import { Text } from '@/components/ui/Text';

// ─── Types ─────────────────────────────────────────────────────────────────

type ImageAspectRatio = 'square' | '4:3' | '16:9' | '3:4' | '9:16' | '21:9';
type ImageFit = 'cover' | 'contain' | 'stretch' | 'center';
type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'full';

interface ImageProps extends Omit<RNImageProps, 'source' | 'borderRadius'> {
  /** Image source (URI or local require) */
  source: ImageSourcePropType;
  /** Aspect ratio preset */
  aspectRatio?: ImageAspectRatio;
  /** How image fits in container */
  fit?: ImageFit;
  /** Border radius preset from theme */
  borderRadius?: keyof typeof radius;
  /** Size preset */
  size?: ImageSize;
  /** Show loading indicator while loading */
  showLoader?: boolean;
  /** Fallback component on error */
  fallback?: React.ReactNode;
  /** Custom error message */
  errorMessage?: string;
  /** Container style */
  containerStyle?: ViewStyle;
  /** Show overlay gradient */
  overlay?: boolean;
  /** Overlay gradient colors (from, to) */
  overlayColors?: [string, string];
  /**
   * Enable long-press preview mode.
   * Hold the image to expand it to full screen; lift to dismiss.
   */
  enablePreview?: boolean;
}

const LARGE_RETENTION_OFFSET = { top: 9999, left: 9999, bottom: 9999, right: 9999 };

// ─── Aspect ratio map ──────────────────────────────────────────────────────

const aspectRatioMap: Record<ImageAspectRatio, number> = {
  square: 1,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  '3:4': 3 / 4,
  '9:16': 9 / 16,
  '21:9': 21 / 9,
};

// ─── ImagePreview (internal) ───────────────────────────────────────────────

interface ImagePreviewProps {
  source: ImageSourcePropType;
  visible: boolean;
  onDismiss: () => void;
}

interface ImagePreviewHandle {
  dismiss: () => void;
}

const ImagePreview = forwardRef<ImagePreviewHandle, ImagePreviewProps>(
  function ImagePreview({ source, visible, onDismiss }, ref) {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();

    const backdropOpacity = useSharedValue(0);
    const previewScale = useSharedValue(0.88);
    const previewTranslateY = useSharedValue<number>(spacing.lg);
    const hintOpacity = useSharedValue(0);

    const dismissImpl = useRef(() => {});
    dismissImpl.current = () => {
      backdropOpacity.value = withTiming(0, { duration: motion.duration.fast });
      hintOpacity.value = withTiming(0, { duration: motion.duration.fast });
      previewTranslateY.value = withSpring(spacing.lg, motion.spring.gentle);
      previewScale.value = withSpring(0.88, motion.spring.gentle, () => {
        scheduleOnRN(onDismiss);
      });
    };

    useImperativeHandle(ref, () => ({ dismiss: () => { dismissImpl.current(); } }), []);

    useEffect(() => {
      if (visible) {
        previewScale.value = 0.88;
        previewTranslateY.value = spacing.lg;
        backdropOpacity.value = withTiming(opacity.hover, { duration: motion.duration.normal });
        previewScale.value = withSpring(1, motion.spring.responsive);
        previewTranslateY.value = withSpring(0, motion.spring.responsive);
        hintOpacity.value = withDelay(
          motion.duration.slow,
          withTiming(1, { duration: motion.duration.normal }),
        );
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const backdropStyle = useAnimatedStyle(() => ({
      opacity: backdropOpacity.value,
    }));

    const imageStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: previewScale.value },
        { translateY: previewTranslateY.value },
      ],
    }));

    const hintStyle = useAnimatedStyle(() => ({
      opacity: hintOpacity.value,
    }));

    return (
      <Modal
        visible={visible}
        transparent
        statusBarTranslucent
        animationType="none">
        <Animated.View style={[styles.fill, styles.previewBackdrop, backdropStyle]} />

        <View style={styles.previewContainer}>
          <Animated.Image
            source={source}
            resizeMode="contain"
            style={[{ width: screenWidth, height: screenHeight }, imageStyle]}
          />
        </View>

        <Animated.View style={[styles.previewHint, hintStyle]}>
          <View style={styles.previewHintPill}>
            <Text variant="captionSmall" color="textInverse">
              Release to close
            </Text>
          </View>
        </Animated.View>
      </Modal>
    );
  },
);

// ─── Image ─────────────────────────────────────────────────────────────────

export function Image({
  source,
  aspectRatio,
  fit = 'cover',
  borderRadius,
  size,
  showLoader = true,
  fallback,
  errorMessage = 'Failed to load image',
  containerStyle,
  overlay = false,
  overlayColors,
  style,
  enablePreview = false,
  ...rest
}: ImageProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const previewRef = useRef<ImagePreviewHandle>(null);

  const sizeMap: Record<ImageSize, number | string> = {
    thumbnail: sizes.avatarSm,
    small: sizes.avatarMd,
    medium: sizes.avatarLg,
    large: sizes.avatarXl,
    full: '100%',
  };

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const getSizeStyle = (): ViewStyle => {
    if (!size) { return {}; }
    if (size === 'full') { return { width: '100%' }; }
    const sizeValue = sizeMap[size] as number;
    return { width: sizeValue, height: sizeValue };
  };

  if (error) {
    if (fallback) {
      return <View style={containerStyle}>{fallback}</View>;
    }
    return (
      <View
        style={[
          styles.fallback,
          aspectRatio && { aspectRatio: aspectRatioMap[aspectRatio] },
          getSizeStyle(),
          borderRadius && { borderRadius: radius[borderRadius] },
          { backgroundColor: theme.colors.surfaceSecondary },
          containerStyle,
        ]}>
        <Text variant="caption" color="textSecondary">
          {errorMessage}
        </Text>
      </View>
    );
  }

  const defaultOverlayColors: [string, string] = overlayColors || [
    'rgba(0, 0, 0, 0)',
    'rgba(0, 0, 0, 0.5)',
  ];

  const imageContent = (
    <View
      style={[
        styles.container,
        aspectRatio && { aspectRatio: aspectRatioMap[aspectRatio] },
        getSizeStyle(),
        borderRadius && [styles.rounded, { borderRadius: radius[borderRadius] }],
        containerStyle,
      ]}>
      <RNImage
        source={source}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        resizeMode={fit}
        style={[styles.image, style]}
        {...rest}
      />
      {overlay && !loading && !error && (
        <View
          style={[styles.overlay, { backgroundColor: defaultOverlayColors[1] }]}
        />
      )}
      {loading && showLoader && (
        <View style={[styles.loader, { backgroundColor: theme.colors.overlay }]}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}
    </View>
  );

  if (enablePreview) {
    return (
      <>
        <Pressable
          onLongPress={() => setPreviewVisible(true)}
          onPressOut={() => {
            if (previewVisible) {
              previewRef.current?.dismiss();
            }
          }}
          pressRetentionOffset={LARGE_RETENTION_OFFSET}
          delayLongPress={400}
          style={previewVisible ? styles.previewHidden : null}>
          {imageContent}
        </Pressable>

        <ImagePreview
          ref={previewRef}
          source={source}
          visible={previewVisible}
          onDismiss={() => setPreviewVisible(false)}
        />
      </>
    );
  }

  return imageContent;
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    position: 'relative',
    width: '100%',
  },
  rounded: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallback: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  previewBackdrop: {
    backgroundColor: '#000',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewHint: {
    position: 'absolute',
    bottom: spacing.xxxl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  previewHidden: {
    opacity: 0,
  },
  previewHintPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: `rgba(255,255,255,${opacity.overlayLight})`,
  },
});
