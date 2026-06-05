"use client";

import { useState, useEffect } from "react";

interface UploadedFile {
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      const res = await fetch("/api/upload");
      const data = await res.json();
      if (data.success) {
        setUploadedFiles(data.files);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Sélectionne au moins un fichier");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert(`✅ ${files.length} fichier(s) uploadé(s)!`);
        setFiles([]);
        fetchUploadedFiles();
      } else {
        alert(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      alert("Erreur lors de l'upload");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm("Supprimer ce fichier?")) return;

    try {
      const res = await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });

      if (res.ok) {
        alert("✅ Fichier supprimé");
        fetchUploadedFiles();
      }
    } catch (error) {
      alert("Erreur lors de la suppression");
      console.error(error);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">📤 Upload Manager</h1>
        <p className="text-slate-400 mb-8">
          Upload des images, vidéos, etc. pour les utiliser avec Higgsfield
        </p>

        {/* Upload Section */}
        <div className="bg-slate-800 rounded-lg p-8 mb-8 border border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-4">Nouveau Upload</h2>

          <div className="mb-6">
            <label className="block text-slate-300 mb-2 font-medium">
              Sélectionne tes fichiers
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="w-full px-4 py-3 rounded bg-slate-700 text-white border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
            <p className="text-slate-400 text-sm mt-2">
              Format: JPG, PNG, MP4, WebM, etc. (Max 100MB par fichier)
            </p>
          </div>

          {files.length > 0 && (
            <div className="mb-4 p-4 bg-slate-700/50 rounded">
              <p className="text-slate-300 font-medium">
                {files.length} fichier(s) sélectionné(s):
              </p>
              <ul className="text-slate-400 text-sm mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={i}>• {f.name} ({formatSize(f.size)})</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-3 rounded transition"
          >
            {uploading ? "⏳ Upload en cours..." : "✅ Upload"}
          </button>
        </div>

        {/* Uploaded Files Section */}
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Fichiers Uploadés ({uploadedFiles.length})
          </h2>

          {loading ? (
            <p className="text-slate-400">Chargement...</p>
          ) : uploadedFiles.length === 0 ? (
            <p className="text-slate-400">Aucun fichier uploadé</p>
          ) : (
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.filename}
                  className="flex items-center justify-between bg-slate-700/50 p-4 rounded border border-slate-600"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium truncate">
                      {file.filename}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {formatSize(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
                    >
                      👁️ Voir
                    </a>
                    <button
                      onClick={() => handleDelete(file.filename)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-900/30 border border-blue-500/30 rounded-lg p-6">
          <p className="text-blue-200">
            <strong>💡 Tip:</strong> Une fois uploadé, tu peux me donner le nom du fichier ou l'URL, et je vais l'utiliser automatiquement avec Higgsfield!
          </p>
        </div>
      </div>
    </div>
  );
}
