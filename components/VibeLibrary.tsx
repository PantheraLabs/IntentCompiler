"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VibeTemplate } from "@/lib/types";
import { getStoredVibes, saveVibe, deleteVibe, exportVibes, importVibes } from "@/lib/vibeStorage";

interface VibeLibraryProps {
  builtInVibes: VibeTemplate[];
  onSelectVibe: (vibe: VibeTemplate) => void;
  isOpen: boolean;
  onClose: () => void;
}

const emptyVibe: Omit<VibeTemplate, "id"> = {
  name: "",
  description: "",
  context: {
    project: "",
    audience: "",
    tech_stack: "",
    style: "",
    constraints: []
  }
};

export default function VibeLibrary({ builtInVibes, onSelectVibe, isOpen, onClose }: VibeLibraryProps) {
  const [customVibes, setCustomVibes] = useState<VibeTemplate[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingVibe, setEditingVibe] = useState<VibeTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<"browse" | "create" | "import">("browse");
  const [importJson, setImportJson] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setCustomVibes(getStoredVibes());
  }, []);

  const handleSave = () => {
    if (!editingVibe?.name.trim()) return;
    
    const vibeToSave: VibeTemplate = {
      ...editingVibe,
      id: editingVibe.id || crypto.randomUUID()
    };
    
    saveVibe(vibeToSave);
    setCustomVibes(getStoredVibes());
    setIsEditing(false);
    setEditingVibe(null);
    setActiveTab("browse");
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this vibe?")) {
      deleteVibe(id);
      setCustomVibes(getStoredVibes());
    }
  };

  const handleDuplicate = (vibe: VibeTemplate) => {
    const duplicated: VibeTemplate = {
      ...vibe,
      id: crypto.randomUUID(),
      name: `${vibe.name} (Copy)`,
      isBuiltIn: false
    };
    saveVibe(duplicated);
    setCustomVibes(getStoredVibes());
  };

  const handleExport = () => {
    const json = exportVibes(customVibes);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vibe-library-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const imported = importVibes(importJson);
      imported.forEach(saveVibe);
      setCustomVibes(getStoredVibes());
      setImportJson("");
      setActiveTab("browse");
      alert(`Imported ${imported.length} vibe(s)`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Import failed");
    }
  };

  const startNew = () => {
    setEditingVibe({ ...emptyVibe, id: crypto.randomUUID() });
    setIsEditing(true);
    setActiveTab("create");
  };

  const startEdit = (vibe: VibeTemplate) => {
    setEditingVibe({ ...vibe });
    setIsEditing(true);
    setActiveTab("create");
  };

  const filteredBuiltIn = builtInVibes.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustom = customVibes.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-lg font-semibold text-text">Vibe Library</h2>
            <button onClick={onClose} className="text-muted hover:text-text transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border px-4">
            {["browse", "create", "import"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`px-4 py-2 text-xs uppercase tracking-wider transition ${
                  activeTab === tab
                    ? "border-b-2 border-accent text-accent"
                    : "text-muted hover:text-text"
                }`}
              >
                {tab === "create" && isEditing && editingVibe?.id && !editingVibe.isBuiltIn
                  ? "Edit"
                  : tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            {activeTab === "browse" && (
              <div className="space-y-4">
                {/* Search & Actions */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search vibes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none focus:border-accent"
                  />
                  <button
                    onClick={startNew}
                    className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-black hover:brightness-110 transition"
                  >
                    + New
                  </button>
                  {customVibes.length > 0 && (
                    <button
                      onClick={handleExport}
                      className="rounded-lg border border-border px-3 py-2 text-xs text-text hover:border-accent transition"
                    >
                      Export
                    </button>
                  )}
                </div>

                {/* Built-in Section */}
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-wider text-muted">Built-in Templates</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredBuiltIn.map((vibe) => (
                      <VibeCard
                        key={vibe.id}
                        vibe={vibe}
                        onSelect={() => onSelectVibe(vibe)}
                        onDuplicate={() => handleDuplicate(vibe)}
                        isBuiltIn
                      />
                    ))}
                  </div>
                </div>

                {/* Custom Section */}
                {filteredCustom.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-wider text-muted">Your Custom Vibes</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredCustom.map((vibe) => (
                        <VibeCard
                          key={vibe.id}
                          vibe={vibe}
                          onSelect={() => onSelectVibe(vibe)}
                          onEdit={() => startEdit(vibe)}
                          onDelete={() => handleDelete(vibe.id)}
                          onDuplicate={() => handleDuplicate(vibe)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {filteredBuiltIn.length === 0 && filteredCustom.length === 0 && (
                  <p className="text-center text-muted py-8">No vibes found. Create your first!</p>
                )}
              </div>
            )}

            {activeTab === "create" && editingVibe && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-muted">Name</label>
                  <input
                    type="text"
                    value={editingVibe.name}
                    onChange={(e) => setEditingVibe({ ...editingVibe, name: e.target.value })}
                    placeholder="My Custom Vibe"
                    className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted">Description</label>
                  <input
                    type="text"
                    value={editingVibe.description}
                    onChange={(e) => setEditingVibe({ ...editingVibe, description: e.target.value })}
                    placeholder="Brief description of this vibe"
                    className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none focus:border-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs text-muted">Project Type</label>
                    <input
                      type="text"
                      value={editingVibe.context.project}
                      onChange={(e) =>
                        setEditingVibe({
                          ...editingVibe,
                          context: { ...editingVibe.context, project: e.target.value }
                        })
                      }
                      placeholder="e.g., SaaS Platform"
                      className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted">Audience</label>
                    <input
                      type="text"
                      value={editingVibe.context.audience}
                      onChange={(e) =>
                        setEditingVibe({
                          ...editingVibe,
                          context: { ...editingVibe.context, audience: e.target.value }
                        })
                      }
                      placeholder="e.g., Enterprise Clients"
                      className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted">Tech Stack</label>
                  <input
                    type="text"
                    value={editingVibe.context.tech_stack}
                    onChange={(e) =>
                      setEditingVibe({
                        ...editingVibe,
                        context: { ...editingVibe.context, tech_stack: e.target.value }
                      })
                    }
                    placeholder="e.g., Next.js, PostgreSQL, Redis"
                    className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted">Style</label>
                  <input
                    type="text"
                    value={editingVibe.context.style}
                    onChange={(e) =>
                      setEditingVibe({
                        ...editingVibe,
                        context: { ...editingVibe.context, style: e.target.value }
                      })
                    }
                    placeholder="e.g., Enterprise Grade"
                    className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted">Constraints (one per line)</label>
                  <textarea
                    value={editingVibe.context.constraints.join("\n")}
                    onChange={(e) =>
                      setEditingVibe({
                        ...editingVibe,
                        context: {
                          ...editingVibe.context,
                          constraints: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean)
                        }
                      })
                    }
                    rows={4}
                    placeholder="e.g.,&#10;Multi-tenancy&#10;GDPR Compliance"
                    className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm text-text outline-none focus:border-accent"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={!editingVibe.name.trim()}
                    className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black hover:brightness-110 transition disabled:opacity-50"
                  >
                    Save Vibe
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditingVibe(null);
                      setActiveTab("browse");
                    }}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-text hover:border-accent transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {activeTab === "import" && (
              <div className="space-y-4">
                <p className="text-sm text-muted">
                  Paste JSON to import vibes. You can export your library first to see the format.
                </p>
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  rows={12}
                  placeholder='[&#10;  {&#10;    "name": "My Vibe",&#10;    "description": "...",&#10;    "context": { ... }&#10;  }&#10;]'
                  className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-xs font-mono text-text outline-none focus:border-accent"
                />
                <button
                  onClick={handleImport}
                  disabled={!importJson.trim()}
                  className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black hover:brightness-110 transition disabled:opacity-50"
                >
                  Import Vibes
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Sub-component for vibe cards
function VibeCard({
  vibe,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  isBuiltIn
}: {
  vibe: VibeTemplate;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isBuiltIn?: boolean;
}) {
  return (
    <div className="group relative rounded-xl border border-border bg-surfaceAlt/50 p-4 transition hover:border-accent/50 hover:bg-surfaceAlt">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-text text-sm">{vibe.name}</h3>
          <p className="text-xs text-muted mt-0.5">{vibe.description}</p>
        </div>
        {isBuiltIn && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent">Built-in</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mt-3">
        {vibe.context.tech_stack.split(",").slice(0, 3).map((tech) => (
          <span
            key={tech}
            className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted"
          >
            {tech.trim()}
          </span>
        ))}
      </div>

      <div className="flex gap-1 mt-3 pt-3 border-t border-border/50">
        <button
          onClick={onSelect}
          className="flex-1 rounded-md bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/30 transition"
        >
          Use
        </button>
        {onDuplicate && (
          <button
            onClick={onDuplicate}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-text transition"
            title="Duplicate"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
        {!isBuiltIn && onEdit && (
          <button
            onClick={onEdit}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-text transition"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        {!isBuiltIn && onDelete && (
          <button
            onClick={onDelete}
            className="rounded-md border border-rose-400/40 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-400/10 transition"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
