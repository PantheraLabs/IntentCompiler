/**
 * Repository Analyzer - Fetches and analyzes GitHub repositories for context
 */

export interface RepoContext {
  name: string;
  description: string;
  language: string;
  languages: Record<string, number>;
  techStack: string[];
  fileStructure: FileNode[];
  readme: string;
  existingDocs: string[];
  hasCI: boolean;
  hasDocker: boolean;
  isPrivate: boolean;
  size: number;
  stars: number;
  updatedAt: string;
}

interface GitHubRepoMeta {
  name: string;
  description: string | null;
  language: string | null;
  private: boolean;
  size: number;
  stargazers_count: number;
  updated_at: string;
}

export interface FileNode {
  name: string;
  type: "file" | "dir";
  path: string;
  size?: number;
}

/**
 * Parse GitHub URL to extract owner and repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/\?]+)/i,
    /github\.com\/([^\/]+)\/([^\/\?]+)\.git/i
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  }
  
  return null;
}

/**
 * Analyze repository and extract context
 */
export async function analyzeRepository(
  url: string,
  githubToken?: string
): Promise<RepoContext> {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error("Invalid GitHub URL format");
  }
  
  const { owner, repo } = parsed;
  
  // Fetch repository metadata
  const metadata = await fetchRepoMetadata(owner, repo, githubToken);
  
  // Fetch file structure
  const fileStructure = await fetchRepoContents(owner, repo, "", githubToken);
  
  // Extract info
  const techStack = extractTechStack(metadata.language ?? "", fileStructure);
  const existingDocs = findDocumentationFiles(fileStructure);
  const hasCI = hasCIConfiguration(fileStructure);
  const hasDocker = hasDockerConfiguration(fileStructure);
  
  // Fetch README
  const readme = await fetchReadme(owner, repo, fileStructure, githubToken);
  
  return {
    name: metadata.name,
    description: metadata.description ?? "",
    language: metadata.language ?? "",
    languages: {},
    techStack,
    fileStructure,
    readme,
    existingDocs,
    hasCI,
    hasDocker,
    isPrivate: metadata.private,
    size: metadata.size,
    stars: metadata.stargazers_count,
    updatedAt: metadata.updated_at
  };
}

/**
 * Fetch repository metadata from GitHub API
 */
async function fetchRepoMetadata(
  owner: string,
  repo: string,
  token?: string
): Promise<GitHubRepoMeta> {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "IntentCompiler"
  };
  
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }
  
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers
  });
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch repository contents
 */
async function fetchRepoContents(
  owner: string,
  repo: string,
  path: string = "",
  token?: string
): Promise<FileNode[]> {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "IntentCompiler"
  };
  
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }
  
  const url = path 
    ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    : `https://api.github.com/repos/${owner}/${repo}/contents`;
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    return [];
  }
  
  const data = await response.json();
  
  if (Array.isArray(data)) {
    return data.map(item => ({
      name: item.name,
      type: item.type,
      path: item.path,
      size: item.size
    }));
  }
  
  return [];
}

/**
 * Fetch file content
 */
async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  token?: string
): Promise<string> {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "IntentCompiler"
  };
  
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }
  
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers
  });
  
  if (!response.ok) {
    return "";
  }
  
  const data = await response.json();
  
  if (data.content) {
    return Buffer.from(data.content, 'base64').toString();
  }
  
  return "";
}

/**
 * Fetch README content
 */
async function fetchReadme(
  owner: string,
  repo: string,
  fileStructure: FileNode[],
  token?: string
): Promise<string> {
  const readmeNames = ["README.md", "README.rst", "README.txt", "README", "readme.md"];
  
  for (const readmeName of readmeNames) {
    const file = fileStructure.find(f => f.name === readmeName);
    if (file) {
      try {
        return await fetchFileContent(owner, repo, readmeName, token);
      } catch {
        continue;
      }
    }
  }
  
  return "";
}

/**
 * Find documentation files
 */
function findDocumentationFiles(structure: FileNode[]): string[] {
  const docs: string[] = [];
  const docPatterns = [
    "CLAUDE.md",
    ".cursorrules",
    ".windsurfrules",
    "AGENTS.md",
    "INSTRUCTIONS.md",
    "CONTRIBUTING.md",
    "ARCHITECTURE.md"
  ];
  
  for (const node of structure) {
    for (const pattern of docPatterns) {
      if (node.name === pattern || node.path.includes(pattern)) {
        docs.push(node.path);
      }
    }
  }
  
  return docs;
}

/**
 * Extract tech stack from language and files
 */
function extractTechStack(primaryLanguage: string, structure: FileNode[]): string[] {
  const techStack = new Set<string>();
  
  if (primaryLanguage) {
    techStack.add(primaryLanguage.toLowerCase());
  }
  
  // Detect from file structure
  const fileNames = structure.map(f => f.name.toLowerCase());
  
  if (fileNames.includes("package.json")) techStack.add("node.js");
  if (fileNames.includes("requirements.txt")) techStack.add("python");
  if (fileNames.includes("gemfile")) techStack.add("ruby");
  if (fileNames.includes("cargo.toml")) techStack.add("rust");
  if (fileNames.includes("go.mod")) techStack.add("go");
  if (fileNames.includes("dockerfile")) techStack.add("docker");
  if (fileNames.some(n => n.includes("docker-compose"))) techStack.add("docker-compose");
  
  return Array.from(techStack);
}

/**
 * Check for CI/CD configuration
 */
function hasCIConfiguration(structure: FileNode[]): boolean {
  const ciFiles = [
    ".github/workflows/",
    ".gitlab-ci.yml",
    "Jenkinsfile",
    "azure-pipelines.yml",
    "circle.yml",
    ".travis.yml"
  ];
  
  return ciFiles.some(pattern => 
    structure.some(node => node.path.includes(pattern))
  );
}

/**
 * Check for Docker configuration
 */
function hasDockerConfiguration(structure: FileNode[]): boolean {
  const dockerFiles = [
    "Dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
    ".dockerignore"
  ];
  
  return dockerFiles.some(file => 
    structure.some(node => node.name === file)
  );
}
