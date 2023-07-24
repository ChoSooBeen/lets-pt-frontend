import React, { useState, useRef } from 'react'
import logo from '../img/logo.png';
import { Container, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { ClipLoader } from 'react-spinners';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';


const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [textareaValue, setTextareaValue] = useState("");
  const [convertedScript, setConvertedScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [visitorcode, setVisitorCode] = useState("");

  const handleTextareaChange = (event) => {
    setTextareaValue(event.target.value);
    console.log(textareaValue);
  };

  const handleInputChange = (event) => {
    setVisitorCode(event.target.value);
    console.log(visitorcode);
  };

  const changeScript = async () => {
    console.log(textareaValue);
    const data = {
      question: textareaValue,
      maxTokens: 1500,
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

  const handleLogin = () => {
    goToLoginPage();
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const goToLoginPage = () => {
    const width = 400;
    const height = 300;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      '/login',
      '_blank',
      `width=${width}, height=${height}, left=${left}, top=${top}, resizable=no, scrollbars=yes`
    );
  }

  const goToPracticePage = () => {
    const width = 1200;
    const height = 800;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      '/practice',
      '_blank',
      `width=${width}, height=${height}, left=${left}, top=${top}, resizable=no, scrollbars=yes`
    );
  }

  const goToObservePage = () => {
    const width = 1200;
    const height = 800;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const url = `/observe?visitorcode=${encodeURIComponent(visitorcode)}`;

    window.open(
      url,
      '_blank',
      `width=${width}, height=${height}, left=${left}, top=${top}, resizable=no, scrollbars=yes`
    );
  }
  return (
    <div>
      <Container className='header'>
        <img src={logo} className="app-logo" alt="logo" width={200} />
        <div className="join-div">
          <p className='join-title'>참관코드</p>
          <div className='join-area'>
            <input
              type='text'
              placeholder='참관코드를 입력해주세요'
              className='join-text'
              value={visitorcode}
              onChange={handleInputChange}></input>
            <Button variant='primary' className='join' onClick={goToObservePage}>참관</Button>
          </div>
          <Button variant='primary' className='join' size='lg' onClick={goToPracticePage}>발표 연습</Button>
        </div>
        {isLoggedIn ? (
          <div className='user-info' onClick={handleLogout}>
            <FontAwesomeIcon icon={faUser} className='user-img' />
            내 정보
          </div>
        ) : (
          <div className='user-info' onClick={handleLogin}>
            <FontAwesomeIcon icon={faUser} className='user-img' />
            로그인
          </div>
        )}

      </Container>
      <hr />
      <Container className="script-container">
        <h1>스크립트 다듬기</h1>
        <div className="script-area">
          <div>
            <textarea
              value={textareaValue}
              onChange={handleTextareaChange}
              className="script-text"
              placeholder="스크립트의 다듬고 싶은 부분을 작성해주세요!"
            ></textarea>
          </div>
          <div>
            <Button
              variant="primary"
              size="lg"
              className="script-change"
              onClick={changeScript}
            >
              변환하기
            </Button>
          </div>
          <div>

            {loading ? (
              <div className="script-text">

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
      </Container>
      <hr />
    </div>
  )
}

export default Home
