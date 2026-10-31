import { GitHubRepo, GitHubFile, GitHubUserProfile } from '../shared/types';

export class GitHubService {
  private defaultHeaders(token?: string) {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'DevLens-Code-Analyzer'
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    return headers;
  }

  public async getUserProfile(token?: string, username?: string): Promise<GitHubUserProfile> {
    const url = token 
      ? 'https://api.github.com/user' 
      : `https://api.github.com/users/${encodeURIComponent(username || 'supre')}`;

    const response = await fetch(url, { headers: this.defaultHeaders(token) });
    if (!response.ok) {
      throw new Error(`GitHub Profile error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    return {
      login: data.login,
      name: data.name || data.login,
      avatar_url: data.avatar_url,
      html_url: data.html_url,
      bio: data.bio || undefined,
      public_repos: data.public_repos || 0,
      total_private_repos: data.total_private_repos || 0
    };
  }

  public async getUserRepos(username?: string, token?: string): Promise<GitHubRepo[]> {
    // If token is provided and no specific different username is queried, fetch all authenticated repos (including private)
    let url: string;
    if (token && (!username || username === 'me')) {
      url = 'https://api.github.com/user/repos?sort=updated&per_page=40&affiliation=owner,collaborator';
    } else {
      const targetUser = username || 'supre';
      url = `https://api.github.com/users/${encodeURIComponent(targetUser)}/repos?sort=updated&per_page=40`;
    }

    const response = await fetch(url, { headers: this.defaultHeaders(token) });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.map((r: any) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      default_branch: r.default_branch,
      html_url: r.html_url,
      isPrivate: Boolean(r.private)
    }));
  }

  public async getRepoContents(owner: string, repo: string, path: string = '', token?: string): Promise<GitHubFile[]> {
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}`;
    const response = await fetch(url, { headers: this.defaultHeaders(token) });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    if (!Array.isArray(data)) {
      return [{
        name: data.name,
        path: data.path,
        type: data.type,
        size: data.size,
        download_url: data.download_url
      }];
    }

    return data
      .filter((item: any) => {
        // Only return directories or supported code files
        if (item.type === 'dir') return true;
        const ext = item.name.split('.').pop()?.toLowerCase();
        return ['js', 'ts', 'jsx', 'tsx', 'py', 'cpp', 'c', 'java', 'go', 'rs', 'json'].includes(ext || '');
      })
      .map((item: any) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
        download_url: item.download_url
      }));
  }

  public async getRawFileContent(downloadUrl: string, token?: string): Promise<string> {
    const response = await fetch(downloadUrl, { headers: this.defaultHeaders(token) });
    if (!response.ok) {
      throw new Error(`Failed to download raw file content: ${response.status}`);
    }
    return await response.text();
  }
}

export const githubService = new GitHubService();
