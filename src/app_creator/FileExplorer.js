import React, { useEffect, useMemo, useState } from 'react';

const FileTreeItem = ({ item, onSelect, selectedPath }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (item.type === 'file' || item.content !== undefined) {
        const isSelected = selectedPath === item.path;
        return (
            <div
                className={`tree-item tree-file ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelect(item)}
            >
                📄 {item.name}
            </div>
        );
    }

    // It's a folder
    return (
        <div>
            <div
                className="tree-item tree-folder"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? '📂' : '📁'} {item.name}
            </div>
            {isOpen && (
                <div style={{ paddingLeft: '15px' }}>
                    {item.children.map((child, idx) => (
                        <FileTreeItem
                            key={idx}
                            item={{
                                ...child,
                                path: child.path || (item.path ? `${item.path}/${child.name}` : child.name),
                            }}
                            onSelect={onSelect}
                            selectedPath={selectedPath}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const FileExplorer = ({ tree, files, onLoadFile, onSaveFile, projectName }) => {
    const [selectedPath, setSelectedPath] = useState(null);
    const [editorValue, setEditorValue] = useState("");
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [loadError, setLoadError] = useState(null);

    const selectedContent = useMemo(() => {
        if (!selectedPath) return "";
        return files?.[selectedPath] ?? "";
    }, [files, selectedPath]);

    useEffect(() => {
        // When switching files, load current content into editor (and reset dirty flag)
        setEditorValue(selectedContent);
        setIsDirty(false);
        setLoadError(null);
    }, [selectedContent, selectedPath]);

    const handleSelect = async (item) => {
        if (!item) return;
        const path = item.path;
        if (!path) return;
        if (item.type !== 'file' && item.content === undefined) return;

        setSelectedPath(path);
        setLoadError(null);

        // If we don't have file content yet, fetch it.
        if (files?.[path] === undefined && onLoadFile) {
            try {
                const content = await onLoadFile(path);
                setEditorValue(content || "");
                setIsDirty(false);
            } catch (e) {
                setLoadError(e?.message || "Failed to load file");
            }
        }
    };

    const handleSave = async () => {
        if (!selectedPath || !onSaveFile) return;
        setIsSaving(true);
        try {
            await onSaveFile(selectedPath, editorValue);
            setIsDirty(false);
        } finally {
            setIsSaving(false);
        }
    };

    if (!tree) {
        return (
            <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
                No files generated yet.
            </div>
        );
    }

    return (
        <div className="file-explorer">
            <div className="file-tree">
                {tree.map((item, idx) => (
                    <FileTreeItem key={idx} item={item} onSelect={handleSelect} selectedPath={selectedPath} />
                ))}
            </div>
            <div className="code-viewer">
                <div className="code-header">
                    <div className="code-header-row">
                        <div className="code-header-title">
                            {selectedPath ? selectedPath : "Select a file"}
                            {isDirty ? <span className="dirty-indicator">•</span> : null}
                        </div>
                        <div className="code-header-actions">
                            <button
                                className="save-button"
                                onClick={handleSave}
                                disabled={!selectedPath || !isDirty || isSaving || !projectName}
                                title={!projectName ? "Generate a project first" : "Save file"}
                            >
                                {isSaving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="code-content">
                    {loadError ? (
                        <div style={{ color: '#b00020' }}>{loadError}</div>
                    ) : (
                        <textarea
                            className="code-editor"
                            value={editorValue}
                            onChange={(e) => {
                                setEditorValue(e.target.value);
                                setIsDirty(true);
                            }}
                            spellCheck={false}
                            placeholder={selectedPath ? "Edit code..." : ""}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileExplorer;
