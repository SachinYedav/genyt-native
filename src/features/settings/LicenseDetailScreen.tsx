import { ScrollView, StyleSheet, View, Pressable, Linking } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { ArrowLeft, FileCode2, Box, ExternalLink, Link2, User } from 'lucide-react-native';
import { Screen } from '@/shared/ui/Screen';
import { AppText } from '@/shared/ui/AppText';
import { useTheme, spacing, typography, radius } from '@/shared/theme';
import type { RootStackParamList } from '@/app/navigation/types';

import licensesData from '@/assets/data/licenses.json';

type LicenseDetailRouteProp = RouteProp<RootStackParamList, 'LicenseDetail'>;

const DetailRow = ({ icon: Icon, label, value, isLink = false, colors, styles }: any) => {
  const handleOpenLink = async (url: string) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (e) {
      console.log('Failed to open URL:', e);
    }
  };

  return (
    <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
      <View style={styles.detailLeft}>
        <View style={[styles.iconBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon size={18} color={colors.textMuted} />
        </View>
        <AppText style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</AppText>
      </View>
      <View style={styles.detailRight}>
        {isLink && value ? (
          <Pressable onPress={() => handleOpenLink(value)}>
            <AppText style={[styles.detailValue, { color: colors.blue, textDecorationLine: 'underline' }]} numberOfLines={1}>
              View Source
            </AppText>
          </Pressable>
        ) : (
          <AppText style={styles.detailValue} numberOfLines={2}>
            {value || 'N/A'}
          </AppText>
        )}
      </View>
    </View>
  );
};

export function LicenseDetailScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();
  const route = useRoute<LicenseDetailRouteProp>();
  const { licenseId, licenseName, licenseText } = route.params;

  // Retrieve full package data to get version, type, publisher, and repository
  const packageData = licensesData.find((item) => item.id === licenseId) || {
    id: licenseId,
    name: licenseName,
    version: 'Unknown',
    licenseType: 'Custom',
    publisher: 'Unknown',
    repository: '',
    licenseText: licenseText,
  };

  const handleOpenRepo = async () => {
    const url = (packageData as any).repository || `https://www.npmjs.com/package/${packageData.name}`;
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      }
    } catch (e) {
      console.log('Failed to open URL:', e);
    }
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <ArrowLeft color={colors.text} size={28} onPress={() => navigation.goBack()} />
        <AppText variant="title" style={{ flex: 1 }}>Details</AppText>
        <Pressable style={styles.headerBtn} onPress={handleOpenRepo}>
          <ExternalLink size={24} color={colors.blue} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <AppText style={styles.titleName}>
            {packageData.name}
          </AppText>
          <View style={[styles.badge, { backgroundColor: colors.blue + '15' }]}>
            <AppText variant="caption" style={{ color: colors.blue, fontWeight: '600' }}>
              Version {packageData.version}
            </AppText>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <DetailRow icon={FileCode2} label="License Type" value={packageData.licenseType} colors={colors} styles={styles} />
          {(packageData as any).publisher && <DetailRow icon={User} label="Publisher" value={(packageData as any).publisher} colors={colors} styles={styles} />}
          {(packageData as any).repository && <DetailRow icon={Link2} label="Repository" value={(packageData as any).repository} isLink={true} colors={colors} styles={styles} />}
        </View>

        <View style={[styles.infoBanner, { backgroundColor: colors.blue + '10' }]}>
          <Box size={20} color={colors.blue} style={{ marginTop: 2 }} />
          <AppText style={[styles.bannerText, { color: colors.text }]}>
            This software is distributed under the <AppText style={{ fontWeight: '700' }}>{packageData.licenseType}</AppText> license terms. We acknowledge and thank the open-source community for their contributions.
          </AppText>
        </View>

        <View style={styles.legalSection}>
          <AppText style={styles.legalTitle}>
            Legal Notice
          </AppText>
          <View style={[styles.legalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText style={[styles.legalText, { fontWeight: '700', marginBottom: spacing.md, color: colors.text }]}>
              Copyright {(packageData as any).publisher !== 'Community' && (packageData as any).publisher ? (packageData as any).publisher : packageData.name + ' contributors'}
            </AppText>
            <AppText style={styles.legalText}>
              The source code and binaries of this package are provided under the {packageData.licenseType} license.
              {"\n\n"}
              {packageData.licenseText || "License text not found."}
            </AppText>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  headerBtn: {
    padding: spacing.sm,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  titleSection: {
    marginBottom: spacing.xl,
  },
  titleName: {
    fontSize: typography.header,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  infoCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailRight: {
    flex: 1,
    alignItems: 'flex-end',
    paddingLeft: spacing.lg,
  },
  iconBox: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabel: {
    marginLeft: spacing.sm,
  },
  detailValue: {
    fontWeight: '500',
  },
  infoBanner: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  bannerText: {
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 22,
  },
  legalSection: {
    marginTop: spacing.xl,
  },
  legalTitle: {
    fontSize: typography.subtitle,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  legalBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  legalText: {
    fontFamily: 'monospace',
    fontSize: typography.caption,
    lineHeight: 20,
    color: colors.textMuted,
  },
});
