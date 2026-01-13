import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ChairCard from "../components/ChairCard";
import { RecommendationResponse } from "../types";

const STORAGE_KEY = "chairFinder:lastResult";

interface StoredResult {
  response: RecommendationResponse;
  user_text: string;
  images: string[];
}

const ResultsPage = () => {
  const navigate = useNavigate();
  const [stored, setStored] = useState<StoredResult | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      setStored(JSON.parse(raw) as StoredResult);
    } catch {
      setStored(null);
    }
  }, []);

  if (!stored) {
    return (
      <div className="page">
        <div className="container">
          <div className="card empty-state">
            <h2>No recommendations yet</h2>
            <p>Upload your room photos and describe your chair to get started.</p>
            <Link className="button button--primary" to="/">
              Go to upload
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <header className="page-header">
          <p className="eyebrow">Your results</p>
          <h1>🎯 3 chairs picked for your room</h1>
          <p className="subtext">We matched your request: “{stored.user_text}”</p>
        </header>

        <div className="results-grid">
          {stored.response.chairs.map((chair) => (
            <ChairCard chair={chair} key={chair.id} />
          ))}
        </div>

        <div className="card feedback-card">
          <div>
            <h3>Did this help?</h3>
            <div className="feedback-actions">
              <button
                className="button button--ghost"
                type="button"
                onClick={() => console.log("feedback: thumbs up")}
              >
                👍
              </button>
              <button
                className="button button--ghost"
                type="button"
                onClick={() => console.log("feedback: thumbs down")}
              >
                👎
              </button>
            </div>
          </div>
          <button className="button button--secondary" type="button" onClick={() => navigate("/")}
          >
            🔁 Try again
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
