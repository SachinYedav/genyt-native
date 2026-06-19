# Downloads Service

This layer owns direct device downloads, retry policy, progress state, file-system
writes, media-library saves, and the bridge to a custom native download manager.

Do not model downloads as a local in-app library. Completed files should land in the
user-visible device destination, preferably the public Downloads folder on Android
and the platform-approved save/share destination on iOS.
