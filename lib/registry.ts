export type ToolMode = "llm" | "shell" | "http" | "db" | "search" | "file";

export interface ShellToolConfig {
  command: string;
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
}

export interface HttpToolConfig {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  headers?: Record<string, string>;
  body?: string | object;
  timeout?: number;
}

export interface DbToolConfig {
  connectionString?: string;
  query: string;
  params?: unknown[];
}

export interface SearchToolConfig {
  provider: "perplexity" | "tavily" | "brave";
  query: string;
  maxResults?: number;
}

export interface FileToolConfig {
  operation: "read" | "write" | "list" | "search";
  path: string;
  content?: string;
  pattern?: string; // For search
}

export type ToolConfig =
  | { mode: "llm" }
  | { mode: "shell"; config: ShellToolConfig }
  | { mode: "http"; config: HttpToolConfig }
  | { mode: "db"; config: DbToolConfig }
  | { mode: "search"; config: SearchToolConfig }
  | { mode: "file"; config: FileToolConfig };

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  metadata?: {
    exitCode?: number;
    statusCode?: number;
    duration?: number;
    rowCount?: number;
  };
}

export async function executeTool(tool: ToolConfig): Promise<ToolResult> {
  switch (tool.mode) {
    case "llm":
      return { success: true, output: "LLM execution handled separately" };
    case "shell":
      return executeShell(tool.config);
    case "http":
      return executeHttp(tool.config);
    case "db":
      return executeDb(tool.config);
    case "search":
      return executeSearch(tool.config);
    case "file":
      return executeFile(tool.config);
    default:
      return { success: false, output: "", error: `Unknown tool mode: ${(tool as { mode: string }).mode}` };
  }
}

async function executeShell(config: ShellToolConfig): Promise<ToolResult> {
  const startTime = Date.now();
  
  // Security: Block dangerous commands
  const dangerousPatterns = [
    /\brm\s+-rf\s+\//i,
    />\s*\/dev\/null/,
    /mkfs\./i,
    /dd\s+if=/i,
    /:(){ :|:& };:/, // Fork bomb
  ];
  
  if (dangerousPatterns.some(p => p.test(config.command))) {
    return { 
      success: false, 
      output: "", 
      error: "Command blocked for security reasons" 
    };
  }

  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    
    const { stdout, stderr } = await execAsync(config.command, {
      cwd: config.cwd,
      timeout: config.timeout || 30000,
      env: { ...process.env, ...config.env }
    });
    
    return {
      success: true,
      output: stdout || stderr,
      metadata: { duration: Date.now() - startTime }
    };
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : "Shell execution failed",
      metadata: { duration: Date.now() - startTime }
    };
  }
}

async function executeHttp(config: HttpToolConfig): Promise<ToolResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.body ? (typeof config.body === "string" ? config.body : JSON.stringify(config.body)) : undefined,
    });
    
    const text = await response.text();
    
    return {
      success: response.ok,
      output: text,
      metadata: {
        statusCode: response.status,
        duration: Date.now() - startTime
      }
    };
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : "HTTP request failed",
      metadata: { duration: Date.now() - startTime }
    };
  }
}

async function executeDb(_config: DbToolConfig): Promise<ToolResult> {
  // Note: This is a stub - actual DB execution requires driver setup
  return {
    success: false,
    output: "",
    error: "Database execution requires DATABASE_URL to be configured"
  };
}

async function executeSearch(config: SearchToolConfig): Promise<ToolResult> {
  const apiKeys: Record<string, string | undefined> = {
    perplexity: process.env.PERPLEXITY_API_KEY,
    tavily: process.env.TAVILY_API_KEY,
    brave: process.env.BRAVE_API_KEY
  };
  
  const apiKey = apiKeys[config.provider];
  if (!apiKey) {
    return {
      success: false,
      output: "",
      error: `API key not configured for ${config.provider}`
    };
  }
  
  const endpoints: Record<string, string> = {
    perplexity: "https://api.perplexity.ai/chat/completions",
    tavily: "https://api.tavily.com/search",
    brave: "https://api.search.brave.com/res/v1/web/search"
  };
  
  try {
    let response: Response;
    
    if (config.provider === "perplexity") {
      response = await fetch(endpoints.perplexity, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [{ role: "user", content: config.query }]
        })
      });
    } else if (config.provider === "tavily") {
      response = await fetch(endpoints.tavily, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query: config.query,
          max_results: config.maxResults || 5
        })
      });
    } else {
      response = await fetch(`${endpoints.brave}?q=${encodeURIComponent(config.query)}&count=${config.maxResults || 5}`, {
        headers: {
          "X-Subscription-Token": apiKey,
          "Accept": "application/json"
        }
      });
    }
    
    const data = await response.json();
    return {
      success: response.ok,
      output: JSON.stringify(data, null, 2)
    };
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : "Search failed"
    };
  }
}

async function executeFile(config: FileToolConfig): Promise<ToolResult> {
  const { promises: fs } = await import("fs");
  const _path = await import("path");
  
  try {
    switch (config.operation) {
      case "read": {
        const content = await fs.readFile(config.path, "utf-8");
        return { success: true, output: content };
      }
      
      case "write": {
        if (!config.content) {
          return { success: false, output: "", error: "Content required for write operation" };
        }
        await fs.writeFile(config.path, config.content, "utf-8");
        return { success: true, output: `File written: ${config.path}` };
      }
      
      case "list": {
        const entries = await fs.readdir(config.path, { withFileTypes: true });
        const list = entries.map(e => `${e.isDirectory() ? "[D]" : "[F]"} ${e.name}`).join("\n");
        return { success: true, output: list };
      }
      
      case "search": {
        if (!config.pattern) {
          return { success: false, output: "", error: "Pattern required for search operation" };
        }
        // Basic recursive search - in production, use ripgrep or similar
        return { success: true, output: `Search pattern "${config.pattern}" in ${config.path} (stub implementation)` };
      }
      
      default:
        return { success: false, output: "", error: `Unknown file operation: ${config.operation}` };
    }
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : "File operation failed"
    };
  }
}
