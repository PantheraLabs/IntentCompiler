import { NextResponse } from "next/server";
import type { WorkflowStep, UserContext, ModelConfig } from "@/lib/types";
import { generateAdaptiveFiles, type ProjectOutput } from "@/lib/adaptiveFileGenerator";
import { getRelevantSkills, enhanceWithSkills } from "@/lib/skillsRegistry";

type GenerateProjectRequest = {
  steps: WorkflowStep[];
  context: UserContext;
  intent: string;
  target: "claude" | "agents" | "gemini" | "cursor" | "windsurf" | "generic";
  modelConfig?: Partial<ModelConfig>;
  userLines?: string[];
  enhanceWithSkillLibrary?: boolean;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateProjectRequest;
    const { steps, context, intent, target, userLines, enhanceWithSkillLibrary = true } = body;

    if (!steps || !context || !intent) {
      return NextResponse.json(
        { error: "Invalid payload. Steps, context, and intent are required." },
        { status: 400 }
      );
    }

    // Generate adaptive files
    const projectOutput = await generateAdaptiveFiles(
      steps,
      context,
      intent,
      target,
      userLines
    );

    // Enhance with skills if requested
    if (enhanceWithSkillLibrary) {
      const relevantSkills = getRelevantSkills(
        projectOutput.analysis.type,
        projectOutput.analysis.complexity,
        projectOutput.analysis.domains
      );

      // Enhance each file with relevant skills
      for (const file of projectOutput.files) {
        const fileSkills = relevantSkills.filter(skill =>
          skill.domains.some(d => file.type.includes(d)) ||
          file.type === "comprehensive"
        );
        
        if (fileSkills.length > 0) {
          file.content = enhanceWithSkills(file.content, fileSkills);
        }
      }
    }

    // Prepare response
    const response = {
      success: true,
      analysis: {
        type: projectOutput.analysis.type,
        complexity: projectOutput.analysis.complexity,
        needsMultipleFiles: projectOutput.analysis.needsMultipleFiles,
        fileCount: projectOutput.analysis.fileCount,
        domains: projectOutput.analysis.domains,
        features: projectOutput.analysis.features,
        techStack: projectOutput.analysis.techStack,
        reasoning: projectOutput.analysis.reasoning
      },
      files: projectOutput.files.map(f => ({
        name: f.name,
        type: f.type,
        content: f.content,
        quality: f.quality.overallScore,
        dependencies: f.dependencies
      })),
      isMultiFile: projectOutput.isMultiFile,
      totalQuality: projectOutput.totalQuality,
      summary: generateSummary(projectOutput)
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("[GENERATE_PROJECT_ERROR]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Generate a human-readable summary
 */
function generateSummary(output: ProjectOutput): string {
  const { analysis, files, isMultiFile, totalQuality } = output;
  
  let summary = `Generated ${files.length} instruction file${files.length > 1 ? "s" : ""} `;
  summary += `for a ${analysis.complexity} ${analysis.type} project. `;
  
  if (isMultiFile) {
    summary += `Files are organized by domain: ${analysis.domains.join(", ")}. `;
  }
  
  summary += `Overall quality score: ${totalQuality}%.`;
  
  if (totalQuality < 90) {
    summary += ` Consider reviewing and improving for higher quality.`;
  }
  
  return summary;
}
