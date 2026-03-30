import { NextResponse } from "next/server";
import { analyzeRepository, parseGitHubUrl } from "@/lib/repoAnalyzer";

type AnalyzeRepoRequest = {
  repoUrl: string;
  githubToken?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AnalyzeRepoRequest;
    const { repoUrl, githubToken } = body;

    if (!repoUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }

    // Validate GitHub URL
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub URL. Please provide a valid GitHub repository URL." },
        { status: 400 }
      );
    }

    // Analyze repository
    const repoContext = await analyzeRepository(repoUrl, githubToken);

    // Prepare response
    const response = {
      success: true,
      repository: {
        name: repoContext.name,
        description: repoContext.description,
        language: repoContext.language,
        techStack: repoContext.techStack,
        stars: repoContext.stars,
        size: repoContext.size,
        updatedAt: repoContext.updatedAt,
        isPrivate: repoContext.isPrivate
      },
      analysis: {
        hasCI: repoContext.hasCI,
        hasDocker: repoContext.hasDocker,
        existingDocs: repoContext.existingDocs,
        fileCount: repoContext.fileStructure.length,
        topFiles: repoContext.fileStructure.slice(0, 20).map(f => ({
          name: f.name,
          type: f.type,
          path: f.path
        }))
      },
      readme: repoContext.readme.slice(0, 5000), // Limit README size
      context: {
        project: repoContext.name,
        techStack: repoContext.techStack.join(", "),
        audience: "developers",
        depth: "detailed",
        style: "technical",
        constraints: []
      },
      summary: generateSummary(repoContext)
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("[ANALYZE_REPO_ERROR]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Generate a summary of the repository
 */
function generateSummary(repoContext: any): string {
  const parts: string[] = [];
  
  parts.push(`Analyzed ${repoContext.name}`);
  
  if (repoContext.language) {
    parts.push(`primary language: ${repoContext.language}`);
  }
  
  if (repoContext.techStack.length > 0) {
    parts.push(`technologies: ${repoContext.techStack.join(", ")}`);
  }
  
  if (repoContext.existingDocs.length > 0) {
    parts.push(`existing docs: ${repoContext.existingDocs.join(", ")}`);
  }
  
  if (repoContext.hasCI) {
    parts.push("CI/CD configured");
  }
  
  if (repoContext.hasDocker) {
    parts.push("Docker configured");
  }
  
  return parts.join(". ") + ".";
}
