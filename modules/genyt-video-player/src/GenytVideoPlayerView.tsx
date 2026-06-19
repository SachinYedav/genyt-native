import { requireNativeView } from 'expo';
import * as React from 'react';

import { GenytVideoPlayerViewProps, GenytVideoPlayerRef } from './GenytVideoPlayer.types';

const NativeView = requireNativeView('GenytVideoPlayer');

export default React.forwardRef<GenytVideoPlayerRef, GenytVideoPlayerViewProps>(
  function GenytVideoPlayerView(props, ref) {
    return <NativeView {...props} ref={ref} />;
  }
);
