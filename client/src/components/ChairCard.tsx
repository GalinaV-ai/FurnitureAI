import { ChairRecommendation } from "../types";

interface ChairCardProps {
  chair: ChairRecommendation;
}

const ChairCard = ({ chair }: ChairCardProps) => {
  return (
    <article className="chair-card">
      <img src={chair.image_url} alt={chair.title} />
      <div className="chair-card__content">
        <div>
          <h3>{chair.title}</h3>
          <p className="price">
            {chair.currency} {chair.price.toFixed(0)} · {chair.store}
          </p>
        </div>
        <div className="chair-card__section">
          <h4>Why it fits:</h4>
          <ul>
            {chair.why.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        {chair.watchouts.length > 0 && (
          <div className="chair-card__section">
            <h4>Watch-outs:</h4>
            <ul>
              {chair.watchouts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        <a className="button button--secondary" href={chair.product_url} target="_blank" rel="noreferrer">
          Open in store →
        </a>
      </div>
    </article>
  );
};

export default ChairCard;
