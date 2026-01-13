import express from "express";
import cors from "cors";
import chairsCatalog from "../data/chairs.json";
import { randomUUID } from "crypto";

interface ChairCatalogItem {
  id: string;
  title: string;
  store: string;
  price: number;
  currency: string;
  image_url: string;
  product_url: string;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const keywordBullets: Record<string, string> = {
  cozy: "Plush cushioning adds a cozy, sink-in feel.",
  reading: "Supportive design that works well for reading sessions.",
  small: "Compact footprint keeps the room feeling open.",
  big: "Roomy seat for stretching out in comfort.",
  light: "Light-toned finish keeps the palette airy.",
  dark: "Darker tones add contrast and depth.",
  budget: "Stays within a budget-friendly range."
};

const lightHints = ["light", "ivory", "cream", "pearl", "sand", "mist"];
const darkHints = ["dark", "black", "espresso", "navy", "walnut"];
const smallHints = ["small", "compact", "space", "petite"];
const bigHints = ["oversized", "large", "big", "recliner", "roomy"];

const parseKeywords = (text: string) => {
  const normalized = text.toLowerCase();
  const keywords = ["cozy", "reading", "small", "big", "light", "dark", "budget"].filter(
    (keyword) => normalized.includes(keyword)
  );
  return { normalized, keywords };
};

const estimateBase64Bytes = (value: string) => {
  if (!value.startsWith("data:")) {
    return 0;
  }
  const base64Part = value.split(",")[1];
  if (!base64Part) {
    return 0;
  }
  return Math.ceil((base64Part.length * 3) / 4);
};

const scoreChair = (chair: ChairCatalogItem, normalized: string, keywords: string[]) => {
  let score = 0;
  const title = chair.title.toLowerCase();

  for (const keyword of keywords) {
    if (title.includes(keyword)) {
      score += 2;
    }
  }

  if (keywords.includes("light") && lightHints.some((hint) => title.includes(hint))) {
    score += 2;
  }
  if (keywords.includes("dark") && darkHints.some((hint) => title.includes(hint))) {
    score += 2;
  }
  if (keywords.includes("small") && smallHints.some((hint) => title.includes(hint))) {
    score += 2;
  }
  if (keywords.includes("big") && bigHints.some((hint) => title.includes(hint))) {
    score += 2;
  }
  if (keywords.includes("budget") && chair.price <= 200) {
    score += 2;
  }
  if (normalized.includes("reading") && title.includes("reading")) {
    score += 1;
  }

  return score;
};

const buildWhyBullets = (keywords: string[]) => {
  const bullets = ["Matches your room’s modern vibe."];

  for (const keyword of keywords) {
    const bullet = keywordBullets[keyword];
    if (bullet) {
      bullets.push(bullet);
    }
  }

  if (bullets.length < 3) {
    bullets.push("Balanced proportions for everyday lounging.");
  }
  if (bullets.length < 4) {
    bullets.push("Neutral style blends easily with existing decor.");
  }

  return bullets.slice(0, 5);
};

const buildWatchouts = (title: string) => {
  const watchouts: string[] = [];
  const normalized = title.toLowerCase();

  if (bigHints.some((hint) => normalized.includes(hint))) {
    watchouts.push("May feel bulky in tighter layouts.");
  }
  if (normalized.includes("leather")) {
    watchouts.push("Leather may need occasional conditioning.");
  }
  if (normalized.includes("boucle") || normalized.includes("velvet") || normalized.includes("linen")) {
    watchouts.push("Textured fabric benefits from gentle spot cleaning.");
  }

  return watchouts.slice(0, 2);
};

app.post("/api/recommend", (req, res) => {
  const { image_urls, user_text } = req.body as {
    image_urls?: string[];
    user_text?: string;
  };

  if (!Array.isArray(image_urls) || image_urls.length < 1 || image_urls.length > 3) {
    return res.status(400).json({ message: "Please provide 1–3 images." });
  }

  for (const image of image_urls) {
    if (typeof image !== "string" || !image.startsWith("data:image/")) {
      return res.status(400).json({ message: "Images must be base64 data URLs." });
    }
    const size = estimateBase64Bytes(image);
    if (size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: "Each image must be under 5MB." });
    }
  }

  if (typeof user_text !== "string" || user_text.trim().length === 0) {
    return res.status(400).json({ message: "Please provide a description." });
  }

  const { normalized, keywords } = parseKeywords(user_text);

  const scored = (chairsCatalog as ChairCatalogItem[])
    .map((chair) => ({
      chair,
      score: scoreChair(chair, normalized, keywords)
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.chair.title.localeCompare(b.chair.title);
    })
    .slice(0, 3)
    .map(({ chair }) => ({
      ...chair,
      why: buildWhyBullets(keywords),
      watchouts: buildWatchouts(chair.title)
    }));

  return res.json({
    request_id: randomUUID(),
    chairs: scored
  });
});

app.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
