"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface GeneratedFile {
  name: string;
  type: string;
  content: string;
  quality: number;
  dependencies: string[];
}

type FileTreeProps = {
  files: GeneratedFile[];
  isMultiFile: boolean;
  onFileSelect?: (file: GeneratedFile) => void;
  onDownloadAll?: () => void;
  onCopyFile?: (file: GeneratedFile) => void;
};

export default function FileTree({
  files,
  isMultiFile,
  onFileSelect,
  onDownloadAll,
  onCopyFile
}: FileTreeProps) {
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(files[0] || null);
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");

  const handleFileClick = (file: GeneratedFile) => {
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const handleCopy = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      onCopyFile?.(selectedFile);
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 90) return "text-emerald-400";
    if (quality >= 70) return "text-amber-400";
    return "text-rose-400";
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "architecture":
        return "🏗️";
      case "frontend":
        return "🎨";
      case "backend":
        return "⚙️";
      case "database":
        return "🗄️";
      case "authentication":
        return "🔐";
      case "deployment":
        return "🚀";
      case "testing":
        return "🧪";
      case "monitoring":
        return "📊";
      case "security":
        return "🛡️";
      case "compliance":
        return "📋";
      case "scaling":
        return "📈";
      default:
        return "📄";
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface/50 overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-surfaceAlt/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text">
              Generated Files
              {isMultiFile && (
                <span className="ml-2 text-xs text-muted font-normal">
                  ({files.length} files)
                </span>
              )}
            </h3>
          </div>
          {onDownloadAll && (
            <button
              onClick={onDownloadAll}
              className="rounded-md border border-border bg-surface px-3 py-1 text-xs font-medium text-text transition hover:border-accent hover:text-accent"
            >
              Download All
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-[400px]">
        {/* File List */}
        <div className="w-1/3 border-r border-border bg-black/10">
          <div className="p-2 space-y-1">
            {files.map((file, index) => (
              <button
                key={index}
                onClick={() => handleFileClick(file)}
                className={`w-full text-left rounded-lg px-3 py-2 text-xs transition ${
                  selectedFile?.name === file.name
                    ? "bg-accent/20 border border-accent/40"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text truncate">{file.name}</p>
                    <p className="text-muted text-[10px] capitalize">{file.type}</p>
                  </div>
                  <span className={`text-[10px] font-semibold ${getQualityColor(file.quality)}`}>
                    {file.quality}%
                  </span>
                </div>
                {file.dependencies.length > 0 && (
                  <p className="mt-1 text-[10px] text-muted">
                    Depends: {file.dependencies.length}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* File Content */}
        <div className="flex-1 flex flex-col">
          {selectedFile ? (
            <>
              {/* File Header */}
              <div className="border-b border-border bg-surfaceAlt/30 px-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{getFileIcon(selectedFile.type)}</span>
                    <span className="text-sm font-medium text-text">{selectedFile.name}</span>
                    <span className={`text-xs font-semibold ${getQualityColor(selectedFile.quality)}`}>
                      Quality: {selectedFile.quality}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode(viewMode === "preview" ? "raw" : "preview")}
                      className="rounded-md border border-border bg-surface px-2 py-1 text-[10px] font-medium text-muted transition hover:text-text"
                    >
                      {viewMode === "preview" ? "Raw" : "Preview"}
                    </button>
                    <button
                      onClick={handleCopy}
                      className="rounded-md border border-border bg-surface px-2 py-1 text-[10px] font-medium text-muted transition hover:text-accent"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* File Content */}
              <div className="flex-1 overflow-auto p-4">
                {viewMode === "preview" ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {selectedFile.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <pre className="text-xs text-text/80 whitespace-pre-wrap font-mono">
                    {selectedFile.content}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">
              Select a file to view its content
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
