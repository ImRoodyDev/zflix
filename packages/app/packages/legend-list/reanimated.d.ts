import { LegendListPropsBase, LegendListRef } from '@legendapp/list';
import React__default, { ComponentProps } from 'react';
import react_native_reanimated__default from 'react-native-reanimated';

type KeysToOmit = "getEstimatedItemSize" | "keyExtractor" | "animatedProps" | "renderItem" | "onItemSizeChanged" | "ItemSeparatorComponent";
type PropsBase<ItemT> = LegendListPropsBase<ItemT, ComponentProps<typeof react_native_reanimated__default.ScrollView>>;
interface AnimatedLegendListPropsBase<ItemT> extends Omit<PropsBase<ItemT>, KeysToOmit> {
    refScrollView?: React__default.Ref<react_native_reanimated__default.ScrollView>;
}
type OtherAnimatedLegendListProps<ItemT> = Pick<PropsBase<ItemT>, KeysToOmit>;
type AnimatedLegendListProps<ItemT> = Omit<AnimatedLegendListPropsBase<ItemT>, "refLegendList"> & OtherAnimatedLegendListProps<ItemT>;
type AnimatedLegendListDefinition = <ItemT>(props: Omit<AnimatedLegendListPropsBase<ItemT>, "refLegendList"> & OtherAnimatedLegendListProps<ItemT> & {
    ref?: React__default.Ref<LegendListRef>;
}) => React__default.ReactElement | null;
declare const AnimatedLegendList: AnimatedLegendListDefinition;

export { AnimatedLegendList, type AnimatedLegendListProps, type AnimatedLegendListPropsBase };
