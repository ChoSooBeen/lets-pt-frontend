import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react'
import { GoDotFill } from "react-icons/go";
import Chart from 'chart.js/auto';

const Result = () => {
  const [data, setData] = useState(null);
  const videoRef = useRef(null);

  const params = new URLSearchParams(window.location.search);
  const title = params.get('title');
  const userId = params.get('userId');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SITE_URL}/presentation/?title=${title}&userId=${userId}`);
        setData(response.data);
        console.log(response);
      } catch (error) {
        console.log('An error occurred:', error);
      }
    };
    fetchData();
  }, [title, userId]);

  const parseQna = (qnaStr) => {
    const qnaArray = qnaStr.split('\n'); // 예상 질문과 답변을 줄바꿈을 기준으로 분리
    const qnaPairs = [];
    let currentQna = { question: '', answer: '' };
    qnaArray.forEach((line) => {
      if (line.startsWith('Q')) {
        currentQna.question = line;
      } else if (line.startsWith('A')) {
        currentQna.answer = line;
        qnaPairs.push({ ...currentQna });
        currentQna = { question: '', answer: '' };
      }
    });
    return qnaPairs;
  };

  function highlightWords(script, recommendedWords, forbiddenWords) {
    let resultScript = script;
    for (const wordObj of recommendedWords) {
      const word = wordObj.word;
      const regExp = new RegExp(`${word}`, 'gi');
      resultScript = resultScript.replace(regExp, `<span class='highlight-recommended'>${word}</span>`);
    }

    for (const wordObj of forbiddenWords) {
      const word = wordObj.word;
      const regExp = new RegExp(`${word}`, 'gi');
      resultScript = resultScript.replace(regExp, `<span class='highlight-forbidden'>${word}</span>`);
    }

    return resultScript;
  }

  const formatTime = (time) => {
    const minutes = String(Math.floor(time / 60)).padStart(2, '0');
    const seconds = String(Math.floor(time % 60)).padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleVideoSeek = (time) => {
    videoRef.current.currentTime = time;
  };

  const BarGraph = ({ pdfTime }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
      if (pdfTime && pdfTime.length > 0) {
        const labels = pdfTime.map((time, index) => index + 1);
        const data = pdfTime.map((time) => time.minutes * 60 + time.seconds);

        const ctx = canvasRef.current.getContext('2d');

        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: '시간 (초)',
              data: data,
              backgroundColor: 'rgba(54, 162, 235, 0.6)', // 바 색상 변경 (예시: 파란색)
              borderColor: 'rgba(54, 162, 235, 1)', // 바 테두리 색상 변경 (예시: 파란색)
              borderWidth: 2, // 바 테두리 두께 변경
            }]
          },
          options: {
            responsive: true,
            scales: {
              x: {
                title: {
                  display: true,
                  text: '페이지 번호',
                  font: {
                    size: 20,
                    weight: "bold" // x 축 레이블 글자 크기 설정
                  }
                },
                ticks: {
                  font: {
                    size: 18, // x 축 눈금 라벨 글자 크기 설정
                    weight: 'bold' // x 축 눈금 라벨 글자 굵기 설정
                  }
                }
              },
              y: {
                title: {
                  display: true,
                  text: '시간 (초)',
                  font: {
                    size: 20,
                    weight: "bold" // y 축 레이블 글자 크기 설정 
                  }
                },
                ticks: {
                  font: {
                    size: 18, // x 축 눈금 라벨 글자 크기 설정
                    weight: 'bold' // x 축 눈금 라벨 글자 굵기 설정
                  }
                }
              }
            },
            plugins: {
              legend: {
                labels: {
                  font: {
                    size: 16, // 그래프 위에 표시되는 "시간 (초)" 텍스트의 글자 크기 설정
                    weight: 'bold' // 그래프 위에 표시되는 "시간 (초)" 텍스트의 글자 굵기 설정
                  }
                }
              },
              tooltip: {
                bodyFont: {
                  size: 20, // 툴팁 본문 글자 크기를 원하는대로 설정합니다.
                },
                titleFont: {
                  size: 24, // 툴팁 제목 글자 크기를 원하는대로 설정합니다.
                },
                callbacks: {
                  title: (context) => {
                    let title = '';
                    if (context.length > 0) {
                      title = `페이지 ${context[0].label}`; // 툴팁 제목에 '페이지' 단어를 추가합니다.
                    }
                    return title;
                  },
                  label: (context) => {
                    const value = context.parsed.y;
                    return `  ${value}초`; // 툴팁에 표시될 내용을 원하는대로 설정합니다.
                  }
                }
              }
            }
          }
        });
      }
    }, [pdfTime]);

    return (
      <div className='result-timer-detail'>
        {/* 그래프 크기를 원하는 대로 조정합니다. */}
        <canvas ref={canvasRef} style={{ width: '100%', height: '300px' }} />
      </div>
    );
  };

  return (
    <div className="detail-container">
      {data ? (
        <>
          <div className="left-column">
            <h1>녹화 영상</h1>
            <video ref={videoRef} muted controls className='result-video' width={580}>
              <source src={data.resultVideo} type='video/webm' />
              {/* 이하에 필요한 다른 영상 포맷의 소스를 추가할 수 있습니다. */}
            </video>
          </div>
          <div className="right-column">
            <div className='result-page-comment-container'>
              <h1 className='result-detail-page-title'>유저 코멘트</h1>
              <div className='result-comment-detail'>
                {data.comment.map((user, index) => (
                  <div key={index} className="user-comment-card">
                    <div className='comment-name-time-container'>
                      <GoDotFill className='comment-dot' size={50} />
                      <div className='comment-name-area'>{user.name}</div>
                      <div className='comment-time-area' onClick={() => handleVideoSeek(user.time.minute * 60 + user.time.second)}>
                        <div>{formatTime(user.time.minute * 60 + user.time.second)}</div>
                      </div>
                    </div>
                    <div className='comment-message-area'>
                      {user.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='result-page-timer-container'>
              <h1 className='result-detail-page-title'>상세 경과 시간</h1>
              <div className='total-time-area'>
                <span>{formatTime(data.progressingTime.minute * 60 + data.progressingTime.second)}</span>
                {' / '}
                <span>{formatTime(data.settingTime.minute * 60 + data.settingTime.second)}</span>
                <BarGraph pdfTime={data.pdfTime} />
              </div>
            </div>

            <div className='result-page-script-container'>
              <h1 className='result-detail-page-title'>음성 데이터</h1>
              <div>
                <h2 className='recommend-word'>강조단어</h2>
                {data.recommendedWord.map((word, index) => (
                  <div key={index} className='recommend-word-card'>
                    <GoDotFill className='dot' />
                    <span className='recommend-word-detail'>{word.word}</span> :
                    <span className='recommend-word-count'>{word.count}회</span>
                  </div>
                ))}
              </div>
              <div>
                <h2 className='forbidden-word'>금지단어</h2>
                {data.forbiddenWord.map((word, index) => (
                  <div key={index} className='forbidden-word-card'>
                    <GoDotFill className='dot' />
                    <span className='forbidden-word-detail'>{word.word}</span> :
                    <span className='forbidden-word-count'>{word.count}회</span>
                  </div>
                ))}
              </div>
              <h2 className='voice-change-result'>음성 텍스트 변환 결과</h2>
              <div className='result-script-detail' dangerouslySetInnerHTML={{ __html: highlightWords(data.sttScript, data.recommendedWord, data.forbiddenWord) }}></div>
            </div>

            <div className='result-page-question-container'>
              <h1 className='result-detail-page-title'>예상 질문 및 답변</h1>
              <div className='result-question-detail' style={{ whiteSpace: 'pre-wrap' }}>
                {parseQna(data.qna).map((qa, index) => (
                  <div key={index} className="question-answer">
                    <div className="question">{qa.question}</div>
                    <div className="answer">{qa.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div>로딩 중...</div>
      )}
    </div>
  );
};

export default Result;
