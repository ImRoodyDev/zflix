import * as React$1 from 'react';
import * as _legendapp_list from '@legendapp/list';
import * as react_native from 'react-native';
import { Animated } from 'react-native';

declare const AnimatedLegendList: Animated.AnimatedComponent<(<T>(props: Omit<Omit<react_native.ScrollViewProps, "scrollEventThrottle">, "maintainVisibleContentPosition" | "removeClippedSubviews" | "stickyHeaderIndices" | "contentInset" | "contentOffset"> & {
    alignItemsAtEnd?: boolean;
    columnWrapperStyle?: _legendapp_list.ColumnWrapperStyle;
    data: readonly T[];
    drawDistance?: number;
    estimatedItemSize?: number;
    extraData?: any;
    getEstimatedItemSize?: ((index: number, item: T) => number) | undefined;
    initialContainerPoolRatio?: number | undefined;
    initialScrollOffset?: number;
    initialScrollIndex?: number;
    ItemSeparatorComponent?: React$1.ComponentType<{
        leadingItem: T;
    }> | undefined;
    keyExtractor?: ((item: T, index: number) => string) | undefined;
    ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null | undefined;
    ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null | undefined;
    ListFooterComponentStyle?: react_native.StyleProp<react_native.ViewStyle> | undefined;
    ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null | undefined;
    ListHeaderComponentStyle?: react_native.StyleProp<react_native.ViewStyle> | undefined;
    maintainScrollAtEnd?: boolean;
    maintainScrollAtEndThreshold?: number;
    maintainVisibleContentPosition?: boolean;
    numColumns?: number;
    onEndReached?: ((info: {
        distanceFromEnd: number;
    }) => void) | null | undefined;
    onEndReachedThreshold?: number | null | undefined;
    onItemSizeChanged?: ((info: {
        size: number;
        previous: number;
        index: number;
        itemKey: string;
        itemData: T;
    }) => void) | undefined;
    onRefresh?: () => void;
    onStartReached?: ((info: {
        distanceFromStart: number;
    }) => void) | null | undefined;
    onStartReachedThreshold?: number | null | undefined;
    onViewableItemsChanged?: _legendapp_list.OnViewableItemsChanged | undefined;
    progressViewOffset?: number;
    recycleItems?: boolean;
    refScrollView?: React.Ref<react_native.ScrollView>;
    refreshing?: boolean;
    renderItem?: ((props: _legendapp_list.LegendListRenderItemProps<T>) => React$1.ReactNode) | undefined;
    renderScrollComponent?: (props: react_native.ScrollViewProps) => React.ReactElement<react_native.ScrollViewProps>;
    suggestEstimatedItemSize?: boolean;
    viewabilityConfig?: _legendapp_list.ViewabilityConfig;
    viewabilityConfigCallbackPairs?: _legendapp_list.ViewabilityConfigCallbackPairs | undefined;
    waitForInitialLayout?: boolean;
    onLoad?: (info: {
        elapsedTimeInMs: number;
    }) => void;
} & React$1.RefAttributes<_legendapp_list.LegendListRef>) => React.ReactNode)>;

export { AnimatedLegendList };
