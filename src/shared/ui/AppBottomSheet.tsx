import React, { useCallback, useRef } from 'react';
import { Modal, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing, radius } from '@/shared/theme';

interface AppBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  headerComponent?: React.ReactNode;
  scrollable?: boolean;
  maxDynamicContentSize?: number;
}

export function AppBottomSheet({ visible, onClose, children, headerComponent, scrollable = false, maxDynamicContentSize }: AppBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      // Delay onClose slightly to prevent UI glitch when unmounting 
      // the Modal while a PanGesture is still finalizing.
      setTimeout(() => {
        onClose();
      }, 50);
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.55}
        pressBehavior="close"
      />
    ),
    []
  );

  const Wrapper = scrollable ? BottomSheetScrollView : BottomSheetView;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          enableDynamicSizing={true}
          maxDynamicContentSize={maxDynamicContentSize}
          enablePanDownToClose={true}
          detached={true}
          bottomInset={insets.bottom + spacing.md}
          style={styles.sheetContainer}
          onChange={handleSheetChange}
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.background}
          handleIndicatorStyle={styles.handleIndicator}
        >
          {headerComponent}
          <Wrapper bounces={false} style={styles.contentContainer}>
            {children}
          </Wrapper>
        </BottomSheet>
      </GestureHandlerRootView>
    </Modal>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  background: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  sheetContainer: {
    marginHorizontal: spacing.md,
  },
  handleIndicator: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
    width: 40,
    height: 4,
  },
  contentContainer: {
    paddingBottom: spacing.xl,
  },
});
