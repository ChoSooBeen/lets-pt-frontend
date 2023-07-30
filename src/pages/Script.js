import React, { useState } from 'react'
import { ClipLoader } from "react-spinners";

const Script = () => {
  const [textareaValue, setTextareaValue] = useState("");
  const [convertedScript, setConvertedScript] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTextareaChange = (event) => {
    setTextareaValue(event.target.value);
    console.log(textareaValue);
  };

  const changeScript = async () => {
    console.log(textareaValue);
    const data = {
      question: textareaValue,
      maxTokens: 500,
    };

    try {
      setLoading(true)
      const response = await fetch("http://localhost:3001/chat-gpt-ai/message",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error("fail");
        setLoading(false);
      }

      const result = await response.text();
      console.log("서버 응답: ", result);
      setConvertedScript(result);
      setLoading(false);
    } catch (error) {
      console.error("스크립트 전송 실패:", error);
    }
  };

  return (
    <div className="script-container">
      <h1 className='script-title'>스크립트 다듬기</h1>
      <div className="script-area">
        <textarea
          value={textareaValue}
          onChange={handleTextareaChange}
          className="script-text"
          placeholder="스크립트의 다듬고 싶은 부분을 작성해주세요!"
        ></textarea>
        <button
          variant="primary"
          size="lg"
          className="script-change"
          onClick={changeScript}
        >
          변환하기
        </button>
        {loading ? (
          <div className="script-text before-change">
            답변을 생성 중입니다.
            <br />
            <ClipLoader loading={loading} color="#f88c68" size={150}></ClipLoader>
          </div>
        ) : (
          <textarea
            value={convertedScript}
            className="script-text"
            readOnly
          ></textarea>
        )}
      </div>
    </div>
  )
}

export default Script
