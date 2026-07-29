// External imports
import { Link as ExpoLink, type LinkProps } from 'expo-router';
import React from 'react';
import { TouchableOpacity, type TouchableOpacityProps } from 'react-native';

// Navigation props forwarded to the underlying expo-router `Link`.
type NavigationProps = Pick<
	LinkProps,
	'href' | 'push' | 'replace' | 'dismissTo' | 'relativeToDirectory' | 'withAnchor' | 'dangerouslySingular' | 'prefetch'
>;

export type Props = NavigationProps &
	TouchableOpacityProps & {
		/** Forward the navigation `onPress` to the single child instead of wrapping it in a touchable. */
		asChild?: boolean;
	};

/**
 * Drop-in replacement for expo-router's `Link`.
 *
 * expo-router renders its `Link` as a `<Text onPress>`, which never sets `isTVSelectable`,
 * so the select/enter key on a TV remote never reaches `onPress`. Rendering the link through
 * a `TouchableOpacity` instead makes it a proper focusable + clickable target on TV.
 *
 * Children are laid out inside a view, so text styling belongs on a `<Text>` child rather
 * than on this component. Use `asChild` when the child is already a pressable (such as
 * `Button`), otherwise it would nest a second focusable target inside this one. In `asChild`
 * mode the child receives the navigation `onPress`, so every other prop here — `ref` and the
 * touchable props included — belongs on the child instead.
 */
function Link(
	{
		href,
		push,
		replace,
		dismissTo,
		relativeToDirectory,
		withAnchor,
		dangerouslySingular,
		prefetch,
		asChild,
		activeOpacity = 0.75,
		children,
		...touchableProps
	}: Props,
	ref: React.Ref<React.ComponentRef<typeof TouchableOpacity>>
) {
	return (
		<ExpoLink
			asChild
			href={href}
			push={push}
			replace={replace}
			dismissTo={dismissTo}
			relativeToDirectory={relativeToDirectory}
			withAnchor={withAnchor}
			dangerouslySingular={dangerouslySingular}
			prefetch={prefetch}
		>
			{asChild ? (
				children
			) : (
				<TouchableOpacity ref={ref} activeOpacity={activeOpacity} {...touchableProps}>
					{children}
				</TouchableOpacity>
			)}
		</ExpoLink>
	);
}

export default React.forwardRef(Link);
