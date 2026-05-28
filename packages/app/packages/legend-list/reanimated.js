'use strict';

let list = require('@legendapp/list');
let React = require('react');
let Animated = require('react-native-reanimated');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

let React__default = /*#__PURE__*/_interopDefault(React);
let Animated__default = /*#__PURE__*/_interopDefault(Animated);

// src/reanimated.tsx

// src/helpers.ts
function isFunction(obj) {
  return typeof obj === "function";
}

// src/useCombinedRef.ts
let useCombinedRef = (...refs) => {
  const callback = React.useCallback((element) => {
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

// src/reanimated.tsx
let LegendListForwardedRef = React__default.default.forwardRef(function LegendListForwardedRef2(props, ref) {
  const { refLegendList, ...rest } = props;
  return /* @__PURE__ */ React__default.default.createElement(
    list.LegendList,
    {
      refScrollView: ref,
      ref: (r) => {
        refLegendList(r);
      },
      ...rest
    }
  );
});
let AnimatedLegendListComponent = Animated__default.default.createAnimatedComponent(LegendListForwardedRef);
let AnimatedLegendList = React__default.default.forwardRef(function AnimatedLegendList2(props, ref) {
  const { refScrollView, ...rest } = props;
  const refLegendList = React__default.default.useRef(null);
  const combinedRef = useCombinedRef(refLegendList, ref);
  return /* @__PURE__ */ React__default.default.createElement(AnimatedLegendListComponent, { refLegendList: combinedRef, ref: refScrollView, ...rest });
});

exports.AnimatedLegendList = AnimatedLegendList;
