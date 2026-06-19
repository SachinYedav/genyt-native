import { NitroModules } from 'react-native-nitro-modules'

import type { YoutubeExtractor } from './specs/YoutubeExtractor.nitro'

export type {
  NativeExtractionResult,
  NativeMediaFormat,
  NativeResolvedFormat,
  NativeVideoSummary,
  YoutubeExtractor,
} from './specs/YoutubeExtractor.nitro'

export const youtubeExtractor =
  NitroModules.createHybridObject<YoutubeExtractor>('YoutubeExtractor')
