import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { GestureResponderEvent, LayoutChangeEvent } from 'react-native';

// ============ Event Map ============

export type PageEventMap = {
	onLayout: LayoutChangeEvent;
	onTouchStart: GestureResponderEvent;
	onTouchEnd: GestureResponderEvent;
	onTouchMove: GestureResponderEvent;
	onTouchCancel: GestureResponderEvent;
	onStartShouldSetResponder: GestureResponderEvent;
	onMoveShouldSetResponder: GestureResponderEvent;
	onResponderGrant: GestureResponderEvent;
	onResponderMove: GestureResponderEvent;
	onResponderRelease: GestureResponderEvent;
	onResponderReject: GestureResponderEvent;
	onResponderStart: GestureResponderEvent;
	onResponderEnd: GestureResponderEvent;
	onResponderTerminate: GestureResponderEvent;
	onResponderTerminationRequest: GestureResponderEvent;
};

type PageEventHandler<K extends keyof PageEventMap> = (event: PageEventMap[K]) => void;

// ============ Emitter (internal, held by Page/PageShell) ============

export class PageEventEmitter {
	private listeners = new Map<string, Set<PageEventHandler<any>>>();

	on<K extends keyof PageEventMap>(event: K, handler: PageEventHandler<K>): void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(handler);
	}

	off<K extends keyof PageEventMap>(event: K, handler: PageEventHandler<K>): void {
		this.listeners.get(event)?.delete(handler);
	}

	emit<K extends keyof PageEventMap>(event: K, e: PageEventMap[K]): void {
		this.listeners.get(event)?.forEach((handler) => handler(e));
	}
}

// ============ Context ============

interface PageEventContextValue {
	on<K extends keyof PageEventMap>(event: K, handler: PageEventHandler<K>): void;
	off<K extends keyof PageEventMap>(event: K, handler: PageEventHandler<K>): void;
}

const PageEventContext = createContext<PageEventContextValue | null>(null);

// ============ Provider ============

export function PageEventProvider({ emitter, children }: { emitter: PageEventEmitter; children: React.ReactNode }) {
	const on = useCallback(
		<K extends keyof PageEventMap>(event: K, handler: PageEventHandler<K>) => {
			emitter.on(event, handler);
		},
		[emitter],
	);

	const off = useCallback(
		<K extends keyof PageEventMap>(event: K, handler: PageEventHandler<K>) => {
			emitter.off(event, handler);
		},
		[emitter],
	);

	const value = useMemo(() => ({ on, off }), [on, off]);

	return <PageEventContext.Provider value={value}>{children}</PageEventContext.Provider>;
}

// ============ Hooks ============

/**
 * Returns `{ on, off }` to manually subscribe/unsubscribe to page events.
 * Must be used inside a `Page` or `PageShell`.
 */
export function usePageEvents(): PageEventContextValue {
	const ctx = useContext(PageEventContext);
	if (!ctx) throw new Error('usePageEvents must be used within a Page or PageShell');
	return ctx;
}

/**
 * Subscribes to a single page event for the lifetime of the component.
 * The handler is always kept up-to-date without re-subscribing.
 *
 * @example
 * usePageEvent('onTouchStart', (e) => { ... });
 */
export function usePageEvent<K extends keyof PageEventMap>(event: K, handler: PageEventHandler<K>): void {
	const { on, off } = usePageEvents();
	const handlerRef = useRef(handler);
	handlerRef.current = handler;

	useEffect(() => {
		const stable: PageEventHandler<K> = (e) => handlerRef.current(e);
		on(event, stable);
		return () => off(event, stable);
	}, [event, on, off]);
}
