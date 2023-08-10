import React from 'react';
import { PiCopyBold } from 'react-icons/pi';
import { useLocation, useParams } from 'react-router-dom';

const Share = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const title = searchParams.get('title');
  const userId = searchParams.get('userId');

  const copyTitle = () => {
    navigator.clipboard.writeText(`http://lets-pt.store/record/SVOIEWOV53245vcxvnweiqwjsdiof?title=${title}&userId=${userId}`);
  };

  return (
    <div className="share-container">
      <h1 className="share-title">영상공유 URL</h1>
      <div className="share-url-container">
        <div className="share-url-area">
          {`http://lets_pt.store/record/SVOIEWOV53245vcxvnweiqwjsdiof?title=${title}&userId=${userId}`}
        </div>
        <button onClick={copyTitle} className="share-copy-button">
          <PiCopyBold size={30} />
        </button>
      </div>
    </div>
  );
};

export default Share;
