import "./loader.css";

export default function Loader() {
  return (
    <div className="liquid-loader">
      <div className="loading-text">
        Loading
        <span className="dot">.</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
      </div>

      <div className="loader-track">
        <div className="liquid-fill"></div>
      </div>
    </div>
  );
}
