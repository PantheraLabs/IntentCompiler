import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type ProjectScan = {
  name: string;
  isNext: boolean;
  isReact: boolean;
  isTailwind: boolean;
  isTypeScript: boolean;
  dependencies: string[];
  techStack: string;
};

export async function GET() {
  try {
    const cwd = process.cwd();
    const pkgPath = path.join(cwd, "package.json");
    
    const scan: ProjectScan = {
      name: "New Project",
      isNext: false,
      isReact: false,
      isTailwind: false,
      isTypeScript: false,
      dependencies: [],
      techStack: "Custom"
    };

    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      scan.name = pkg.name || "New Project";
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      scan.dependencies = Object.keys(deps);
      
      scan.isNext = Boolean(deps.next);
      scan.isReact = Boolean(deps.react);
      scan.isTailwind = Boolean(deps.tailwindcss);
      scan.isTypeScript = Boolean(deps.typescript);

      if (scan.isNext) scan.techStack = "Next.js";
      else if (scan.isReact) scan.techStack = "React";
      else if (deps.express) scan.techStack = "Express";
      else if (deps.vite) scan.techStack = "Vite";
    }

    // Secondary checks for config files
    if (fs.existsSync(path.join(cwd, "tailwind.config.ts")) || fs.existsSync(path.join(cwd, "tailwind.config.js"))) {
      scan.isTailwind = true;
    }
    if (fs.existsSync(path.join(cwd, "tsconfig.json"))) {
      scan.isTypeScript = true;
    }

    return NextResponse.json(scan);
  } catch (error) {
    console.error("[SCAN_ERROR]", error);
    return NextResponse.json({ error: "Failed to scan project." }, { status: 500 });
  }
}
