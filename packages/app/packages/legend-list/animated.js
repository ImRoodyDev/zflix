'use strict';

let list = require('@legendapp/list');
let reactNative = require('react-native');

// src/animated.tsx
let AnimatedLegendList = reactNative.Animated.createAnimatedComponent(list.LegendList);

exports.AnimatedLegendList = AnimatedLegendList;
