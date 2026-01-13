export interface ChairRecommendation {
  id: string;
  title: string;
  price: number;
  currency: string;
  store: string;
  image_url: string;
  product_url: string;
  why: string[];
  watchouts: string[];
}

export interface RecommendationResponse {
  request_id: string;
  chairs: ChairRecommendation[];
}
