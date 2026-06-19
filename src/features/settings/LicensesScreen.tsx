import { View, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { Screen } from '@/shared/ui/Screen';
import { AppText } from '@/shared/ui/AppText';
import { useTheme, spacing, radius } from '@/shared/theme';
import type { RootStackParamList } from '@/app/navigation/types';

import licensesData from '@/assets/data/licenses.json';

export function LicensesScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <ArrowLeft color={colors.text} size={28} onPress={() => navigation.goBack()} />
        <AppText variant="title">Open Source Licenses</AppText>
      </View>
      <FlashList
        data={licensesData}
        keyExtractor={(item) => item.id}
        // @ts-ignore
        estimatedItemSize={70}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.licenseRow, pressed && styles.licenseRowPressed]}
            onPress={() => navigation.navigate('LicenseDetail', {
              licenseId: item.id,
              licenseName: item.name,
              licenseText: item.licenseText
            })}
          >
            <View style={styles.licenseInfo}>
              <AppText style={styles.licenseName} numberOfLines={1}>{item.name}</AppText>
              <AppText muted variant="caption">v{item.version}</AppText>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.blue + '15' }]}>
              <AppText variant="caption" style={{ color: colors.blue, fontWeight: '600' }}>
                {item.licenseType.length > 12 ? item.licenseType.substring(0, 12) + '...' : item.licenseType}
              </AppText>
            </View>
            <ChevronRight color={colors.textMuted} size={20} style={{ marginLeft: 8 }} />
          </Pressable>
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  licenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  licenseRowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  licenseInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  licenseName: {
    fontWeight: '500',
    marginBottom: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
});
