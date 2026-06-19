import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Text, Linking } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { useTheme, spacing, typography } from '@/shared/theme';

interface CollapsibleDescriptionProps {
  description: string;
  viewCountLabel: string;
  publishedLabel: string;
}

export function CollapsibleDescription({ description, viewCountLabel, publishedLabel }: CollapsibleDescriptionProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const [hasMeasured, setHasMeasured] = useState(false);

  useEffect(() => {
    setExpanded(false);
    setHasMeasured(false);
    setShowToggle(false);
  }, [description]);

  const renderDescription = (text: string) => {
    if (!text) return null;
    const URL_REGEX = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(URL_REGEX);

    return parts.map((part, index) => {
      if (part.match(URL_REGEX)) {
        return (
          <Text
            key={index}
            style={{ color: colors.blue }}
            onPress={(e) => {
              e.stopPropagation();
              Linking.openURL(part).catch(() => { });
            }}
          >
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  return (
    <Pressable
      style={styles.container}
      onPress={() => {
        if (showToggle) {
          setExpanded(!expanded);
        }
      }}
    >
      <View style={styles.header}>
        <AppText style={styles.statsText}>
          {viewCountLabel}  •  {publishedLabel}
        </AppText>
      </View>

      {!hasMeasured && description ? (
        <AppText
          style={[styles.descriptionText, { position: 'absolute', opacity: 0, zIndex: -1 }]}
          onTextLayout={(e) => {
            setShowToggle(e.nativeEvent.lines.length > 2);
            setHasMeasured(true);
          }}
        >
          {description}
        </AppText>
      ) : null}

      <AppText
        numberOfLines={expanded ? undefined : (showToggle ? 2 : undefined)}
        style={styles.descriptionText}
      >
        {renderDescription(description)}
      </AppText>

      {showToggle && !expanded && (
        <AppText style={styles.moreText}>...more</AppText>
      )}
      {showToggle && expanded && (
        <AppText style={styles.lessText}>Show less</AppText>
      )}
    </Pressable>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  header: {
    marginBottom: spacing.xs,
  },
  statsText: {
    fontSize: typography.captionLg,
    fontWeight: '600',
    color: colors.text,
  },
  descriptionText: {
    fontSize: typography.captionLg,
    color: colors.text,
    lineHeight: 18,
  },
  moreText: {
    fontSize: typography.captionLg,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  lessText: {
    fontSize: typography.captionLg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
});
