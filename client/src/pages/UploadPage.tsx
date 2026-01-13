import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RecommendationResponse } from "../types";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const STORAGE_KEY = "chairFinder:lastResult";

interface UploadItem {
  id: string;
  name: string;
  preview: string;
  size: number;
}

const UploadPage = () => {
  const navigate = useNavigate();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [requestText, setRequestText] = useState("");
  const [imageError, setImageError] = useState("");
  const [textError, setTextError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const canSubmit = useMemo(() => {
    return uploads.length > 0 && requestText.trim().length > 0 && !isLoading;
  }, [uploads.length, requestText, isLoading]);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setImageError("");

    const incoming = Array.from(files);
    if (uploads.length + incoming.length > MAX_FILES) {
      setImageError("Please upload up to 3 images.");
      return;
    }

    for (const file of incoming) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setImageError("Only JPG or PNG images are supported.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setImageError("Each image must be under 5MB.");
        return;
      }
    }

    const newItems = await Promise.all(
      incoming.map(
        (file) =>
          new Promise<UploadItem>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                id: `${file.name}-${file.lastModified}`,
                name: file.name,
                preview: reader.result as string,
                size: file.size
              });
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
          })
      )
    );

    setUploads((prev) => [...prev, ...newItems]);
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((item) => item.id !== id));
  };

  const validateBeforeSubmit = () => {
    let valid = true;
    if (uploads.length === 0) {
      setImageError("Please upload at least one room photo.");
      valid = false;
    }
    if (requestText.trim().length === 0) {
      setTextError("Please describe the chair you want.");
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setApiError("");
    setTextError("");
    setImageError("");

    if (!validateBeforeSubmit()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image_urls: uploads.map((item) => item.preview),
          user_text: requestText.trim()
        })
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || "Unable to fetch recommendations.");
      }

      const data: RecommendationResponse = await response.json();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          response: data,
          user_text: requestText.trim(),
          images: uploads.map((item) => item.preview)
        })
      );
      navigate("/results");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <header className="page-header">
          <p className="eyebrow">AI Chair Finder</p>
          <h1>🪑 Find the perfect chair for your room</h1>
          <p className="subtext">
            Upload a few room photos, tell us what you want, and we will pick three
            chairs that fit your space.
          </p>
        </header>

        <form className="card" onSubmit={handleSubmit}>
          {isLoading ? (
            <div className="loading-card">
              <div className="spinner" aria-hidden="true"></div>
              <h2>Analyzing your room…</h2>
              <div className="progress-bar">
                <div className="progress-bar__fill"></div>
              </div>
              <ul>
                <li>Detecting style &amp; colors</li>
                <li>Understanding your preferences</li>
                <li>Picking the best matches</li>
              </ul>
              <p className="muted">Usually takes 10–20 seconds</p>
            </div>
          ) : (
            <>
              <section>
                <label className="section-title">Room photos (1–3)</label>
                <div
                  className={`upload-zone ${isDragging ? "upload-zone--active" : ""}`}
                  onDragEnter={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    void handleFiles(event.dataTransfer.files);
                  }}
                >
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/png,image/jpeg"
                    multiple
                    onChange={(event) => void handleFiles(event.target.files)}
                  />
                  <div>
                    <p className="upload-title">Drag &amp; drop your photos here</p>
                    <p className="muted">or click to select (JPG/PNG, up to 5MB)</p>
                  </div>
                </div>
                {imageError && <p className="error-text">{imageError}</p>}
                {uploads.length > 0 && (
                  <div className="thumbnail-grid">
                    {uploads.map((item) => (
                      <div className="thumbnail" key={item.id}>
                        <img src={item.preview} alt={item.name} />
                        <button
                          type="button"
                          className="button button--ghost"
                          onClick={() => removeUpload(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <label className="section-title" htmlFor="request">
                  What kind of chair are you looking for?
                </label>
                  <textarea
                    id="request"
                    placeholder="Cozy reading chair, light color, not bulky, up to £250"
                    value={requestText}
                  onChange={(event) => {
                    setRequestText(event.target.value);
                    if (event.target.value.trim().length > 0) {
                      setTextError("");
                    }
                  }}
                    rows={4}
                  />
                {textError && <p className="error-text">{textError}</p>}
              </section>

              {apiError && (
                <div className="error-banner">
                  <p>{apiError}</p>
                </div>
              )}

              <button className="button button--primary" type="submit" disabled={!canSubmit}>
                🔍 Find chairs
              </button>
              <p className="helper-text">No filters. Just describe what you want.</p>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default UploadPage;
