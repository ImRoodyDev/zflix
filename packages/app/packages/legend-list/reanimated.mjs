import { LegendList } from '@legendapp/list';
import React, { useCallback } from 'react';
import Animated from 'react-native-reanimated';

// src/reanimated.tsx

// src/helpers.ts
function isFunction(obj) {
  return typeof obj === "function";
}

// src/useCombinedRef.ts
var useCombinedRef = (...refs) => {
  const callback = useCallback((element) => {
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
var LegendListForwardedRef = React.forwardRef(function LegendListForwardedRef2(props, ref) {
  const { refLegendList, ...rest } = props;
  return /* @__PURE__ */ React.createElement(
    LegendList,
    {
      refScrollView: ref,
      ref: (r) => {
        refLegendList(r);
      },
      ...rest
    }
  );
});
var AnimatedLegendListComponent = Animated.createAnimatedComponent(LegendListForwardedRef);
var AnimatedLegendList = React.forwardRef(function AnimatedLegendList2(props, ref) {
  const { refScrollView, ...rest } = props;
  const refLegendList = React.useRef(null);
  const combinedRef = useCombinedRef(refLegendList, ref);
  return /* @__PURE__ */ React.createElement(AnimatedLegendListComponent, { refLegendList: combinedRef, ref: refScrollView, ...rest });
});

export { AnimatedLegendList };
