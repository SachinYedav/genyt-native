import { Image } from 'expo-image';
import { Play, Flame } from 'lucide-react-native';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/app/navigation/types';

import type { VideoSummary } from '@/entities/video/types';
import { useTheme, spacing, radius } from '@/shared/theme';
import { AppText } from './AppText';
import { useMemo } from 'react';
import { VideoCard } from './VideoCard';

type ShortsShelfProps = {
  shorts: VideoSummary[];
  disablePadding?: boolean;
};

export function ShortsShelf({ shorts, disablePadding }: ShortsShelfProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!shorts || shorts.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, disablePadding && { paddingHorizontal: 0 }]}>
        <Flame color={colors.brand} size={24} fill={colors.brand} />
        <AppText variant="subtitle" style={styles.headerTitle}>Shorts</AppText>
      </View>
      <FlatList
        data={shorts}
        keyExtractor={(item, index) => item.id ? `${item.id}-${index}` : index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, disablePadding && { paddingHorizontal: 0 }]}
        snapToInterval={150 + spacing.md} // Card width + gap
        decelerationRate="fast"
        renderItem={({ item, index }) => {
          return (
            <View style={{ width: 150 }}>
              <VideoCard
                video={item}
                layout="short"
                onPress={() => {
                  navigation.navigate('Shorts', { initialIndex: index, initialShorts: shorts });
                }}
              />
            </View>
          );
        }}
      />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    marginLeft: spacing.xs,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
