import React, { useEffect, useState } from 'react'
import logo from '../img/logo.png';
import { CgEnter } from "react-icons/cg";
import axios from 'axios';



const Home = () => {
  const [visitorcode, setVisitorCode] = useState("");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // 로컬스토리지에서 토큰 가져오기
    const token = localStorage.getItem('token');

    // Axios 요청 설정
    const config = {
      headers: {
        Authorization: `Bearer ${token}`, // 헤더에 토큰 추가
      },
    };

    // 서버로 데이터를 요청하는 예시 API 엔드포인트
    const apiUrl = 'http://3.88.168.122:3001/user/';

    // Axios를 사용하여 요청 보내기
    axios.get(apiUrl, config)
      .then((response) => {
        // 요청에 성공한 경우
        console.log('서버 응답:', response.data);
        // 서버에서 응답으로 받은 데이터를 처리하거나 상태를 업데이트할 수 있습니다.
        setUserId(response.data.data.name);
      })
      .catch((error) => {
        // 요청에 실패한 경우
        console.error('에러:', error);
        // 에러 처리 로직 추가 가능
      });
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  }


  const handleInputChange = (event) => {
    setVisitorCode(event.target.value);
    console.log(visitorcode);
  };

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

  const goToMyPage = () => {
    const width = 800;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      "/mypage",
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
    <div className='home-container'>
      <img src={logo} className="home-logo" alt="logo" width={350} />
      <div className='home-inner-container'>
        <form className='observe-container'>
          <input
            type='text'
            placeholder='참관코드를 입력해주세요'
            className='observe-text'
            value={visitorcode}
            onChange={handleInputChange}></input>
          <button className='observe-button' type="submit" onClick={goToObservePage}><CgEnter size={40} /></button>
        </form>
        <button className='practice-button' type='button' onClick={goToPracticePage}>발표 연습</button>
      </div>
      <div className='user-info-container'>
        <p className='user-info'><span className='user-nickname'>{userId}</span> 님 환영합니다! </p>
        <button className='mypage-button' onClick={goToMyPage}>마이 페이지</button>
        <button className='logout-button' onClick={logout}>로그아웃</button>
      </div>
    </div >
  )
}

export default Home
