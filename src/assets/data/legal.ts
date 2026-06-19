export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export const termsData: LegalDocument = {
  title: 'Terms of Service',
  lastUpdated: 'June 2026',
  sections: [
    {
      title: '1. Acceptance & Purpose',
      paragraphs: [
        'Welcome to GenYT Pro. By using this application, you agree to these terms. We built this tool to give users a clean, private, and efficient way to interact with publicly available media. If you don\'t agree with these terms, please uninstall the app.',
      ],
    },
    {
      title: '2. Unofficial Client Disclaimer',
      paragraphs: [
        'GenYT Pro is an independent, unofficial client. It acts strictly as a web parser that processes publicly available links. We do not host, store, or distribute any media. We are completely independent and are not affiliated with, endorsed by, or connected to Google LLC, YouTube, or any other media platform.',
      ],
    },
    {
      title: '3. Copyright & Fair Use',
      paragraphs: [
        'GenYT Pro is merely a tool. You are solely responsible for how you use it. You agree to only download content for which you have the legal right to do so—such as your own content, public domain media, or under "Fair Use" (e.g., personal offline viewing or study).',
        'You must respect the intellectual property rights of creators. The developers of GenYT Pro do not encourage or condone copyright infringement and bear zero liability for what users choose to download or how they use those files.',
      ],
    },
    {
      title: '4. Service Availability',
      paragraphs: [
        'Because GenYT Pro relies on third-party public architectures, we cannot guarantee that the service will always work perfectly. If external platforms change their code, features in this app might break temporarily or permanently. The app is provided "as is" without any warranties.',
      ],
    },
  ],
};

export const privacyData: LegalDocument = {
  title: 'Privacy Policy',
  lastUpdated: 'June 2026',
  sections: [
    {
      title: '1. Your Data Stays Yours',
      paragraphs: [
        'We believe in extreme privacy. GenYT Pro operates on a strict "local-first" architecture. We don\'t have servers, we don\'t ask you to create an account, and we don\'t have a database in the cloud. Everything—from your search history and watch progress to your saved playlists—is stored securely and exclusively on your own device.',
      ],
    },
    {
      title: '2. Zero Telemetry & Tracking',
      paragraphs: [
        'We don\'t know who you are, what you search for, what you watch, or what you download. We have intentionally excluded all telemetry, crash reporting, and analytics trackers. Because our source code is public, anyone can verify that no secret tracking is happening in the background.',
      ],
    },
    {
      title: '3. Direct Connections',
      paragraphs: [
        'When you use GenYT Pro to search or watch a video, your phone connects directly to the third-party media servers (like YouTube). We do not route your traffic through any middlemen or proxy servers. Please note that these third-party platforms may log your IP address according to their own privacy policies.',
      ],
    },
    {
      title: '4. Device Permissions',
      paragraphs: [
        'GenYT Pro only asks for permissions it absolutely needs to function. For example, it requires Storage permission to save the videos and audio you choose to download directly into your phone\'s local folders.',
      ],
    },
  ],
};
