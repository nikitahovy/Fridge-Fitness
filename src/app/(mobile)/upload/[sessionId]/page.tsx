"use client";

import { use, useState } from "react";

export default function MobileUploadPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    await fetch(`/api/sessions/${sessionId}/upload`, {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2">Photo Uploaded!</h2>
          <p className="text-gray-600">You can close this page and return to your computer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-emerald-700 mb-1">Fridge Fitness</h1>
          <p className="text-sm text-gray-600">
            Take a photo of your receipt or fridge to add items
          </p>
        </div>

        {/* Camera input */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          {!preview ? (
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-emerald-400 transition">
                <div className="text-4xl mb-3">📸</div>
                <p className="font-medium text-sm">Tap to take a photo</p>
                <p className="text-xs text-gray-500 mt-1">or choose from gallery</p>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div>
              <img
                src={preview}
                alt="Preview"
                className="w-full rounded-lg mb-4"
              />
              <label className="block text-center text-sm text-emerald-700 font-medium cursor-pointer hover:underline">
                Retake photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {preview && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-semibold text-lg hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Photo"}
          </button>
        )}
      </div>
    </div>
  );
}
