import { NativeModule, requireNativeModule } from 'expo';

declare class GenytVideoPlayerModule extends NativeModule<{}> {
  hello(): string;
  enterPiP(): void;
}

export default requireNativeModule<GenytVideoPlayerModule>('GenytVideoPlayer');
