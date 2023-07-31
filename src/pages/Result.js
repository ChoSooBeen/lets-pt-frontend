import axios from 'axios';
import React, { useEffect, useState } from 'react'

const Result = () => {
  const [data, setData] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const title = params.get('title');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/presentation/?title=${title}`);
        setData(response.data);
        console.log(response);
      } catch (error) {
        console.log('An error occurred:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="detail-container">
      <div className="left-column">
        <h1>녹화 영상</h1>
        <p>
          편집된 영상 pdf+발표자카메라 들어가야함
        </p>
      </div>
      <div className="right-column">
        <div className='result-page-comment-container'>
          <h1 className='result-detail-page-title'>유저 코멘트</h1>
          <div className='result-comment-detail'>유저 코멘트 들어갈 자리</div>
        </div>
        <div className='result-page-timer-container'>
          <h1 className='result-detail-page-title'>상세 경과 시간</h1>
          <div className='result-timer-detail'>
            <ul>
              {data.pdfTime.map((time, index) => (
                <li>
                  <span>{index + 1}페이지</span>
                  <span>{time.minutes}</span>:
                  <span>{time.seconds}</span>
                </li>
              ))}
            </ul>

          </div>
        </div>
        <div className='result-page-eye-container'>
          <h1 className='result-detail-page-title'>시선 처리</h1>
          <div className='result-eye-detail'>시선 처리 시간 들어갈 자리</div>
        </div>
        <div className='result-page-script-container'>
          <h1 className='result-detail-page-title'>스크립트 확인</h1>
          <div>
            <h2>권장단어</h2>
            {data.recommendedWord.map((word, index) => (
              <div key={index}>
                <span>{word.word}</span> :
                <span>{word.count}</span>회
              </div>
            ))}
          </div>
          <div>
            <h2>금지단어</h2>
            {data.forbiddenWord.map((word, index) => (
              <div key={index}>
                <span>{word.word}</span> :
                <span>{word.count}</span>회
              </div>
            ))}
          </div>
          <div className='result-script-detail'>{data.sttScript}</div>
        </div>
        <div className='result-page-question-container'>
          <h1 className='result-detail-page-title'>예상질문</h1>
          <div className='result-question-detail'>예상 질문 및 추천 답변 들어갈 자리</div>
        </div>
      </div>
    </div>
  )
}

export default Result
