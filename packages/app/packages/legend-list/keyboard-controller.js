'use strict';

let list = require('@legendapp/list');
let React = require('react');
let reactNative = require('react-native');
let reactNativeKeyboardController = require('react-native-keyboard-controller');
let reactNativeReanimated = require('react-native-reanimated');

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

let React__namespace = /*#__PURE__*/_interopNamespace(React);

// src/keyboard-controller.tsx
let typedForwardRef = React.forwardRef;
let LegendList = typedForwardRef(function LegendList2(props, forwardedRef) {
  const {
    LegendList: LegendListProp,
    contentContainerStyle: contentContainerStyleProp,
    scrollIndicatorInsets: scrollIndicatorInsetsProp,
    ...rest
  } = props;
  const [padding, setPadding] = React.useState(0);
  const updatePadding = (height) => {
    setPadding(height);
  };
  reactNativeKeyboardController.useKeyboardHandler({
    onEnd: (e) => {
      "worklet";
      reactNativeReanimated.runOnJS(updatePadding)(e.height);
    }
  });
  const LegendListComponent = LegendListProp != null ? LegendListProp : list.LegendList;
  const contentContainerStyleFlattened = reactNative.StyleSheet.flatten(contentContainerStyleProp) || {};
  const contentContainerStyle = { ...contentContainerStyleFlattened, paddingTop: padding };
  const scrollIndicatorInsets = scrollIndicatorInsetsProp ? { ...scrollIndicatorInsetsProp } : {};
  if (!props.horizontal) {
    scrollIndicatorInsets.top = ((scrollIndicatorInsets == null ? void 0 : scrollIndicatorInsets.top) || 0) + padding;
  }
  return (
    // @ts-expect-error TODO: Fix this type
    /* @__PURE__ */ React__namespace.createElement(
      LegendListComponent,
      {
        ...rest,
        contentContainerStyle,
        scrollIndicatorInsets,
        ref: forwardedRef
      }
    )
  );
});

exports.LegendList = LegendList;
