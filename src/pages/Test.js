import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const Test = () => {
  const [scriptText, setscriptText] = useState("");
  const [scriptArray, setScriptArray] = useState([]);
  const [currentScriptIndex, setcurrentScriptIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function nextPage() {
    setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages));
  }

  function prevPage() {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  }

  const handleChange = (event) => {
    setscriptText(event.target.value);
  };

  const handleSave = () => {
    if (scriptText.trim() === "") {
      setScriptArray((prevArray) => [...prevArray, "해당 페이지에는 스크립트 내용이 없습니다."]);
    } else {
      setScriptArray((prevArray) => [...prevArray, scriptText]);
    }
    setscriptText("");
    nextPage();
    if (numPages === scriptArray.length + 1) {
      alert("마지막 페이지입니다");
    }
  };

  const handlePrevious = () => {
    prevPage();
    setscriptText(scriptArray[pageNumber - 2]);
  };

  const handleStart = () => {
    setIsStarted(true);
    setcurrentScriptIndex(0);
    setPageNumber(1);
  };

  const handleArrowKey = (event) => {
    if (isStarted) {
      if (event.key === "ArrowLeft") {
        setcurrentScriptIndex((prevIndex) => Math.max(prevIndex - 1, 0));
        prevPage();
      } else if (event.key === "ArrowRight") {
        setcurrentScriptIndex((prevIndex) => Math.min(prevIndex + 1, scriptArray.length - 1));
        nextPage();
      }
    }
  };

  useEffect(() => {

    window.addEventListener("keydown", handleArrowKey);

    return () => {
      window.removeEventListener("keydown", handleArrowKey);
    };
  }, [currentScriptIndex, isStarted, pageNumber, numPages]);

  return (
    <div>
      <Document
        file="https://speech-video-storage.s3.ap-northeast-2.amazonaws.com/TCP_IP.pdf"
        onLoadSuccess={onDocumentLoadSuccess}

      >
        <Page pageNumber={pageNumber} />
      </Document>
      <p>
        Page {pageNumber || (numPages ? 1 : "--")} of {numPages || "--"}
      </p>
      {!isStarted && (
        <textarea
          className="script-input"
          placeholder="스크립트 작성"
          value={scriptText}
          onChange={handleChange}
        />
      )}
      {!isStarted && pageNumber > 1 && (
        <button onClick={handlePrevious}>이전 페이지</button>
      )}
      {!isStarted && (
        <button onClick={handleSave}>
          다음페이지
        </button>
      )}
      {!isStarted && (
        <button onClick={handleStart}>시작하기</button>
      )}
      {isStarted && (
        <div>
          <div>
            {scriptArray[currentScriptIndex].split("\n").map((line, lineIndex) => (
              <div key={lineIndex}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Test;
