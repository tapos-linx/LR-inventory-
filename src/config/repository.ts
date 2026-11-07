export interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
  download_count: number;
  updated_at: string;
}

export interface GitHubReleaseInfo {
  tagName: string;
  name: string;
  publishedAt: string;
  htmlUrl: string;
  body: string;
  apkDownloadUrl: string;
  apkFileName: string;
  apkSizeBytes?: number;
  downloadCount?: number;
  isLiveFromGitHub: boolean;
}

export const REPOSITORY_CONFIG = {
  owner: 'tapos-cpl',
  repo: 'lr-master-ledger-studio',
  appName: 'LR Master Ledger & Inventory Studio',
  packageId: 'com.govtech.lrmasterledger',
  currentVersion: 'v2.1.0',
  defaultApkFileName: 'LR_Master_Ledger_v2.0.apk',
  get repoUrl() {
    return `https://github.com/${this.owner}/${this.repo}`;
  },
  get releasesUrl() {
    return `https://github.com/${this.owner}/${this.repo}/releases/latest`;
  },
  get actionsUrl() {
    return `https://github.com/${this.owner}/${this.repo}/actions`;
  },
  get apiLatestReleaseUrl() {
    return `https://api.github.com/repos/${this.owner}/${this.repo}/releases/latest`;
  },
  get fallbackApkDownloadUrl() {
    return `https://github.com/${this.owner}/${this.repo}/releases/latest/download/${this.defaultApkFileName}`;
  },
};

/**
 * Fetches the latest release details directly from GitHub's releases/latest API endpoint.
 * Falls back gracefully to REPOSITORY_CONFIG defaults if the repo has no published release yet or is offline.
 */
export async function fetchLatestGitHubRelease(
  customRepoUrl?: string
): Promise<GitHubReleaseInfo> {
  let owner = REPOSITORY_CONFIG.owner;
  let repo = REPOSITORY_CONFIG.repo;

  if (customRepoUrl) {
    const match = customRepoUrl.match(/github\.com\/([^/]+)\/([^/]+)/i);
    if (match) {
      owner = match[1];
      repo = match[2].replace(/\.git$/i, '');
    }
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  const fallbackHtmlUrl = `https://github.com/${owner}/${repo}/releases/latest`;
  const fallbackApkUrl = `https://github.com/${owner}/${repo}/releases/latest/download/${REPOSITORY_CONFIG.defaultApkFileName}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const data = await response.json();
    const assets: GitHubReleaseAsset[] = Array.isArray(data.assets) ? data.assets : [];
    const apkAsset =
      assets.find((a) => a.name.toLowerCase().endsWith('.apk')) || assets[0];

    return {
      tagName: data.tag_name || REPOSITORY_CONFIG.currentVersion,
      name: data.name || `${REPOSITORY_CONFIG.appName} ${data.tag_name || REPOSITORY_CONFIG.currentVersion}`,
      publishedAt: data.published_at || new Date().toISOString(),
      htmlUrl: data.html_url || fallbackHtmlUrl,
      body: data.body || 'Latest Android APK release from GitHub.',
      apkDownloadUrl: apkAsset?.browser_download_url || fallbackApkUrl,
      apkFileName: apkAsset?.name || REPOSITORY_CONFIG.defaultApkFileName,
      apkSizeBytes: apkAsset?.size,
      downloadCount: apkAsset?.download_count,
      isLiveFromGitHub: true,
    };
  } catch {
    return {
      tagName: REPOSITORY_CONFIG.currentVersion,
      name: `${REPOSITORY_CONFIG.appName} (${REPOSITORY_CONFIG.currentVersion})`,
      publishedAt: new Date().toISOString(),
      htmlUrl: fallbackHtmlUrl,
      body: 'Official Android APK release package configured via GitHub Actions CI/CD.',
      apkDownloadUrl: fallbackApkUrl,
      apkFileName: REPOSITORY_CONFIG.defaultApkFileName,
      isLiveFromGitHub: false,
    };
  }
}
