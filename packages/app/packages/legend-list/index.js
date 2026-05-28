'use strict';

let React2 = require('react');
let reactNative = require('react-native');
let shim = require('use-sync-external-store/shim');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  let n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        let d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

let React2__namespace = /*#__PURE__*/_interopNamespace(React2);

// src/LegendList.tsx
let ContextState = React2__namespace.createContext(null);
function StateProvider({ children }) {
  const [value] = React2__namespace.useState(() => ({
    listeners: /* @__PURE__ */ new Map(),
    values: /* @__PURE__ */ new Map([
      ["paddingTop", 0],
      ["alignItemsPaddingTop", 0],
      ["stylePaddingTop", 0],
      ["headerSize", 0]
    ]),
    mapViewabilityCallbacks: /* @__PURE__ */ new Map(),
    mapViewabilityValues: /* @__PURE__ */ new Map(),
    mapViewabilityAmountCallbacks: /* @__PURE__ */ new Map(),
    mapViewabilityAmountValues: /* @__PURE__ */ new Map(),
    columnWrapperStyle: void 0,
    viewRefs: /* @__PURE__ */ new Map()
  }));
  return /* @__PURE__ */ React2__namespace.createElement(ContextState.Provider, { value }, children);
}
function useStateContext() {
  return React2__namespace.useContext(ContextState);
}
function createSelectorFunctionsArr(ctx, signalNames) {
  let lastValues = [];
  let lastSignalValues = [];
  return {
    subscribe: (cb) => {
      const listeners = [];
      for (const signalName of signalNames) {
        listeners.push(listen$(ctx, signalName, cb));
      }
      return () => {
        for (const listener of listeners) {
          listener();
        }
      };
    },
    get: () => {
      const currentValues = [];
      let hasChanged = false;
      for (let i = 0; i < signalNames.length; i++) {
        const value = peek$(ctx, signalNames[i]);
        currentValues.push(value);
        if (value !== lastSignalValues[i]) {
          hasChanged = true;
        }
      }
      lastSignalValues = currentValues;
      if (hasChanged) {
        lastValues = currentValues;
      }
      return lastValues;
    }
  };
}
function listen$(ctx, signalName, cb) {
  const { listeners } = ctx;
  let setListeners = listeners.get(signalName);
  if (!setListeners) {
    setListeners = /* @__PURE__ */ new Set();
    listeners.set(signalName, setListeners);
  }
  setListeners.add(cb);
  return () => setListeners.delete(cb);
}
function peek$(ctx, signalName) {
  const { values } = ctx;
  return values.get(signalName);
}
function set$(ctx, signalName, value) {
  const { listeners, values } = ctx;
  if (values.get(signalName) !== value) {
    values.set(signalName, value);
    const setListeners = listeners.get(signalName);
    if (setListeners) {
      for (const listener of setListeners) {
        listener(value);
      }
    }
  }
}
function getContentSize(ctx) {
  const { values } = ctx;
  const stylePaddingTop = values.get("stylePaddingTop") || 0;
  const headerSize = values.get("headerSize") || 0;
  const footerSize = values.get("footerSize") || 0;
  const totalSize = values.get("totalSize") || 0;
  return headerSize + footerSize + totalSize + stylePaddingTop;
}
function useArr$(signalNames) {
  const ctx = React2__namespace.useContext(ContextState);
  const { subscribe, get } = React2__namespace.useMemo(() => createSelectorFunctionsArr(ctx, signalNames), [ctx, signalNames]);
  const value = shim.useSyncExternalStore(subscribe, get);
  return value;
}
function useSelector$(signalName, selector) {
  const ctx = React2__namespace.useContext(ContextState);
  const { subscribe, get } = React2__namespace.useMemo(() => createSelectorFunctionsArr(ctx, [signalName]), [ctx, signalName]);
  const value = shim.useSyncExternalStore(subscribe, () => selector(get()[0]));
  return value;
}

// src/DebugView.tsx
let DebugRow = ({ children }) => {
  return /* @__PURE__ */ React2__namespace.createElement(reactNative.View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" } }, children);
};
React2__namespace.memo(function DebugView2({ state }) {
  const ctx = useStateContext();
  const [
    totalSize = 0,
    totalSizeWithScrollAdjust = 0,
    scrollAdjust = 0,
    rawScroll = 0,
    scroll = 0,
    numContainers = 0,
    numContainersPooled = 0
  ] = useArr$([
    "totalSize",
    "totalSizeWithScrollAdjust",
    "scrollAdjust",
    "debugRawScroll",
    "debugComputedScroll",
    "numContainers",
    "numContainersPooled"
  ]);
  const contentSize = getContentSize(ctx);
  const [, forceUpdate] = React2.useReducer((x) => x + 1, 0);
  useInterval(() => {
    forceUpdate();
  }, 100);
  return /* @__PURE__ */ React2__namespace.createElement(
    reactNative.View,
    {
      style: {
        position: "absolute",
        top: 0,
        right: 0,
        paddingLeft: 4,
        paddingBottom: 4,
        // height: 100,
        backgroundColor: "#FFFFFFCC",
        padding: 4,
        borderRadius: 4
      },
      pointerEvents: "none"
    },
    /* @__PURE__ */ React2__namespace.createElement(DebugRow, null, /* @__PURE__ */ React2__namespace.createElement(reactNative.Text, null, "TotalSize:"), /* @__PURE__ */ React2__namespace.createElement(reactNative.Text, null, totalSize.toFixed(2))),
    /* @__PURE__ */ React2__namespace.createElement(DebugRow, null, /* @__PURE__ */ React2__namespace.createElement(reactNative.Text, null, "ContentSize:"), /* @__PURE__ */ React2__namespace.createElement(reactNative.Text, null, contentSize.toFixed(2))),
    /* @__PURE__ */ React2__namespace.createElement(DebugRow, null, /* @__PURE__ */ React2__namespace.createElement(reactNative.Text, null, "At end:"), /* @__PURE__ */ React2__namespace.createElement(reactNative.Text, null, String(state.isAtBottom))),
    /* @__PURE__ */ React2__namespace.createElement(reactNative.Text, null),
    /* @__PURE__ */ React2__namespace.createElement(DebugRow, null, /* @__PURE__ */ React2__namespace.createElement(reactNative.Text, null, "ScrollAdjust:"), /* @__PURE__ */ React2__namespace.createElement(reactNative.Text, null, scrollAdjust.toFixed(2))),
    /* @__PURE__ */ React2__namespace.createElement(DebugRow, null, /* @__PURE__ */ React2__namespace.createElement(reactNative.Text, null, "TotalSizeReal: "), /* @__PURE__ */ React2__namespace.createElement(reactNative.Text, null, totalSizeWithScrollAdjust.toFixed(2))),
    /* @__PURE__ */ React2__namespace.createElement(reactNative.Text, null),
    /* @__PURE__ */ React2__namespace.createElement(DebugRow, null, /* @__PURE__ */ React2__namespace.createElement(reactNative.Text, null, "RawScroll: "), /* @__PURE__ */ React2__namespace.createElement(reactNative.Text, null, rawScroll.toFixed(2))),
    /* @__PURE__ */ React2__namespace.createElement(DebugRow, null, /* @__PURE__ */ React2__namespace.createElement(reactNative.Text, null, "ComputedScroll: "), /* @__PURE__ */ React2__namespace.createElement(reactNative.Text, null, scroll.toFixed(2)))
  );
});
function useInterval(callback, delay) {
  React2.useEffect(() => {
    const interval = setInterval(callback, delay);
    return () => clearInterval(interval);
  }, [delay]);
}

// src/helpers.ts
function isFunction(obj) {
  return typeof obj === "function";
}
let warned = /* @__PURE__ */ new Set();
function warnDevOnce(id, text) {
  if (__DEV__ && !warned.has(id)) {
    warned.add(id);
    console.warn(`[legend-list] ${text}`);
  }
}
function roundSize(size) {
  return Math.floor(size * 8) / 8;
}
function isNullOrUndefined(value) {
  return value === null || value === void 0;
}
function comparatorByDistance(a, b) {
  return b.distance - a.distance;
}
function comparatorDefault(a, b) {
  return a - b;
}
function getPadding(s) {
  let _a, _b, _c;
  return (_c = (_b = (_a = s.paddingTop) != null ? _a : s.paddingVertical) != null ? _b : s.padding) != null ? _c : 0;
}
function extractPaddingTop(style, contentContainerStyle) {
  return getPadding(style) + getPadding(contentContainerStyle);
}
let symbolFirst = Symbol();
function useInit(cb) {
  const refValue = React2.useRef(symbolFirst);
  if (refValue.current === symbolFirst) {
    refValue.current = cb();
  }
  return refValue.current;
}

// src/ContextContainer.ts
let ContextContainer = React2.createContext(null);
function useViewability(callback, configId) {
  const ctx = useStateContext();
  const { containerId } = React2.useContext(ContextContainer);
  const key = containerId + (configId != null ? configId : "");
  useInit(() => {
    const value = ctx.mapViewabilityValues.get(key);
    if (value) {
      callback(value);
    }
  });
  ctx.mapViewabilityCallbacks.set(key, callback);
  React2.useEffect(
    () => () => {
      ctx.mapViewabilityCallbacks.delete(key);
    },
    []
  );
}
function useViewabilityAmount(callback) {
  const ctx = useStateContext();
  const { containerId } = React2.useContext(ContextContainer);
  useInit(() => {
    const value = ctx.mapViewabilityAmountValues.get(containerId);
    if (value) {
      callback(value);
    }
  });
  ctx.mapViewabilityAmountCallbacks.set(containerId, callback);
  React2.useEffect(
    () => () => {
      ctx.mapViewabilityAmountCallbacks.delete(containerId);
    },
    []
  );
}
function useRecyclingEffect(effect) {
  const { index, value } = React2.useContext(ContextContainer);
  const prevValues = React2.useRef({
    prevIndex: void 0,
    prevItem: void 0
  });
  React2.useEffect(() => {
    let ret = void 0;
    if (prevValues.current.prevIndex !== void 0 && prevValues.current.prevItem !== void 0) {
      ret = effect({
        index,
        item: value,
        prevIndex: prevValues.current.prevIndex,
        prevItem: prevValues.current.prevItem
      });
    }
    prevValues.current = {
      prevIndex: index,
      prevItem: value
    };
    return ret;
  }, [index, value]);
}
function useRecyclingState(valueOrFun) {
  const { index, value, itemKey, triggerLayout } = React2.useContext(ContextContainer);
  const refState = React2.useRef({
    itemKey: null,
    value: null
  });
  const [_, setRenderNum] = React2.useState(0);
  if (refState.current.itemKey !== itemKey) {
    refState.current.itemKey = itemKey;
    refState.current.value = isFunction(valueOrFun) ? valueOrFun({
      index,
      item: value,
      prevIndex: void 0,
      prevItem: void 0
    }) : valueOrFun;
  }
  const setState = React2.useCallback(
    (newState) => {
      refState.current.value = isFunction(newState) ? newState(refState.current.value) : newState;
      setRenderNum((v) => v + 1);
      triggerLayout();
    },
    [triggerLayout]
  );
  return [refState.current.value, setState];
}
function useIsLastItem() {
  const { itemKey } = React2.useContext(ContextContainer);
  const isLast = useSelector$("lastItemKeys", (lastItemKeys) => (lastItemKeys == null ? void 0 : lastItemKeys.includes(itemKey)) || false);
  return isLast;
}
let LeanViewComponent = React2__namespace.forwardRef((props, ref) => {
  return React2__namespace.createElement("RCTView", { ...props, ref });
});
LeanViewComponent.displayName = "RCTView";
let LeanView = reactNative.Platform.OS === "android" || reactNative.Platform.OS === "ios" ? LeanViewComponent : reactNative.View;
let LeanViewContext = React2__namespace.createContext(void 0);
let useLeanViewContext = () => {
  const context = React2__namespace.useContext(LeanViewContext);
  if (!context) {
    throw new Error("useLeanViewContext must be used within a LeanViewProvider");
  }
  return context;
};

// src/constants.ts
let POSITION_OUT_OF_VIEW = -1e7;
let ANCHORED_POSITION_OUT_OF_VIEW = {
  type: "top",
  relativeCoordinate: POSITION_OUT_OF_VIEW,
  top: POSITION_OUT_OF_VIEW
};
let ENABLE_DEVMODE = __DEV__ && false;
let ENABLE_DEBUG_VIEW = __DEV__ && false;
let IsNewArchitecture = global.nativeFabricUIManager != null;

// src/Container.tsx
let Container = ({ id, recycleItems, horizontal, getRenderedItem, updateItemSize, ItemSeparatorComponent }) => {
  const ctx = useStateContext();
  const columnWrapperStyle = ctx.columnWrapperStyle;
  const [
    maintainVisibleContentPosition,
    position = ANCHORED_POSITION_OUT_OF_VIEW,
    column = 0,
    numColumns,
    lastItemKeys,
    itemKey,
    data,
    extraData
  ] = useArr$([
    "maintainVisibleContentPosition",
    `containerPosition${id}`,
    `containerColumn${id}`,
    "numColumns",
    "lastItemKeys",
    `containerItemKey${id}`,
    `containerItemData${id}`,
    "extraData"
  ]);
  const refLastSize = React2.useRef({ width: 0, height: 0 });
  const ref = React2.useRef(null);
  const [layoutRenderCount, forceLayoutRender] = React2.useState(0);
  const [parentLeanViewStyle, setParentLeanViewStyle] = React2.useState({ zIndex: 0 });
  const otherAxisPos = numColumns > 1 ? `${(column - 1) / numColumns * 100}%` : 0;
  const otherAxisSize = numColumns > 1 ? `${1 / numColumns * 100}%` : void 0;
  let paddingStyles;
  if (columnWrapperStyle) {
    const { columnGap, rowGap, gap } = columnWrapperStyle;
    if (horizontal) {
      paddingStyles = {
        paddingRight: !lastItemKeys.includes(itemKey) ? columnGap || gap || void 0 : void 0,
        paddingVertical: numColumns > 1 ? (rowGap || gap || 0) / 2 : void 0
      };
    } else {
      paddingStyles = {
        paddingBottom: !lastItemKeys.includes(itemKey) ? rowGap || gap || void 0 : void 0,
        paddingHorizontal: numColumns > 1 ? (columnGap || gap || 0) / 2 : void 0
      };
    }
  }
  const style = horizontal ? {
    flexDirection: ItemSeparatorComponent ? "row" : void 0,
    position: "absolute",
    top: otherAxisPos,
    height: otherAxisSize,
    left: position.relativeCoordinate,
    ...paddingStyles || {}
  } : {
    position: "absolute",
    left: otherAxisPos,
    right: numColumns > 1 ? null : 0,
    width: otherAxisSize,
    top: position.relativeCoordinate,
    ...paddingStyles || {}
  };
  const renderedItemInfo = React2.useMemo(
    () => itemKey !== void 0 ? getRenderedItem(itemKey) : null,
    [itemKey, data, extraData]
  );
  const { index, renderedItem } = renderedItemInfo || {};
  const triggerLayout = React2.useCallback(() => {
    forceLayoutRender((v) => v + 1);
  }, []);
  const updateZIndex = React2.useCallback((index2) => {
    setParentLeanViewStyle({ zIndex: index2 });
  }, []);
  const onLayout = (event) => {
    let _a, _b;
    if (!isNullOrUndefined(itemKey)) {
      let layout = event.nativeEvent.layout;
      const size = layout[horizontal ? "width" : "height"];
      const doUpdate = () => {
        refLastSize.current = { width: layout.width, height: layout.height };
        updateItemSize(itemKey, layout);
      };
      if (IsNewArchitecture || size > 0) {
        doUpdate();
      } else {
        (_b = (_a = ref.current) == null ? void 0 : _a.measure) == null ? void 0 : _b.call(_a, (x, y, width, height) => {
          layout = { width, height };
          doUpdate();
        });
      }
    }
  };
  if (IsNewArchitecture) {
    React2.useLayoutEffect(() => {
      let _a, _b;
      if (!isNullOrUndefined(itemKey)) {
        const measured = (_b = (_a = ref.current) == null ? void 0 : _a.unstable_getBoundingClientRect) == null ? void 0 : _b.call(_a);
        if (measured) {
          const size = Math.floor(measured[horizontal ? "width" : "height"] * 8) / 8;
          if (size) {
            updateItemSize(itemKey, measured);
          }
        }
      }
    }, [itemKey, layoutRenderCount]);
  } else {
    React2.useEffect(() => {
      if (!isNullOrUndefined(itemKey)) {
        const timeout = setTimeout(() => {
          if (refLastSize.current) {
            updateItemSize(itemKey, refLastSize.current);
          }
        }, 16);
        return () => {
          clearTimeout(timeout);
        };
      }
    }, [itemKey]);
  }
  const contextValue = React2.useMemo(() => {
    ctx.viewRefs.set(id, ref);
    return { containerId: id, itemKey, index, value: data, triggerLayout };
  }, [id, itemKey, index, data]);
  const contentFragment = /* @__PURE__ */ React2__namespace.default.createElement(React2__namespace.default.Fragment, { key: recycleItems ? void 0 : itemKey }, /* @__PURE__ */ React2__namespace.default.createElement(ContextContainer.Provider, { value: contextValue }, /* @__PURE__ */ React2__namespace.default.createElement(LeanViewContext.Provider, { value: { updateZIndex } }, renderedItem, renderedItemInfo && ItemSeparatorComponent && !lastItemKeys.includes(itemKey) && /* @__PURE__ */ React2__namespace.default.createElement(ItemSeparatorComponent, { leadingItem: renderedItemInfo.item }))));
  if (maintainVisibleContentPosition) {
    const anchorStyle = horizontal ? position.type === "top" ? { position: "absolute", left: 0, top: 0, bottom: 0, flexDirection: "row", alignItems: "stretch" } : { position: "absolute", right: 0, top: 0, bottom: 0, flexDirection: "row", alignItems: "stretch" } : position.type === "top" ? { position: "absolute", top: 0, left: 0, right: 0 } : { position: "absolute", bottom: 0, left: 0, right: 0 };
    if (__DEV__ && ENABLE_DEVMODE) ;
    return /* @__PURE__ */ React2__namespace.default.createElement(LeanView, { style: [style, parentLeanViewStyle] }, /* @__PURE__ */ React2__namespace.default.createElement(LeanView, { style: [anchorStyle, paddingStyles], onLayout, ref }, contentFragment, __DEV__ && ENABLE_DEVMODE));
  }
  return /* @__PURE__ */ React2__namespace.default.createElement(LeanView, { style: [style, parentLeanViewStyle], onLayout, ref }, contentFragment);
};
let typedForwardRef = React2.forwardRef;
let typedMemo = React2.memo;
let useAnimatedValue = (initialValue) => {
  return React2.useRef(new reactNative.Animated.Value(initialValue)).current;
};

// src/useValue$.ts
function useValue$(key, getValue, useMicrotask) {
  let _a;
  const ctx = useStateContext();
  const animValue = useAnimatedValue((_a = getValue ? getValue(peek$(ctx, key)) : peek$(ctx, key)) != null ? _a : 0);
  React2.useMemo(() => {
    let newValue = void 0;
    listen$(ctx, key, (v) => {
      if (useMicrotask && newValue === void 0) {
        queueMicrotask(() => {
          animValue.setValue(newValue);
          newValue = void 0;
        });
      }
      newValue = getValue ? getValue(v) : v;
      if (!useMicrotask) {
        animValue.setValue(newValue);
      }
    });
  }, []);
  return animValue;
}

// src/Containers.tsx
let Containers = typedMemo(function Containers2({
  horizontal,
  recycleItems,
  ItemSeparatorComponent,
  waitForInitialLayout,
  updateItemSize,
  getRenderedItem
}) {
  const ctx = useStateContext();
  const columnWrapperStyle = ctx.columnWrapperStyle;
  const [numContainers, numColumns] = useArr$(["numContainersPooled", "numColumns"]);
  const animSize = useValue$(
    "totalSizeWithScrollAdjust",
    void 0,
    /*useMicrotask*/
    true
  );
  const animOpacity = waitForInitialLayout ? useValue$("containersDidLayout", (value) => value ? 1 : 0) : void 0;
  const otherAxisSize = useValue$(
    "otherAxisSize",
    void 0,
    /*useMicrotask*/
    true
  );
  const containers = [];
  for (let i = 0; i < numContainers; i++) {
    containers.push(
      /* @__PURE__ */ React2__namespace.createElement(
        Container,
        {
          id: i,
          key: i,
          recycleItems,
          horizontal,
          getRenderedItem,
          updateItemSize,
          ItemSeparatorComponent
        }
      )
    );
  }
  const style = horizontal ? { width: animSize, opacity: animOpacity, minHeight: otherAxisSize } : { height: animSize, opacity: animOpacity, minWidth: otherAxisSize };
  if (columnWrapperStyle && numColumns > 1) {
    const { columnGap, rowGap, gap } = columnWrapperStyle;
    if (horizontal) {
      const my = (rowGap || gap || 0) / 2;
      if (my) {
        style.marginVertical = -my;
      }
    } else {
      const mx = (columnGap || gap || 0) / 2;
      if (mx) {
        style.marginHorizontal = -mx;
      }
    }
  }
  return /* @__PURE__ */ React2__namespace.createElement(reactNative.Animated.View, { style: [style, {}] }, containers);
});
function ListHeaderComponentContainer({
  children,
  style,
  ctx,
  horizontal,
  waitForInitialLayout
}) {
  const scrollAdjust = useValue$("scrollAdjust", (v) => v, true);
  const animOpacity = waitForInitialLayout ? useValue$("containersDidLayout", (value) => value ? 1 : 0) : void 0;
  const additionalSize = {
    transform: [{ translateY: reactNative.Animated.multiply(scrollAdjust, -1) }],
    opacity: animOpacity
  };
  return /* @__PURE__ */ React2__namespace.createElement(
    reactNative.Animated.View,
    {
      style: [style, additionalSize],
      onLayout: (event) => {
        const size = event.nativeEvent.layout[horizontal ? "width" : "height"];
        set$(ctx, "headerSize", size);
      }
    },
    children
  );
}

// src/ListComponent.tsx
let getComponent = (Component) => {
  if (React2__namespace.isValidElement(Component)) {
    return Component;
  }
  if (Component) {
    return /* @__PURE__ */ React2__namespace.createElement(Component, null);
  }
  return null;
};
let PaddingAndAdjust = () => {
  const animPaddingTop = useValue$("paddingTop", (v) => v, true);
  const animScrollAdjust = useValue$("scrollAdjust", (v) => v, true);
  const additionalSize = { marginTop: animScrollAdjust, paddingTop: animPaddingTop };
  return /* @__PURE__ */ React2__namespace.createElement(reactNative.Animated.View, { style: additionalSize });
};
let ListComponent = typedMemo(function ListComponent2({
  style,
  contentContainerStyle,
  horizontal,
  initialContentOffset,
  recycleItems,
  ItemSeparatorComponent,
  alignItemsAtEnd,
  waitForInitialLayout,
  handleScroll,
  onLayout,
  ListHeaderComponent,
  ListHeaderComponentStyle,
  ListFooterComponent,
  ListFooterComponentStyle,
  ListEmptyComponent,
  getRenderedItem,
  updateItemSize,
  refScrollView,
  maintainVisibleContentPosition,
  renderScrollComponent,
  onRefresh,
  refreshing,
  progressViewOffset,
  ...rest
}) {
  const ctx = useStateContext();
  const ScrollComponent = renderScrollComponent ? React2.useMemo(
    () => React2__namespace.forwardRef((props, ref) => renderScrollComponent({ ...props, ref })),
    [renderScrollComponent]
  ) : reactNative.ScrollView;
  return /* @__PURE__ */ React2__namespace.createElement(
    ScrollComponent,
    {
      ...rest,
      style,
      maintainVisibleContentPosition: maintainVisibleContentPosition && !ListEmptyComponent ? { minIndexForVisible: 0 } : void 0,
      contentContainerStyle: [
        contentContainerStyle,
        horizontal ? {
          height: "100%"
        } : {}
      ],
      onScroll: handleScroll,
      onLayout,
      horizontal,
      contentOffset: initialContentOffset ? horizontal ? { x: initialContentOffset, y: 0 } : { x: 0, y: initialContentOffset } : void 0,
      ref: refScrollView
    },
    !ListEmptyComponent && (/* @__PURE__ */ React2__namespace.createElement(PaddingAndAdjust, null)),
    ListHeaderComponent && /* @__PURE__ */ React2__namespace.createElement(
      ListHeaderComponentContainer,
      {
        style: ListHeaderComponentStyle,
        ctx,
        horizontal,
        waitForInitialLayout
      },
      getComponent(ListHeaderComponent)
    ),
    ListEmptyComponent && getComponent(ListEmptyComponent),
    /* @__PURE__ */ React2__namespace.createElement(
      Containers,
      {
        horizontal,
        recycleItems,
        waitForInitialLayout,
        getRenderedItem,
        ItemSeparatorComponent,
        updateItemSize
      }
    ),
    ListFooterComponent && /* @__PURE__ */ React2__namespace.createElement(
      reactNative.View,
      {
        style: ListFooterComponentStyle,
        onLayout: (event) => {
          const size = event.nativeEvent.layout[horizontal ? "width" : "height"];
          set$(ctx, "footerSize", size);
        }
      },
      getComponent(ListFooterComponent)
    )
  );
});

// src/ScrollAdjustHandler.ts
let ScrollAdjustHandler = class {
  constructor(ctx) {
    this.ctx = ctx;
    this.appliedAdjust = 0;
    this.busy = false;
    this.isPaused = false;
    this.isDisabled = false;
    this.context = ctx;
  }
  doAjdust() {
    set$(this.context, "scrollAdjust", this.appliedAdjust);
    this.busy = false;
  }
  requestAdjust(adjust, onAdjusted) {
    if (this.isDisabled) {
      return;
    }
    const oldAdjustTop = peek$(this.context, "scrollAdjust");
    if (oldAdjustTop === adjust) {
      return;
    }
    this.appliedAdjust = adjust;
    if (!this.busy && !this.isPaused) {
      this.busy = true;
      this.doAjdust();
      onAdjusted(oldAdjustTop - adjust);
    }
  }
  getAppliedAdjust() {
    return this.appliedAdjust;
  }
  pauseAdjust() {
    this.isPaused = true;
  }
  setDisableAdjust(disable) {
    this.isDisabled = disable;
  }
  // return true if it was paused
  unPauseAdjust() {
    if (this.isPaused) {
      this.isPaused = false;
      this.doAjdust();
      return true;
    }
    return false;
  }
};
let useCombinedRef = (...refs) => {
  const callback = React2.useCallback((element) => {
    for (const ref of refs) {
      if (!ref) {
        continue;
      }
      if (isFunction(ref)) {
        ref(element);
      } else {
        ref.current = element;
      }
    }
  }, refs);
  return callback;
};

// src/viewability.ts
let mapViewabilityConfigCallbackPairs = /* @__PURE__ */ new Map();
function setupViewability(props) {
  let { viewabilityConfig, viewabilityConfigCallbackPairs, onViewableItemsChanged } = props;
  if (viewabilityConfig || onViewableItemsChanged) {
    viewabilityConfigCallbackPairs = [
      ...viewabilityConfigCallbackPairs || [],
      {
        viewabilityConfig: viewabilityConfig || {
          viewAreaCoveragePercentThreshold: 0
        },
        onViewableItemsChanged
      }
    ];
  }
  if (viewabilityConfigCallbackPairs) {
    for (const pair of viewabilityConfigCallbackPairs) {
      mapViewabilityConfigCallbackPairs.set(pair.viewabilityConfig.id, {
        viewableItems: [],
        start: -1,
        end: -1,
        previousStart: -1,
        previousEnd: -1
      });
    }
  }
  return viewabilityConfigCallbackPairs;
}
function updateViewableItems(state, ctx, viewabilityConfigCallbackPairs, getId, scrollSize, start, end) {
  for (const viewabilityConfigCallbackPair of viewabilityConfigCallbackPairs) {
    const viewabilityState = mapViewabilityConfigCallbackPairs.get(
      viewabilityConfigCallbackPair.viewabilityConfig.id
    );
    viewabilityState.start = start;
    viewabilityState.end = end;
    if (viewabilityConfigCallbackPair.viewabilityConfig.minimumViewTime) {
      const timer = setTimeout(() => {
        state.timeouts.delete(timer);
        updateViewableItemsWithConfig(state.data, viewabilityConfigCallbackPair, getId, state, ctx, scrollSize);
      }, viewabilityConfigCallbackPair.viewabilityConfig.minimumViewTime);
      state.timeouts.add(timer);
    } else {
      updateViewableItemsWithConfig(state.data, viewabilityConfigCallbackPair, getId, state, ctx, scrollSize);
    }
  }
}
function updateViewableItemsWithConfig(data, viewabilityConfigCallbackPair, getId, state, ctx, scrollSize) {
  const { viewabilityConfig, onViewableItemsChanged } = viewabilityConfigCallbackPair;
  const configId = viewabilityConfig.id;
  const viewabilityState = mapViewabilityConfigCallbackPairs.get(configId);
  const { viewableItems: previousViewableItems, start, end } = viewabilityState;
  const viewabilityTokens = /* @__PURE__ */ new Map();
  for (const [containerId, value] of ctx.mapViewabilityAmountValues) {
    viewabilityTokens.set(
      containerId,
      computeViewability(
        state,
        ctx,
        viewabilityConfig,
        containerId,
        value.key,
        scrollSize,
        value.item,
        value.index
      )
    );
  }
  const changed = [];
  if (previousViewableItems) {
    for (const viewToken of previousViewableItems) {
      const containerId = findContainerId(ctx, viewToken.key);
      if (!isViewable(
        state,
        ctx,
        viewabilityConfig,
        containerId,
        viewToken.key,
        scrollSize,
        viewToken.item,
        viewToken.index
      )) {
        viewToken.isViewable = false;
        changed.push(viewToken);
      }
    }
  }
  const viewableItems = [];
  for (let i = start; i <= end; i++) {
    const item = data[i];
    if (item) {
      const key = getId(i);
      const containerId = findContainerId(ctx, key);
      if (isViewable(state, ctx, viewabilityConfig, containerId, key, scrollSize, item, i)) {
        const viewToken = {
          item,
          key,
          index: i,
          isViewable: true,
          containerId
        };
        viewableItems.push(viewToken);
        if (!(previousViewableItems == null ? void 0 : previousViewableItems.find((v) => v.key === viewToken.key))) {
          changed.push(viewToken);
        }
      }
    }
  }
  Object.assign(viewabilityState, {
    viewableItems,
    previousStart: start,
    previousEnd: end
  });
  if (changed.length > 0) {
    viewabilityState.viewableItems = viewableItems;
    for (let i = 0; i < changed.length; i++) {
      const change = changed[i];
      maybeUpdateViewabilityCallback(ctx, configId, change.containerId, change);
    }
    if (onViewableItemsChanged) {
      onViewableItemsChanged({ viewableItems, changed });
    }
  }
  for (const [containerId, value] of ctx.mapViewabilityAmountValues) {
    if (value.sizeVisible < 0) {
      ctx.mapViewabilityAmountValues.delete(containerId);
    }
  }
}
function computeViewability(state, ctx, viewabilityConfig, containerId, key, scrollSize, item, index) {
  const { sizes, positions, scroll: scrollState, scrollAdjustHandler } = state;
  const topPad = (peek$(ctx, "stylePaddingTop") || 0) + (peek$(ctx, "headerSize") || 0);
  const { itemVisiblePercentThreshold, viewAreaCoveragePercentThreshold } = viewabilityConfig;
  const viewAreaMode = viewAreaCoveragePercentThreshold != null;
  const viewablePercentThreshold = viewAreaMode ? viewAreaCoveragePercentThreshold : itemVisiblePercentThreshold;
  const previousScrollAdjust = scrollAdjustHandler.getAppliedAdjust();
  const scroll = scrollState - previousScrollAdjust - topPad;
  const top = positions.get(key) - scroll;
  const size = sizes.get(key) || 0;
  const bottom = top + size;
  const isEntirelyVisible = top >= 0 && bottom <= scrollSize && bottom > top;
  const sizeVisible = isEntirelyVisible ? size : Math.min(bottom, scrollSize) - Math.max(top, 0);
  const percentVisible = size ? isEntirelyVisible ? 100 : 100 * (sizeVisible / size) : 0;
  const percentOfScroller = size ? 100 * (sizeVisible / scrollSize) : 0;
  const percent = isEntirelyVisible ? 100 : viewAreaMode ? percentOfScroller : percentVisible;
  const isViewable2 = percent >= viewablePercentThreshold;
  const value = {
    index,
    isViewable: isViewable2,
    item,
    key,
    percentVisible,
    percentOfScroller,
    sizeVisible,
    size,
    scrollSize,
    containerId
  };
  if (JSON.stringify(value) !== JSON.stringify(ctx.mapViewabilityAmountValues.get(containerId))) {
    ctx.mapViewabilityAmountValues.set(containerId, value);
    const cb = ctx.mapViewabilityAmountCallbacks.get(containerId);
    if (cb) {
      cb(value);
    }
  }
  return value;
}
function isViewable(state, ctx, viewabilityConfig, containerId, key, scrollSize, item, index) {
  const value = ctx.mapViewabilityAmountValues.get(containerId) || computeViewability(state, ctx, viewabilityConfig, containerId, key, scrollSize, item, index);
  return value.isViewable;
}
function findContainerId(ctx, key) {
  const numContainers = peek$(ctx, "numContainers");
  for (let i = 0; i < numContainers; i++) {
    const itemKey = peek$(ctx, `containerItemKey${i}`);
    if (itemKey === key) {
      return i;
    }
  }
  return -1;
}
function maybeUpdateViewabilityCallback(ctx, configId, containerId, viewToken) {
  const key = containerId + configId;
  ctx.mapViewabilityValues.set(key, viewToken);
  const cb = ctx.mapViewabilityCallbacks.get(key);
  cb == null ? void 0 : cb(viewToken);
}

// src/LegendList.tsx
let DEFAULT_DRAW_DISTANCE = 250;
let DEFAULT_ITEM_SIZE = 100;
function createColumnWrapperStyle(contentContainerStyle) {
  const { gap, columnGap, rowGap } = contentContainerStyle;
  if (gap || columnGap || rowGap) {
    contentContainerStyle.gap = void 0;
    contentContainerStyle.columnGap = void 0;
    contentContainerStyle.rowGap = void 0;
    return {
      gap,
      columnGap,
      rowGap
    };
  }
}
let LegendList = typedForwardRef(function LegendList2(props, forwardedRef) {
  return /* @__PURE__ */ React2__namespace.createElement(StateProvider, null, /* @__PURE__ */ React2__namespace.createElement(LegendListInner, { ...props, ref: forwardedRef }));
});
var LegendListInner = typedForwardRef(function LegendListInner2(props, forwardedRef) {
  const {
    data: dataProp = [],
    initialScrollIndex,
    initialScrollOffset,
    horizontal,
    drawDistance = 250,
    recycleItems = false,
    onEndReachedThreshold = 0.5,
    onStartReachedThreshold = 0.5,
    maintainScrollAtEnd = false,
    maintainScrollAtEndThreshold = 0.1,
    alignItemsAtEnd = false,
    maintainVisibleContentPosition = false,
    onScroll: onScrollProp,
    onMomentumScrollEnd,
    numColumns: numColumnsProp = 1,
    columnWrapperStyle,
    keyExtractor: keyExtractorProp,
    renderItem,
    estimatedItemSize: estimatedItemSizeProp,
    getEstimatedItemSize,
    suggestEstimatedItemSize,
    ListEmptyComponent,
    onItemSizeChanged,
    refScrollView,
    waitForInitialLayout = true,
    extraData,
    contentContainerStyle: contentContainerStyleProp,
    style: styleProp,
    onLayout: onLayoutProp,
    onRefresh,
    refreshing,
    progressViewOffset,
    refreshControl,
    initialContainerPoolRatio = 2,
    viewabilityConfig,
    viewabilityConfigCallbackPairs,
    onViewableItemsChanged,
    ...rest
  } = props;
  const refLoadStartTime = React2.useRef(Date.now());
  const callbacks = React2.useRef({
    onStartReached: rest.onStartReached,
    onEndReached: rest.onEndReached
  });
  callbacks.current.onStartReached = rest.onStartReached;
  callbacks.current.onEndReached = rest.onEndReached;
  const contentContainerStyle = { ...reactNative.StyleSheet.flatten(contentContainerStyleProp) };
  const style = { ...reactNative.StyleSheet.flatten(styleProp) };
  const stylePaddingTopState = extractPaddingTop(style, contentContainerStyle);
  if (style == null ? void 0 : style.paddingTop) {
    style.paddingTop = void 0;
  }
  if (contentContainerStyle == null ? void 0 : contentContainerStyle.paddingTop) {
    contentContainerStyle.paddingTop = void 0;
  }
  const ctx = useStateContext();
  ctx.columnWrapperStyle = columnWrapperStyle || (contentContainerStyle ? createColumnWrapperStyle(contentContainerStyle) : void 0);
  const refScroller = React2.useRef(null);
  const combinedRef = useCombinedRef(refScroller, refScrollView);
  const estimatedItemSize = estimatedItemSizeProp != null ? estimatedItemSizeProp : DEFAULT_ITEM_SIZE;
  const scrollBuffer = (drawDistance != null ? drawDistance : DEFAULT_DRAW_DISTANCE) || 1;
  const keyExtractor = keyExtractorProp != null ? keyExtractorProp : (item, index) => index.toString();
  const refState = React2.useRef();
  const getId = (index) => {
    let _a;
    const data = (_a = refState.current) == null ? void 0 : _a.data;
    if (!data) {
      return "";
    }
    const ret = index < data.length ? keyExtractor ? keyExtractor(data[index], index) : index : null;
    return `${ret}`;
  };
  const getItemSize = (key, index, data, useAverageSize = false) => {
    const state = refState.current;
    const sizeKnown = state.sizesKnown.get(key);
    const sizePrevious = state.sizes.get(key);
    let size;
    const numColumns = peek$(ctx, "numColumns");
    if (sizeKnown === void 0 && !getEstimatedItemSize && numColumns === 1 && useAverageSize) {
      const itemType = "";
      const average = state.averageSizes[itemType];
      if (average) {
        size = roundSize(average.avg);
        if (size !== sizePrevious) {
          addTotalSize(key, size - sizePrevious, 0);
        }
      }
    }
    if (size === void 0 && sizePrevious !== void 0) {
      return sizePrevious;
    }
    if (size === void 0) {
      size = getEstimatedItemSize ? getEstimatedItemSize(index, data) : estimatedItemSize;
    }
    state.sizes.set(key, size);
    return size;
  };
  const calculateOffsetForIndex = (indexParam) => {
    let _a;
    const isFromInit = indexParam === void 0;
    const index = isFromInit ? initialScrollIndex : indexParam;
    const data = dataProp;
    if (index !== void 0) {
      let offset = 0;
      const canGetSize = !!refState.current;
      if (canGetSize || getEstimatedItemSize) {
        const sizeFn = (index2) => {
          if (canGetSize) {
            return getItemSize(getId(index2), index2, data[index2]);
          }
          return getEstimatedItemSize(index2, data[index2]);
        };
        for (let i = 0; i < index; i++) {
          offset += sizeFn(i);
        }
      } else {
        offset = index * estimatedItemSize;
      }
      const adjust = peek$(ctx, "containersDidLayout") ? ((_a = refState.current) == null ? void 0 : _a.scrollAdjustHandler.getAppliedAdjust()) || 0 : 0;
      const stylePaddingTop = isFromInit ? stylePaddingTopState : peek$(ctx, "stylePaddingTop");
      const topPad = (stylePaddingTop != null ? stylePaddingTop : 0) + peek$(ctx, "headerSize");
      return offset / numColumnsProp - adjust + topPad;
    }
    return 0;
  };
  const initialContentOffset = initialScrollOffset != null ? initialScrollOffset : React2.useMemo(() => calculateOffsetForIndex(void 0), []);
  if (!refState.current) {
    const initialScrollLength = reactNative.Dimensions.get("window")[horizontal ? "width" : "height"];
    refState.current = {
      sizes: /* @__PURE__ */ new Map(),
      positions: /* @__PURE__ */ new Map(),
      columns: /* @__PURE__ */ new Map(),
      pendingAdjust: 0,
      isStartReached: initialContentOffset < initialScrollLength * onStartReachedThreshold,
      isEndReached: false,
      isAtBottom: false,
      isAtTop: false,
      data: dataProp,
      scrollLength: initialScrollLength,
      startBuffered: -1,
      startNoBuffer: -1,
      endBuffered: -1,
      endNoBuffer: -1,
      scroll: initialContentOffset || 0,
      totalSize: 0,
      totalSizeBelowAnchor: 0,
      timeouts: /* @__PURE__ */ new Set(),
      viewabilityConfigCallbackPairs: void 0,
      renderItem: void 0,
      scrollAdjustHandler: new ScrollAdjustHandler(ctx),
      nativeMarginTop: 0,
      scrollPrev: 0,
      scrollPrevTime: 0,
      scrollTime: 0,
      scrollPending: 0,
      indexByKey: /* @__PURE__ */ new Map(),
      scrollHistory: [],
      scrollVelocity: 0,
      sizesKnown: /* @__PURE__ */ new Map(),
      timeoutSizeMessage: 0,
      scrollTimer: void 0,
      belowAnchorElementPositions: void 0,
      rowHeights: /* @__PURE__ */ new Map(),
      startReachedBlockedByTimer: false,
      endReachedBlockedByTimer: false,
      scrollForNextCalculateItemsInView: void 0,
      enableScrollForNextCalculateItemsInView: true,
      minIndexSizeChanged: 0,
      queuedCalculateItemsInView: 0,
      lastBatchingAction: Date.now(),
      averageSizes: {},
      onScroll: onScrollProp
    };
    const dataLength = dataProp.length;
    if (maintainVisibleContentPosition && dataLength > 0) {
      if (initialScrollIndex && initialScrollIndex < dataLength) {
        refState.current.anchorElement = {
          coordinate: initialContentOffset,
          id: getId(initialScrollIndex)
        };
      } else if (dataLength > 0) {
        refState.current.anchorElement = {
          coordinate: initialContentOffset,
          id: getId(0)
        };
      } else {
        __DEV__ && warnDevOnce(
          "maintainVisibleContentPosition",
          "[legend-list] maintainVisibleContentPosition was not able to find an anchor element"
        );
      }
    }
    set$(ctx, "scrollAdjust", 0);
    set$(ctx, "maintainVisibleContentPosition", maintainVisibleContentPosition);
    set$(ctx, "extraData", extraData);
  }
  const didDataChange = refState.current.data !== dataProp;
  refState.current.data = dataProp;
  refState.current.onScroll = onScrollProp;
  const getAnchorElementIndex = () => {
    const state = refState.current;
    if (state.anchorElement) {
      const el = state.indexByKey.get(state.anchorElement.id);
      return el;
    }
    return void 0;
  };
  const scrollToIndex = ({
    index,
    viewOffset = 0,
    animated = true,
    viewPosition = 0
  }) => {
    let _a;
    const state = refState.current;
    if (index >= state.data.length) {
      index = state.data.length - 1;
    } else if (index < 0) {
      index = 0;
    }
    const firstIndexOffset = calculateOffsetForIndex(index);
    let firstIndexScrollPostion = firstIndexOffset - viewOffset;
    const diff = Math.abs(state.scroll - firstIndexScrollPostion);
    const topPad = peek$(ctx, "stylePaddingTop") + peek$(ctx, "headerSize");
    const needsReanchoring = maintainVisibleContentPosition && diff > 100;
    state.scrollForNextCalculateItemsInView = void 0;
    if (needsReanchoring) {
      const id = getId(index);
      state.anchorElement = { id, coordinate: firstIndexOffset - topPad };
      (_a = state.belowAnchorElementPositions) == null ? void 0 : _a.clear();
      state.positions.clear();
      calcTotalSizesAndPositions({ forgetPositions: true });
      state.startBufferedId = id;
      state.minIndexSizeChanged = index;
      firstIndexScrollPostion = firstIndexOffset - viewOffset + state.scrollAdjustHandler.getAppliedAdjust();
    }
    if (viewPosition) {
      firstIndexScrollPostion -= viewPosition * (state.scrollLength - getItemSize(getId(index), index, state.data[index]));
    }
    scrollTo(firstIndexScrollPostion, animated);
  };
  const setDidLayout = () => {
    refState.current.queuedInitialLayout = true;
    checkAtBottom();
    const setIt = () => {
      set$(ctx, "containersDidLayout", true);
      if (props.onLoad) {
        props.onLoad({ elapsedTimeInMs: Date.now() - refLoadStartTime.current });
      }
    };
    if (initialScrollIndex) {
      queueMicrotask(() => {
        scrollToIndex({ index: initialScrollIndex, animated: false });
        requestAnimationFrame(() => {
          if (!IsNewArchitecture) {
            scrollToIndex({ index: initialScrollIndex, animated: false });
          }
          setIt();
        });
      });
    } else {
      queueMicrotask(setIt);
    }
  };
  const addTotalSize = React2.useCallback((key, add, totalSizeBelowAnchor) => {
    const state = refState.current;
    const { indexByKey, anchorElement } = state;
    const index = key === null ? 0 : indexByKey.get(key);
    let isAboveAnchor = false;
    if (maintainVisibleContentPosition) {
      if (anchorElement && index < getAnchorElementIndex()) {
        isAboveAnchor = true;
      }
    }
    if (key === null) {
      state.totalSize = add;
      state.totalSizeBelowAnchor = totalSizeBelowAnchor;
    } else {
      state.totalSize += add;
      if (isAboveAnchor) {
        state.totalSizeBelowAnchor += add;
      }
    }
    let applyAdjustValue = 0;
    let resultSize = state.totalSize;
    if (maintainVisibleContentPosition && anchorElement !== void 0) {
      const newAdjust = anchorElement.coordinate - state.totalSizeBelowAnchor;
      applyAdjustValue = -newAdjust;
      state.belowAnchorElementPositions = buildElementPositionsBelowAnchor();
      state.rowHeights.clear();
      if (applyAdjustValue !== void 0) {
        resultSize -= applyAdjustValue;
        state.scrollAdjustHandler.requestAdjust(applyAdjustValue, (diff) => {
          state.scroll -= diff;
        });
      }
    }
    set$(ctx, "totalSize", state.totalSize);
    set$(ctx, "totalSizeWithScrollAdjust", resultSize);
    if (alignItemsAtEnd) {
      updateAlignItemsPaddingTop();
    }
  }, []);
  const getRowHeight = (n) => {
    const { rowHeights, data } = refState.current;
    const numColumns = peek$(ctx, "numColumns");
    if (numColumns === 1) {
      const id = getId(n);
      return getItemSize(id, n, data[n]);
    }
    if (rowHeights.has(n)) {
      return rowHeights.get(n) || 0;
    }
    let rowHeight = 0;
    const startEl = n * numColumns;
    for (let i = startEl; i < startEl + numColumns && i < data.length; i++) {
      const id = getId(i);
      const size = getItemSize(id, i, data[i]);
      rowHeight = Math.max(rowHeight, size);
    }
    rowHeights.set(n, rowHeight);
    return rowHeight;
  };
  const buildElementPositionsBelowAnchor = () => {
    const state = refState.current;
    if (!state.anchorElement) {
      return /* @__PURE__ */ new Map();
    }
    const anchorIndex = state.indexByKey.get(state.anchorElement.id);
    if (anchorIndex === 0) {
      return /* @__PURE__ */ new Map();
    }
    const map = state.belowAnchorElementPositions || /* @__PURE__ */ new Map();
    const numColumns = peek$(ctx, "numColumns");
    let top = state.anchorElement.coordinate;
    for (let i = anchorIndex - 1; i >= 0; i--) {
      const id = getId(i);
      const rowNumber = Math.floor(i / numColumns);
      if (i % numColumns === 0) {
        top -= getRowHeight(rowNumber);
      }
      map.set(id, top);
    }
    return map;
  };
  const disableScrollJumps = (timeout) => {
    const state = refState.current;
    if (state.scrollingToOffset === void 0) {
      state.disableScrollJumpsFrom = state.scroll - state.scrollAdjustHandler.getAppliedAdjust();
      state.scrollHistory.length = 0;
      setTimeout(() => {
        state.disableScrollJumpsFrom = void 0;
        if (state.scrollPending !== void 0 && state.scrollPending !== state.scroll) {
          updateScroll(state.scrollPending);
        }
      }, timeout);
    }
  };
  const getElementPositionBelowAchor = (id) => {
    let _a;
    const state = refState.current;
    if (!refState.current.belowAnchorElementPositions) {
      state.belowAnchorElementPositions = buildElementPositionsBelowAnchor();
    }
    const res = state.belowAnchorElementPositions.get(id);
    if (res === void 0) {
      console.warn(`Undefined position below anchor ${id} ${(_a = state.anchorElement) == null ? void 0 : _a.id}`);
      return 0;
    }
    return res;
  };
  const fixGaps = React2.useCallback(() => {
    let _a;
    const state = refState.current;
    const { data, scrollLength, positions, startBuffered, endBuffered } = state;
    const numColumns = peek$(ctx, "numColumns");
    if (!data || scrollLength === 0 || numColumns > 1) {
      return;
    }
    const numContainers = ctx.values.get("numContainers");
    let numMeasurements = 0;
    for (let i = 0; i < numContainers; i++) {
      const itemKey = peek$(ctx, `containerItemKey${i}`);
      const isSizeKnown = state.sizesKnown.get(itemKey);
      if (itemKey && !isSizeKnown) {
        const containerRef = ctx.viewRefs.get(i);
        if (containerRef) {
          let measured;
          (_a = containerRef.current) == null ? void 0 : _a.measure((x, y, width, height) => {
            measured = { width, height };
          });
          numMeasurements++;
          if (measured) {
            updateItemSize(
              itemKey,
              measured,
              /*fromFixGaps*/
              true
            );
          }
        }
      }
    }
    if (numMeasurements > 0) {
      let top;
      const diffs = /* @__PURE__ */ new Map();
      for (let i = startBuffered; i <= endBuffered; i++) {
        const id = getId(i);
        if (top === void 0) {
          top = positions.get(id);
        }
        if (positions.get(id) !== top) {
          diffs.set(id, top - positions.get(id));
          positions.set(id, top);
        }
        const size = getItemSize(id, i, data[i]);
        const bottom = top + size;
        top = bottom;
      }
      for (let i = 0; i < numContainers; i++) {
        const itemKey = peek$(ctx, `containerItemKey${i}`);
        const diff = diffs.get(itemKey);
        if (diff) {
          const prevPos = peek$(ctx, `containerPosition${i}`);
          const newPos = prevPos.top + diff;
          if (prevPos.top !== newPos) {
            const pos = { ...prevPos };
            pos.relativeCoordinate += diff;
            pos.top += diff;
            set$(ctx, `containerPosition${i}`, pos);
          }
        }
      }
    }
  }, []);
  const checkAllSizesKnown = React2.useCallback(() => {
    const { startBuffered, endBuffered, sizesKnown } = refState.current;
    if (endBuffered !== null) {
      let areAllKnown = true;
      for (let i = startBuffered; areAllKnown && i <= endBuffered; i++) {
        const key = getId(i);
        areAllKnown && (areAllKnown = sizesKnown.has(key));
      }
      return areAllKnown;
    }
    return false;
  }, []);
  const calculateItemsInView = React2.useCallback((isReset) => {
    let _a;
    const state = refState.current;
    const {
      data,
      scrollLength,
      startBufferedId: startBufferedIdOrig,
      positions,
      columns,
      scrollAdjustHandler,
      scrollVelocity: speed
    } = state;
    if (!data || scrollLength === 0) {
      return;
    }
    const totalSize = peek$(ctx, "totalSizeWithScrollAdjust");
    const topPad = peek$(ctx, "stylePaddingTop") + peek$(ctx, "headerSize");
    const numColumns = peek$(ctx, "numColumns");
    const previousScrollAdjust = scrollAdjustHandler.getAppliedAdjust();
    let scrollState = state.scroll;
    const scrollExtra = 0;
    const useAverageSize = !state.disableScrollJumpsFrom && speed >= 0 && peek$(ctx, "containersDidLayout");
    if (!state.queuedInitialLayout && initialScrollIndex) {
      const updatedOffset = calculateOffsetForIndex(initialScrollIndex);
      scrollState = updatedOffset;
    }
    const scrollAdjustPad = -previousScrollAdjust - topPad;
    let scroll = scrollState + scrollExtra + scrollAdjustPad;
    if (scroll + scrollLength > totalSize) {
      scroll = totalSize - scrollLength;
    }
    let scrollBufferTop = scrollBuffer;
    let scrollBufferBottom = scrollBuffer;
    if (Math.abs(speed) > 4) {
      if (speed > 0) {
        scrollBufferTop = scrollBuffer * 0.1;
        scrollBufferBottom = scrollBuffer * 1.9;
      } else {
        scrollBufferTop = scrollBuffer * 1.9;
        scrollBufferBottom = scrollBuffer * 0.1;
      }
    }
    const scrollTopBuffered = scroll - scrollBufferTop;
    const scrollBottom = scroll + scrollLength;
    const scrollBottomBuffered = scrollBottom + scrollBufferBottom;
    if (state.scrollForNextCalculateItemsInView) {
      const { top: top2, bottom } = state.scrollForNextCalculateItemsInView;
      if (scrollTopBuffered > top2 && scrollBottomBuffered < bottom) {
        return;
      }
    }
    let startNoBuffer = null;
    let startBuffered = null;
    let startBufferedId = null;
    let endNoBuffer = null;
    let endBuffered = null;
    let loopStart = startBufferedIdOrig ? state.indexByKey.get(startBufferedIdOrig) || 0 : 0;
    if (state.minIndexSizeChanged !== void 0) {
      loopStart = Math.min(state.minIndexSizeChanged, loopStart);
      state.minIndexSizeChanged = void 0;
    }
    const anchorElementIndex = getAnchorElementIndex();
    for (let i = loopStart; i >= 0; i--) {
      const id = getId(i);
      let newPosition;
      if (maintainVisibleContentPosition && anchorElementIndex && i < anchorElementIndex) {
        newPosition = getElementPositionBelowAchor(id);
        if (newPosition !== void 0) {
          positions.set(id, newPosition);
        }
      }
      const top2 = newPosition || positions.get(id);
      if (top2 !== void 0) {
        const size = getItemSize(id, i, data[i], useAverageSize);
        const bottom = top2 + size;
        if (bottom > scroll - scrollBuffer) {
          loopStart = i;
        } else {
          break;
        }
      }
    }
    const loopStartMod = loopStart % numColumns;
    if (loopStartMod > 0) {
      loopStart -= loopStartMod;
    }
    let top = void 0;
    let column = 1;
    let maxSizeInRow = 0;
    const getInitialTop = (i) => {
      let _a2;
      const id = getId(i);
      let topOffset = 0;
      if (positions.get(id)) {
        topOffset = positions.get(id);
      }
      if (id === ((_a2 = state.anchorElement) == null ? void 0 : _a2.id)) {
        topOffset = state.anchorElement.coordinate;
      }
      return topOffset;
    };
    let foundEnd = false;
    let nextTop;
    let nextBottom;
    const prevNumContainers = ctx.values.get("numContainers");
    let maxIndexRendered = 0;
    for (let i = 0; i < prevNumContainers; i++) {
      const key = peek$(ctx, `containerItemKey${i}`);
      if (key !== void 0) {
        const index = state.indexByKey.get(key);
        maxIndexRendered = Math.max(maxIndexRendered, index);
      }
    }
    for (let i = Math.max(0, loopStart); i < data.length && (!foundEnd || i <= maxIndexRendered); i++) {
      const id = getId(i);
      const size = getItemSize(id, i, data[i], useAverageSize);
      maxSizeInRow = Math.max(maxSizeInRow, size);
      if (top === void 0 || id === ((_a = state.anchorElement) == null ? void 0 : _a.id)) {
        top = getInitialTop(i);
      }
      if (positions.get(id) !== top) {
        positions.set(id, top);
      }
      if (columns.get(id) !== column) {
        columns.set(id, column);
      }
      if (!foundEnd) {
        if (startNoBuffer === null && top + size > scroll) {
          startNoBuffer = i;
        }
        if (startBuffered === null && top + size > scrollTopBuffered) {
          startBuffered = i;
          startBufferedId = id;
          nextTop = top;
        }
        if (startNoBuffer !== null) {
          if (top <= scrollBottom) {
            endNoBuffer = i;
          }
          if (top <= scrollBottomBuffered) {
            endBuffered = i;
            nextBottom = top + maxSizeInRow - scrollLength;
          } else {
            foundEnd = true;
          }
        }
      }
      column++;
      if (column > numColumns) {
        top += maxSizeInRow;
        column = 1;
        maxSizeInRow = 0;
      }
    }
    Object.assign(state, {
      startBuffered,
      startBufferedId,
      startNoBuffer,
      endBuffered,
      endNoBuffer
    });
    if (state.enableScrollForNextCalculateItemsInView && nextTop !== void 0 && nextBottom !== void 0 && state.disableScrollJumpsFrom === void 0) {
      state.scrollForNextCalculateItemsInView = nextTop !== void 0 && nextBottom !== void 0 ? {
        top: nextTop,
        bottom: nextBottom
      } : void 0;
    }
    if (startBuffered !== null && endBuffered !== null) {
      let numContainers = prevNumContainers;
      const needNewContainers = [];
      const isContained = (i) => {
        const id = getId(i);
        for (let j = 0; j < numContainers; j++) {
          const key = peek$(ctx, `containerItemKey${j}`);
          if (key === id) {
            return true;
          }
        }
      };
      for (let i = startBuffered; i <= endBuffered; i++) {
        if (!isContained(i)) {
          needNewContainers.push(i);
        }
      }
      if (needNewContainers.length > 0) {
        const availableContainers = findAvailableContainers(
          needNewContainers.length,
          startBuffered,
          endBuffered
        );
        for (let idx = 0; idx < needNewContainers.length; idx++) {
          const i = needNewContainers[idx];
          const containerIndex = availableContainers[idx];
          const id = getId(i);
          set$(ctx, `containerItemKey${containerIndex}`, id);
          set$(ctx, `containerItemData${containerIndex}`, data[i]);
          if (containerIndex >= numContainers) {
            numContainers = containerIndex + 1;
          }
        }
        if (numContainers !== prevNumContainers) {
          set$(ctx, "numContainers", numContainers);
          if (numContainers > peek$(ctx, "numContainersPooled")) {
            set$(ctx, "numContainersPooled", Math.ceil(numContainers * 1.5));
          }
        }
      }
      for (let i = 0; i < numContainers; i++) {
        const itemKey = peek$(ctx, `containerItemKey${i}`);
        const itemIndex = state.indexByKey.get(itemKey);
        const item = data[itemIndex];
        if (item !== void 0) {
          const id = getId(itemIndex);
          const position = positions.get(id);
          if (position === void 0) {
            set$(ctx, `containerPosition${i}`, ANCHORED_POSITION_OUT_OF_VIEW);
          } else {
            const pos = {
              type: "top",
              relativeCoordinate: positions.get(id),
              top: positions.get(id)
            };
            const column2 = columns.get(id) || 1;
            if (maintainVisibleContentPosition && itemIndex < anchorElementIndex) {
              const currentRow = Math.floor(itemIndex / numColumns);
              const rowHeight = getRowHeight(currentRow);
              const elementHeight = getItemSize(id, itemIndex, data[i]);
              const diff = rowHeight - elementHeight;
              pos.relativeCoordinate = pos.top + getRowHeight(currentRow) - diff;
              pos.type = "bottom";
            }
            const prevPos = peek$(ctx, `containerPosition${i}`);
            const prevColumn = peek$(ctx, `containerColumn${i}`);
            const prevData = peek$(ctx, `containerItemData${i}`);
            if (!prevPos || pos.relativeCoordinate > POSITION_OUT_OF_VIEW && pos.top !== prevPos.top) {
              set$(ctx, `containerPosition${i}`, pos);
            }
            if (column2 >= 0 && column2 !== prevColumn) {
              set$(ctx, `containerColumn${i}`, column2);
            }
            if (prevData !== item) {
              set$(ctx, `containerItemData${i}`, data[itemIndex]);
            }
          }
        }
      }
    }
    if (!state.queuedInitialLayout && endBuffered !== null) {
      if (checkAllSizesKnown()) {
        setDidLayout();
      }
    }
    if (state.viewabilityConfigCallbackPairs) {
      updateViewableItems(
        state,
        ctx,
        state.viewabilityConfigCallbackPairs,
        getId,
        scrollLength,
        startNoBuffer,
        endNoBuffer
      );
    }
  }, []);
  const setPaddingTop = ({
    stylePaddingTop,
    alignItemsPaddingTop
  }) => {
    if (stylePaddingTop !== void 0) {
      const prevStylePaddingTop = peek$(ctx, "stylePaddingTop") || 0;
      if (stylePaddingTop < prevStylePaddingTop) {
        const prevTotalSize = peek$(ctx, "totalSizeWithScrollAdjust") || 0;
        set$(ctx, "totalSizeWithScrollAdjust", prevTotalSize + prevStylePaddingTop);
        setTimeout(() => {
          set$(ctx, "totalSizeWithScrollAdjust", prevTotalSize);
        }, 16);
      }
      set$(ctx, "stylePaddingTop", stylePaddingTop);
    }
    if (alignItemsPaddingTop !== void 0) {
      set$(ctx, "alignItemsPaddingTop", alignItemsPaddingTop);
    }
    set$(
      ctx,
      "paddingTop",
      (stylePaddingTop != null ? stylePaddingTop : peek$(ctx, "stylePaddingTop")) + (alignItemsPaddingTop != null ? alignItemsPaddingTop : peek$(ctx, "alignItemsPaddingTop"))
    );
  };
  const updateAlignItemsPaddingTop = () => {
    if (alignItemsAtEnd) {
      const { scrollLength } = refState.current;
      const contentSize = getContentSize(ctx);
      const paddingTop = Math.max(0, Math.floor(scrollLength - contentSize));
      setPaddingTop({ alignItemsPaddingTop: paddingTop });
    }
  };
  const finishScrollTo = () => {
    const state = refState.current;
    if (state) {
      state.scrollingToOffset = void 0;
      state.scrollAdjustHandler.setDisableAdjust(false);
      state.scrollHistory.length = 0;
      calculateItemsInView();
    }
  };
  const scrollTo = (offset, animated) => {
    let _a;
    const state = refState.current;
    state.scrollAdjustHandler.setDisableAdjust(true);
    state.scrollHistory.length = 0;
    state.scrollingToOffset = offset;
    (_a = refScroller.current) == null ? void 0 : _a.scrollTo({
      x: horizontal ? offset : 0,
      y: horizontal ? 0 : offset,
      animated: !!animated
    });
    if (!animated) {
      requestAnimationFrame(finishScrollTo);
    }
  };
  const doMaintainScrollAtEnd = (animated) => {
    const state = refState.current;
    if ((state == null ? void 0 : state.isAtBottom) && maintainScrollAtEnd && peek$(ctx, "containersDidLayout")) {
      const paddingTop = peek$(ctx, "alignItemsPaddingTop");
      if (paddingTop > 0) {
        state.scroll = 0;
      }
      state.disableScrollJumpsFrom = void 0;
      requestAnimationFrame(() => {
        let _a;
        state.maintainingScrollAtEnd = true;
        (_a = refScroller.current) == null ? void 0 : _a.scrollToEnd({
          animated
        });
        setTimeout(
          () => {
            state.maintainingScrollAtEnd = false;
          },
          0
        );
      });
      return true;
    }
  };
  const checkThreshold = (distance, atThreshold, threshold, isReached, isBlockedByTimer, onReached, blockTimer) => {
    const distanceAbs = Math.abs(distance);
    const isAtThreshold = atThreshold || distanceAbs < threshold;
    if (!isReached && !isBlockedByTimer) {
      if (isAtThreshold) {
        onReached == null ? void 0 : onReached(distance);
        blockTimer == null ? void 0 : blockTimer(true);
        setTimeout(() => {
          blockTimer == null ? void 0 : blockTimer(false);
        }, 700);
        return true;
      }
    } else {
      if (distance >= 1.3 * threshold) {
        return false;
      }
    }
    return isReached;
  };
  const checkAtBottom = () => {
    if (!refState.current) {
      return;
    }
    const { queuedInitialLayout, scrollLength, scroll, maintainingScrollAtEnd } = refState.current;
    const contentSize = getContentSize(ctx);
    if (contentSize > 0 && queuedInitialLayout && !maintainingScrollAtEnd) {
      const distanceFromEnd = contentSize - scroll - scrollLength;
      const distanceFromEndAbs = Math.abs(distanceFromEnd);
      const isContentLess = contentSize < scrollLength;
      refState.current.isAtBottom = isContentLess || distanceFromEndAbs < scrollLength * maintainScrollAtEndThreshold;
      refState.current.isEndReached = checkThreshold(
        distanceFromEnd,
        isContentLess,
        onEndReachedThreshold * scrollLength,
        refState.current.isEndReached,
        refState.current.endReachedBlockedByTimer,
        (distance) => {
          let _a, _b;
          return (_b = (_a = callbacks.current).onEndReached) == null ? void 0 : _b.call(_a, { distanceFromEnd: distance });
        },
        (block) => {
          refState.current.endReachedBlockedByTimer = block;
        }
      );
    }
  };
  const checkAtTop = () => {
    if (!refState.current) {
      return;
    }
    const { scrollLength, scroll } = refState.current;
    const distanceFromTop = scroll;
    refState.current.isAtTop = distanceFromTop <= 0;
    refState.current.isStartReached = checkThreshold(
      distanceFromTop,
      false,
      onStartReachedThreshold * scrollLength,
      refState.current.isStartReached,
      refState.current.startReachedBlockedByTimer,
      (distance) => {
        let _a, _b;
        return (_b = (_a = callbacks.current).onStartReached) == null ? void 0 : _b.call(_a, { distanceFromStart: distance });
      },
      (block) => {
        refState.current.startReachedBlockedByTimer = block;
      }
    );
  };
  const checkResetContainers = (isFirst2) => {
    const state = refState.current;
    if (state) {
      state.data = dataProp;
      if (!isFirst2) {
        const totalSizeBefore = state.previousTotalSize;
        const totalSizeAfter = state.totalSize;
        const scrollDiff = state.scroll - state.scrollPrev;
        const sizeDiff = totalSizeAfter - totalSizeBefore;
        if (Math.abs(scrollDiff - sizeDiff) < 10) {
          disableScrollJumps(1e3);
        }
        const numContainers = peek$(ctx, "numContainers");
        for (let i = 0; i < numContainers; i++) {
          const itemKey = peek$(ctx, `containerItemKey${i}`);
          if (!keyExtractorProp || itemKey && state.indexByKey.get(itemKey) === void 0) {
            set$(ctx, `containerItemKey${i}`, void 0);
            set$(ctx, `containerItemData${i}`, void 0);
            set$(ctx, `containerPosition${i}`, ANCHORED_POSITION_OUT_OF_VIEW);
            set$(ctx, `containerColumn${i}`, -1);
          }
        }
        if (!keyExtractorProp) {
          state.positions.clear();
        }
        calculateItemsInView(
          /*isReset*/
          true
        );
        const didMaintainScrollAtEnd = doMaintainScrollAtEnd(false);
        if (!didMaintainScrollAtEnd && dataProp.length > state.data.length) {
          state.isEndReached = false;
        }
        if (!didMaintainScrollAtEnd) {
          checkAtTop();
          checkAtBottom();
        }
      }
    }
  };
  const calcTotalSizesAndPositions = ({ forgetPositions = false }) => {
    let _a, _b;
    const state = refState.current;
    let totalSize = 0;
    let totalSizeBelowIndex = 0;
    const indexByKey = /* @__PURE__ */ new Map();
    const newPositions = /* @__PURE__ */ new Map();
    let column = 1;
    let maxSizeInRow = 0;
    const numColumns = (_a = peek$(ctx, "numColumns")) != null ? _a : numColumnsProp;
    if (!state) {
      return;
    }
    for (let i = 0; i < dataProp.length; i++) {
      const key = getId(i);
      if (__DEV__) {
        if (indexByKey.has(key)) {
          console.error(
            `[legend-list] Error: Detected overlapping key (${key}) which causes missing items and gaps and other terrrible things. Check that keyExtractor returns unique values.`
          );
        }
      }
      indexByKey.set(key, i);
      if (!forgetPositions && state.positions.get(key) != null && state.indexByKey.get(key) === i) {
        newPositions.set(key, state.positions.get(key));
      }
    }
    state.indexByKey = indexByKey;
    state.positions = newPositions;
    if (!forgetPositions && !isFirst) {
      if (maintainVisibleContentPosition) {
        if (state.anchorElement == null || indexByKey.get(state.anchorElement.id) == null) {
          if (dataProp.length) {
            const newAnchorElement = {
              coordinate: 0,
              id: getId(0)
            };
            state.anchorElement = newAnchorElement;
            (_b = state.belowAnchorElementPositions) == null ? void 0 : _b.clear();
            scrollTo(0, false);
            setTimeout(() => {
              calculateItemsInView(
                /*reset*/
                true
              );
            }, 0);
          } else {
            state.startBufferedId = void 0;
          }
        }
      } else {
        if (state.startBufferedId != null && newPositions.get(state.startBufferedId) == null) {
          if (dataProp.length) {
            state.startBufferedId = getId(0);
          } else {
            state.startBufferedId = void 0;
          }
          scrollTo(0, false);
          setTimeout(() => {
            calculateItemsInView(
              /*reset*/
              true
            );
          }, 0);
        }
      }
    }
    const anchorElementIndex = getAnchorElementIndex();
    for (let i = 0; i < dataProp.length; i++) {
      const key = getId(i);
      const size = getItemSize(key, i, dataProp[i]);
      maxSizeInRow = Math.max(maxSizeInRow, size);
      column++;
      if (column > numColumns) {
        if (maintainVisibleContentPosition && anchorElementIndex !== void 0 && i < anchorElementIndex) {
          totalSizeBelowIndex += maxSizeInRow;
        }
        totalSize += maxSizeInRow;
        column = 1;
        maxSizeInRow = 0;
      }
    }
    if (maxSizeInRow > 0) {
      totalSize += maxSizeInRow;
    }
    state.ignoreScrollFromCalcTotal = true;
    requestAnimationFrame(() => {
      state.ignoreScrollFromCalcTotal = false;
    });
    addTotalSize(null, totalSize, totalSizeBelowIndex);
  };
  const findAvailableContainers = (numNeeded, startBuffered, endBuffered) => {
    const state = refState.current;
    const numContainers = peek$(ctx, "numContainers");
    if (numNeeded === 0) return [];
    const result = [];
    const availableContainers = [];
    for (let u = 0; u < numContainers; u++) {
      const key = peek$(ctx, `containerItemKey${u}`);
      if (key === void 0) {
        result.push(u);
        if (result.length >= numNeeded) {
          return result;
        }
      }
    }
    for (let u = 0; u < numContainers; u++) {
      const key = peek$(ctx, `containerItemKey${u}`);
      if (key === void 0) continue;
      const index = state.indexByKey.get(key);
      if (index < startBuffered) {
        availableContainers.push({ index: u, distance: startBuffered - index });
      } else if (index > endBuffered) {
        availableContainers.push({ index: u, distance: index - endBuffered });
      }
    }
    const remaining = numNeeded - result.length;
    if (remaining > 0) {
      if (availableContainers.length > 0) {
        if (availableContainers.length > remaining) {
          availableContainers.sort(comparatorByDistance);
          availableContainers.length = remaining;
        }
        for (const container of availableContainers) {
          result.push(container.index);
        }
      }
      const stillNeeded = numNeeded - result.length;
      if (stillNeeded > 0) {
        for (let i = 0; i < stillNeeded; i++) {
          result.push(numContainers + i);
        }
        if (__DEV__ && numContainers + stillNeeded > peek$(ctx, "numContainersPooled")) {
          console.warn(
            "[legend-list] No unused container available, so creating one on demand. This can be a minor performance issue and is likely caused by the estimatedItemSize being too large. Consider decreasing estimatedItemSize or increasing initialContainerPoolRatio.",
            {
              debugInfo: {
                numContainers,
                numNeeded,
                stillNeeded,
                numContainersPooled: peek$(ctx, "numContainersPooled")
              }
            }
          );
        }
      }
    }
    return result.sort(comparatorDefault);
  };
  const isFirst = !refState.current.renderItem;
  const memoizedLastItemKeys = React2.useMemo(() => {
    if (!dataProp.length) return [];
    return Array.from(
      { length: Math.min(numColumnsProp, dataProp.length) },
      (_, i) => getId(dataProp.length - 1 - i)
    );
  }, [dataProp, numColumnsProp]);
  const initalizeStateVars = () => {
    set$(ctx, "lastItemKeys", memoizedLastItemKeys);
    set$(ctx, "numColumns", numColumnsProp);
    const prevPaddingTop = peek$(ctx, "stylePaddingTop");
    setPaddingTop({ stylePaddingTop: stylePaddingTopState });
    const paddingDiff = stylePaddingTopState - prevPaddingTop;
    if (paddingDiff && prevPaddingTop !== void 0 && reactNative.Platform.OS === "ios") {
      queueMicrotask(() => {
        scrollTo(refState.current.scroll + paddingDiff, false);
      });
    }
  };
  if (isFirst) {
    initalizeStateVars();
  }
  if (isFirst || didDataChange || numColumnsProp !== peek$(ctx, "numColumns")) {
    refState.current.lastBatchingAction = Date.now();
    if (!keyExtractorProp && !isFirst && didDataChange) {
      __DEV__ && warnDevOnce(
        "keyExtractor",
        "Changing data without a keyExtractor can cause slow performance and resetting scroll. If your list data can change you should use a keyExtractor with a unique id for best performance and behavior."
      );
      refState.current.sizes.clear();
      refState.current.positions.clear();
    }
    refState.current.previousTotalSize = peek$(ctx, "totalSize");
    calcTotalSizesAndPositions({ forgetPositions: false });
  }
  React2.useEffect(() => {
    const didAllocateContainers = doInitialAllocateContainers();
    if (!didAllocateContainers) {
      checkResetContainers(
        /*isFirst*/
        isFirst
      );
    }
  }, [dataProp, numColumnsProp]);
  React2.useEffect(() => {
    set$(ctx, "extraData", extraData);
  }, [extraData]);
  refState.current.renderItem = renderItem;
  React2.useEffect(initalizeStateVars, [memoizedLastItemKeys.join(","), numColumnsProp, stylePaddingTopState]);
  const getRenderedItem = React2.useCallback((key) => {
    let _a, _b;
    const state = refState.current;
    if (!state) {
      return null;
    }
    const { data, indexByKey } = state;
    const index = indexByKey.get(key);
    if (index === void 0) {
      return null;
    }
    const renderedItem = (_b = (_a = refState.current).renderItem) == null ? void 0 : _b.call(_a, {
      item: data[index],
      index,
      extraData: peek$(ctx, "extraData")
    });
    return { index, item: data[index], renderedItem };
  }, []);
  const doInitialAllocateContainers = () => {
    const state = refState.current;
    const { scrollLength, data } = state;
    if (scrollLength > 0 && data.length > 0 && !peek$(ctx, "numContainers")) {
      const averageItemSize = getEstimatedItemSize ? getEstimatedItemSize(0, data[0]) : estimatedItemSize;
      const numContainers = Math.ceil((scrollLength + scrollBuffer * 2) / averageItemSize) * numColumnsProp;
      for (let i = 0; i < numContainers; i++) {
        set$(ctx, `containerPosition${i}`, ANCHORED_POSITION_OUT_OF_VIEW);
        set$(ctx, `containerColumn${i}`, -1);
      }
      set$(ctx, "numContainers", numContainers);
      set$(ctx, "numContainersPooled", numContainers * initialContainerPoolRatio);
      if (initialScrollIndex) {
        requestAnimationFrame(() => {
          calculateItemsInView(
            /*isReset*/
            true
          );
        });
      } else {
        calculateItemsInView(
          /*isReset*/
          true
        );
      }
      return true;
    }
  };
  React2.useEffect(() => {
    const state = refState.current;
    const viewability = setupViewability({
      viewabilityConfig,
      viewabilityConfigCallbackPairs,
      onViewableItemsChanged
    });
    state.viewabilityConfigCallbackPairs = viewability;
    state.enableScrollForNextCalculateItemsInView = !viewability;
  }, [viewabilityConfig, viewabilityConfigCallbackPairs, onViewableItemsChanged]);
  useInit(() => {
    doInitialAllocateContainers();
  });
  const updateItemSize = React2.useCallback(
    (itemKey, sizeObj, fromFixGaps) => {
      const state = refState.current;
      const {
        sizes,
        indexByKey,
        sizesKnown,
        data,
        rowHeights,
        startBuffered,
        endBuffered,
        averageSizes,
        queuedInitialLayout
      } = state;
      if (!data) {
        return;
      }
      const index = indexByKey.get(itemKey);
      const numColumns = peek$(ctx, "numColumns");
      state.scrollForNextCalculateItemsInView = void 0;
      state.minIndexSizeChanged = state.minIndexSizeChanged !== void 0 ? Math.min(state.minIndexSizeChanged, index) : index;
      const prevSize = getItemSize(itemKey, index, data);
      const prevSizeKnown = sizesKnown.get(itemKey);
      let needsCalculate = false;
      let needsUpdateContainersDidLayout = false;
      const size = Math.floor((horizontal ? sizeObj.width : sizeObj.height) * 8) / 8;
      sizesKnown.set(itemKey, size);
      const itemType = "";
      let averages = averageSizes[itemType];
      if (!averages) {
        averages = averageSizes[itemType] = {
          num: 0,
          avg: 0
        };
      }
      averages.avg = (averages.avg * averages.num + size) / (averages.num + 1);
      averages.num++;
      if (!prevSize || Math.abs(prevSize - size) > 0.1) {
        let diff;
        needsCalculate = true;
        if (numColumns > 1) {
          const rowNumber = Math.floor(index / numColumnsProp);
          const prevSizeInRow = getRowHeight(rowNumber);
          sizes.set(itemKey, size);
          rowHeights.delete(rowNumber);
          const sizeInRow = getRowHeight(rowNumber);
          diff = sizeInRow - prevSizeInRow;
        } else {
          sizes.set(itemKey, size);
          diff = size - prevSize;
        }
        if (__DEV__ && suggestEstimatedItemSize) {
          if (state.timeoutSizeMessage) {
            clearTimeout(state.timeoutSizeMessage);
          }
          state.timeoutSizeMessage = setTimeout(() => {
            state.timeoutSizeMessage = void 0;
            const num = sizesKnown.size;
            const avg = state.averageSizes[""].avg;
            console.warn(
              `[legend-list] estimatedItemSize or getEstimatedItemSize are not defined. Based on the ${num} items rendered so far, the optimal estimated size is ${avg}.`
            );
          }, 1e3);
        }
        state.scrollForNextCalculateItemsInView = void 0;
        addTotalSize(itemKey, diff, 0);
        if (prevSizeKnown !== void 0 && Math.abs(prevSizeKnown - size) > 5) {
          doMaintainScrollAtEnd(false);
        }
        if (onItemSizeChanged) {
          onItemSizeChanged({
            size,
            previous: prevSize,
            index,
            itemKey,
            itemData: data[index]
          });
        }
      }
      if (!queuedInitialLayout && checkAllSizesKnown()) {
        needsUpdateContainersDidLayout = true;
      }
      let isInView = index >= startBuffered && index <= endBuffered;
      if (!isInView) {
        const numContainers = ctx.values.get("numContainers");
        for (let i = 0; i < numContainers; i++) {
          if (peek$(ctx, `containerItemKey${i}`) === itemKey) {
            isInView = true;
            break;
          }
        }
      }
      if (needsUpdateContainersDidLayout || !fromFixGaps && needsCalculate && (isInView || !queuedInitialLayout)) {
        const scrollVelocity = state.scrollVelocity;
        let didCalculate = false;
        if ((Number.isNaN(scrollVelocity) || Math.abs(scrollVelocity) < 1 || state.scrollingToOffset !== void 0) && (!waitForInitialLayout || needsUpdateContainersDidLayout || queuedInitialLayout)) {
          if (Date.now() - state.lastBatchingAction < 500) {
            if (!state.queuedCalculateItemsInView) {
              state.queuedCalculateItemsInView = requestAnimationFrame(() => {
                state.queuedCalculateItemsInView = void 0;
                calculateItemsInView();
              });
            }
          } else {
            calculateItemsInView();
            didCalculate = true;
          }
        }
        if (!didCalculate && !needsUpdateContainersDidLayout && IsNewArchitecture) {
          fixGaps();
        }
      }
      if (state.needsOtherAxisSize) {
        const otherAxisSize = horizontal ? sizeObj.height : sizeObj.width;
        const cur = peek$(ctx, "otherAxisSize");
        if (!cur || otherAxisSize > cur) {
          set$(ctx, "otherAxisSize", otherAxisSize);
        }
      }
    },
    []
  );
  const handleLayout = React2.useCallback((scrollLength) => {
    const state = refState.current;
    const didChange = scrollLength !== state.scrollLength;
    state.scrollLength = scrollLength;
    state.lastBatchingAction = Date.now();
    state.scrollForNextCalculateItemsInView = void 0;
    doInitialAllocateContainers();
    doMaintainScrollAtEnd(false);
    updateAlignItemsPaddingTop();
    checkAtBottom();
    checkAtTop();
    if (didChange) {
      calculateItemsInView();
    }
  }, []);
  const onLayout = React2.useCallback((event) => {
    const scrollLength = event.nativeEvent.layout[horizontal ? "width" : "height"];
    handleLayout(scrollLength);
    const otherAxisSize = event.nativeEvent.layout[horizontal ? "height" : "width"];
    if (refState.current) {
      refState.current.needsOtherAxisSize = otherAxisSize - (stylePaddingTopState || 0) < 10;
    }
    if (__DEV__ && scrollLength === 0) {
      warnDevOnce(
        "height0",
        `List ${horizontal ? "width" : "height"} is 0. You may need to set a style or \`flex: \` for the list, because children are absolutely positioned.`
      );
    }
    if (onLayoutProp) {
      onLayoutProp(event);
    }
  }, []);
  if (IsNewArchitecture) {
    React2.useLayoutEffect(() => {
      let _a, _b;
      const measured = (_b = (_a = refScroller.current) == null ? void 0 : _a.unstable_getBoundingClientRect) == null ? void 0 : _b.call(_a);
      if (measured) {
        const size = Math.floor(measured[horizontal ? "width" : "height"] * 8) / 8;
        if (size) {
          handleLayout(size);
        }
      }
    }, []);
  }
  const handleScroll = React2.useCallback(
    (event) => {
      let _a, _b, _c, _d;
      if (((_b = (_a = event.nativeEvent) == null ? void 0 : _a.contentSize) == null ? void 0 : _b.height) === 0 && ((_c = event.nativeEvent.contentSize) == null ? void 0 : _c.width) === 0) {
        return;
      }
      const state = refState.current;
      const newScroll = event.nativeEvent.contentOffset[horizontal ? "x" : "y"];
      state.scrollPending = newScroll;
      if (state.ignoreScrollFromCalcTotal && newScroll !== 0) {
        return;
      }
      updateScroll(newScroll);
      (_d = state.onScroll) == null ? void 0 : _d.call(state, event);
    },
    []
  );
  const updateScroll = React2.useCallback((newScroll) => {
    const state = refState.current;
    const scrollingToOffset = state.scrollingToOffset;
    if (scrollingToOffset !== void 0 && Math.abs(newScroll - scrollingToOffset) < 10) {
      finishScrollTo();
    }
    if (state.disableScrollJumpsFrom !== void 0) {
      const scrollMinusAdjust = newScroll - state.scrollAdjustHandler.getAppliedAdjust();
      if (Math.abs(scrollMinusAdjust - state.disableScrollJumpsFrom) > 200) {
        return;
      }
      state.disableScrollJumpsFrom = void 0;
    }
    state.hasScrolled = true;
    state.lastBatchingAction = Date.now();
    const currentTime = performance.now();
    if (scrollingToOffset === void 0 && !(state.scrollHistory.length === 0 && newScroll === initialContentOffset)) {
      state.scrollHistory.push({ scroll: newScroll, time: currentTime });
    }
    if (state.scrollHistory.length > 5) {
      state.scrollHistory.shift();
    }
    if (state.scrollTimer !== void 0) {
      clearTimeout(state.scrollTimer);
    }
    state.scrollTimer = setTimeout(() => {
      state.scrollVelocity = 0;
    }, 500);
    let velocity = 0;
    if (state.scrollHistory.length >= 2) {
      const newest = state.scrollHistory[state.scrollHistory.length - 1];
      let oldest;
      for (let i = 0; i < state.scrollHistory.length - 1; i++) {
        const entry = state.scrollHistory[i];
        if (newest.time - entry.time <= 100) {
          oldest = entry;
          break;
        }
      }
      if (oldest) {
        const scrollDiff = newest.scroll - oldest.scroll;
        const timeDiff = newest.time - oldest.time;
        velocity = timeDiff > 0 ? scrollDiff / timeDiff : 0;
      }
    }
    state.scrollPrev = state.scroll;
    state.scrollPrevTime = state.scrollTime;
    state.scroll = newScroll;
    state.scrollTime = currentTime;
    state.scrollVelocity = velocity;
    calculateItemsInView();
    checkAtBottom();
    checkAtTop();
  }, []);
  React2.useImperativeHandle(
    forwardedRef,
    () => {
      const scrollIndexIntoView = (options) => {
        if (refState.current) {
          const { index, ...rest2 } = options;
          const { startNoBuffer, endNoBuffer } = refState.current;
          if (index < startNoBuffer || index > endNoBuffer) {
            const viewPosition = index < startNoBuffer ? 0 : 1;
            scrollToIndex({
              ...rest2,
              viewPosition,
              index
            });
          }
        }
      };
      return {
        flashScrollIndicators: () => refScroller.current.flashScrollIndicators(),
        getNativeScrollRef: () => refScroller.current,
        getScrollableNode: () => refScroller.current.getScrollableNode(),
        getScrollResponder: () => refScroller.current.getScrollResponder(),
        getState: () => {
          const state = refState.current;
          return state ? {
            contentLength: state.totalSize,
            end: state.endNoBuffer,
            endBuffered: state.endBuffered,
            isAtEnd: state.isAtBottom,
            isAtStart: state.isAtTop,
            scroll: state.scroll,
            scrollLength: state.scrollLength,
            start: state.startNoBuffer,
            startBuffered: state.startBuffered
          } : {};
        },
        scrollIndexIntoView,
        scrollItemIntoView: ({ item, ...props2 }) => {
          const { data } = refState.current;
          const index = data.indexOf(item);
          if (index !== -1) {
            scrollIndexIntoView({ index, ...props2 });
          }
        },
        scrollToIndex,
        scrollToItem: ({ item, ...props2 }) => {
          const { data } = refState.current;
          const index = data.indexOf(item);
          if (index !== -1) {
            scrollToIndex({ index, ...props2 });
          }
        },
        scrollToOffset: ({ offset, animated }) => {
          scrollTo(offset, animated);
        },
        scrollToEnd: (options) => refScroller.current.scrollToEnd(options)
      };
    },
    []
  );
  if (reactNative.Platform.OS === "web") {
    React2.useEffect(() => {
      let _a;
      if (initialContentOffset) {
        (_a = refState.current) == null ? void 0 : _a.scrollAdjustHandler.setDisableAdjust(true);
        scrollTo(initialContentOffset, false);
        setTimeout(() => {
          let _a2;
          (_a2 = refState.current) == null ? void 0 : _a2.scrollAdjustHandler.setDisableAdjust(false);
        }, 0);
      }
    }, []);
  }
  return /* @__PURE__ */ React2__namespace.createElement(React2__namespace.Fragment, null, /* @__PURE__ */ React2__namespace.createElement(
    ListComponent,
    {
      ...rest,
      horizontal,
      refScrollView: combinedRef,
      initialContentOffset,
      getRenderedItem,
      updateItemSize,
      handleScroll,
      onMomentumScrollEnd: (event) => {
        let _a;
        const scrollingToOffset = (_a = refState.current) == null ? void 0 : _a.scrollingToOffset;
        if (scrollingToOffset !== void 0) {
          requestAnimationFrame(() => {
            scrollTo(scrollingToOffset, false);
            refState.current.scrollingToOffset = void 0;
            requestAnimationFrame(() => {
              refState.current.scrollAdjustHandler.setDisableAdjust(false);
            });
          });
        }
        const wasPaused = refState.current.scrollAdjustHandler.unPauseAdjust();
        if (wasPaused) {
          refState.current.scrollVelocity = 0;
          refState.current.scrollHistory = [];
          calculateItemsInView();
        }
        if (onMomentumScrollEnd) {
          onMomentumScrollEnd(event);
        }
      },
      onLayout,
      recycleItems,
      alignItemsAtEnd,
      ListEmptyComponent: dataProp.length === 0 ? ListEmptyComponent : void 0,
      maintainVisibleContentPosition,
      scrollEventThrottle: reactNative.Platform.OS === "web" ? 16 : void 0,
      waitForInitialLayout,
      refreshControl: refreshControl != null ? refreshControl : onRefresh && /* @__PURE__ */ React2__namespace.createElement(
        reactNative.RefreshControl,
        {
          refreshing: !!refreshing,
          onRefresh,
          progressViewOffset
        }
      ),
      style,
      contentContainerStyle
    }
  ), __DEV__ && ENABLE_DEBUG_VIEW);
});

exports.LegendList = LegendList;
exports.useIsLastItem = useIsLastItem;
exports.useLeanViewContext = useLeanViewContext;
exports.useRecyclingEffect = useRecyclingEffect;
exports.useRecyclingState = useRecyclingState;
exports.useViewability = useViewability;
exports.useViewabilityAmount = useViewabilityAmount;
