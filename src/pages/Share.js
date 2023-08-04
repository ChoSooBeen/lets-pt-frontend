import React from 'react';
import { PiCopyBold } from 'react-icons/pi';
import { useLocation, useParams } from 'react-router-dom';

const Share = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const title = searchParams.get('title');

  const copyTitle = () => {
    navigator.clipboard.writeText(`http://localhost:3000/record/SVOIEWOV53245vcxvnweiqwjsdiof?title=${title}`);
  };

  return (
    <div className="share-container">
      <h1 className="share-title">영상공유 URL</h1>
      <div className="share-url-container">
        <div className="share-url-area">
          {`http://localhost:3000/record/SVOIEWOV53245vcxvnweiqwjsdiof?title=${title}`}
        </div>
        <button onClick={copyTitle} className="share-copy-button">
          <PiCopyBold size={30} />
        </button>
      </div>
    </div>
  );
};

export default Share;
