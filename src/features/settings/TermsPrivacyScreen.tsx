import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { Screen } from '@/shared/ui/Screen';
import { AppText } from '@/shared/ui/AppText';
import { useTheme, spacing, typography, radius } from '@/shared/theme';
import { termsData, privacyData, type LegalDocument } from '@/assets/data/legal';

export function TermsPrivacyScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  const activeDocument: LegalDocument = activeTab === 'terms' ? termsData : privacyData;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={colors.text} size={28} />
          </Pressable>
          <AppText variant="subtitle">Legal Documents</AppText>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.filterGroup}>
            <Pressable
              style={[styles.filterChip, activeTab === 'terms' && styles.filterChipActive]}
              onPress={() => setActiveTab('terms')}
            >
              <AppText style={activeTab === 'terms' ? styles.filterTextActive : styles.filterText}>Terms</AppText>
            </Pressable>
            <Pressable
              style={[styles.filterChip, activeTab === 'privacy' && styles.filterChipActive]}
              onPress={() => setActiveTab('privacy')}
            >
              <AppText style={activeTab === 'privacy' ? styles.filterTextActive : styles.filterText}>Privacy</AppText>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.documentHeader}>
          <AppText variant="subtitle" style={styles.documentTitle}>{activeDocument.title}</AppText>
          <AppText muted style={styles.lastUpdated}>Last Updated: {activeDocument.lastUpdated}</AppText>
        </View>

        {activeDocument.sections.map((section, index) => (
          <View key={index} style={styles.sectionContainer}>
            <AppText style={styles.sectionTitle}>{section.title}</AppText>
            {section.paragraphs.map((paragraph, pIndex) => (
              <AppText key={pIndex} style={styles.paragraph} muted>
                {paragraph}
              </AppText>
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: isDark ? colors.surfaceMuted : colors.border,
  },
  filterChipActive: {
    backgroundColor: isDark ? colors.text : colors.text,
  },
  filterText: {
    fontSize: typography.body,
    fontWeight: '500',
    color: colors.text,
  },
  filterTextActive: {
    fontSize: typography.body,
    fontWeight: '500',
    color: isDark ? colors.background : colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xl4,
  },
  documentHeader: {
    marginBottom: spacing.xxl,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  documentTitle: {
    fontSize: typography.header,
    fontWeight: '700',
    marginBottom: spacing.xs,
    color: colors.text,
  },
  lastUpdated: {
    fontSize: typography.captionLg,
  },
  sectionContainer: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.bodyLg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: typography.body,
    lineHeight: 24,
    marginBottom: spacing.md,
    color: colors.textMuted,
  },
});
