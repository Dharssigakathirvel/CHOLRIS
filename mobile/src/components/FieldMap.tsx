/**
 * Platform FieldMap Entry Point & Types
 * =====================================
 * Standard export declaration for TypeScript compiler resolution.
 * Metro bundler automatically resolves FieldMap.native.tsx for Android/iOS
 * and FieldMap.web.tsx for Web at runtime.
 */

import React from 'react';
import { Platform } from 'react-native';
import NativeFieldMap, { FieldMapProps } from './FieldMap.native';
import WebFieldMap from './FieldMap.web';

export type { FieldMapProps };

export default function FieldMap(props: FieldMapProps) {
  if (Platform.OS === 'web') {
    return <WebFieldMap {...props} />;
  }
  return <NativeFieldMap {...props} />;
}
