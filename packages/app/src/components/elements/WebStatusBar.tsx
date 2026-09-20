// External imports
import { StatusBarStyle } from 'expo-status-bar';
import React, { memo, useEffect } from 'react';
import { ColorValue, Platform } from 'react-native';

type Props = {
	id: string;
	isFocused: boolean;
	statusBarStyle: StatusBarStyle;
	backgroundColor: ColorValue;
};

function WebStatusBar({ id, isFocused, statusBarStyle, backgroundColor }: Props) {
	// Manage global style element for web platform based on page focus
	useEffect(() => {
		if (Platform.OS !== 'web') return;

		const styleId = 'page-global-styles-' + id;
		const metaThemeId = 'page-theme-color-' + id;
		const bg = backgroundColor as string;

		if (isFocused) {
			let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;

			if (!styleElement) {
				styleElement = document.createElement('style');
				styleElement.id = styleId;
				document.head.appendChild(styleElement);
			}

			styleElement.textContent = `
                                        html,
                                        body {
                                            background: ${bg} !important;
                                            background-color: ${bg} !important;
                                        }

                                        body {
                                            min-height: 100vh;
                                            min-height: 100dvh;
                                            overflow-x: hidden;
                                        }

                                        /* Top iOS status/safe area */
                                        body::before {
                                            content: "";
                                            position: fixed;
                                            top: 0;
                                            left: 0;
                                            right: 0;
                                            height: env(safe-area-inset-top);
                                            background: ${bg};
                                            z-index: 2147483647;
                                            pointer-events: none;
                                        }

                                        /* Bottom iOS home-indicator / Safari bottom area */
                                        body::after {
                                            content: "";
                                            position: fixed;
                                            bottom: 0;
                                            left: 0;
                                            right: 0;
                                            height: env(safe-area-inset-bottom);
                                            background: ${bg};
                                            z-index: 2147483647;
                                            pointer-events: none;
                                        }
            `;

			let metaTheme = document.getElementById(metaThemeId) as HTMLMetaElement | null;

			if (!metaTheme) {
				metaTheme = document.createElement('meta');
				metaTheme.id = metaThemeId;
				metaTheme.name = 'theme-color';
				document.head.appendChild(metaTheme);
			}

			metaTheme.content = bg;
		} else {
			document.getElementById(styleId)?.remove();
			document.getElementById(metaThemeId)?.remove();
		}

		return () => {
			document.getElementById(styleId)?.remove();
			document.getElementById(metaThemeId)?.remove();
		};
	}, [isFocused, backgroundColor, id]);

	return <></>;
}

export default memo(WebStatusBar);
