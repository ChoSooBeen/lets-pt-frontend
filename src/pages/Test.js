import React, { useEffect, useState } from "react";

const Test = () => {
  const [inputText, setInputText] = useState("");
  const [scriptArray, setScriptArray] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  const handleChange = (event) => {
    setInputText(event.target.value);
  };


  const handleSave = () => {
    if (inputText.trim() !== "") {
      setScriptArray((prevArray) => [...prevArray, inputText]);
      setInputText("");
    }
  };

  const handleStart = () => {
    setIsStarted(true);
    setCurrentIndex(0);
  };

  const handleArrowKey = (event) => {
    if (isStarted) {
      if (event.key === "ArrowLeft") {
        setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
      } else if (event.key === "ArrowRight") {
        setCurrentIndex((prevIndex) =>
          Math.min(prevIndex + 1, scriptArray.length - 1)
        );
      }
    }
  };

  useEffect(() => {
    // window에 이벤트 리스너를 추가하여 전체 페이지에서 방향키 이벤트 처리
    window.addEventListener("keydown", handleArrowKey);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener("keydown", handleArrowKey);
    };
  }, [currentIndex, isStarted]);

  return (
    <div>
      {!isStarted && (
        <textarea
          className="script-input"
          placeholder="스크립트 작성"
          value={inputText}
          onChange={handleChange}
        />
      )}
      {!isStarted && (
        <button onClick={handleSave}>저장하기</button>
      )}
      {!isStarted && (
        <button onClick={handleStart}>시작하기</button>
      )}
      {isStarted && (
        <div>
          <div>
            {scriptArray[currentIndex].split("\n").map((line, lineIndex) => (
              <div key={lineIndex}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Test;
