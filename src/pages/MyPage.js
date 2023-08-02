import axios from 'axios';
import React, { useEffect, useState } from 'react'

const MyPage = () => {
  // 수정된 클라이언트 코드
  const [userId, setUserId] = useState(null);
  const [pptTitle, setPptTitle] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            Authorization: `Bearer ${token}`, // 헤더에 토큰 추가
          },
        };

        const apiUrlUser = `${process.env.REACT_APP_SITE_URL}/user/`;
        const responseUser = await axios.get(apiUrlUser, config);
        setUserId(responseUser.data.data.name);

        const apiUrlPresentation = `${process.env.REACT_APP_SITE_URL}/presentation/get-title?userId=${responseUser.data.data.name}`;
        const responsePresentation = await axios.get(apiUrlPresentation, config);
        setPptTitle(responsePresentation.data);
      } catch (error) {
        console.error('에러:', error);
        // 에러 처리 로직 추가 가능
      }
    };

    fetchData();
  }, []);


  const goToDetailPage = (title) => {
    const width = 1000;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const sendTitle = title
    const url = `/result?title=${sendTitle}`

    window.open(
      url,
      "_blank",
      `width=${width}, height=${height}, left=${left}, top=${top}, resizable=no, scrollbars=yes`
    );
  };

  const goToSharePage = (title) => {
    const width = 600;
    const height = 200;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const sendTitle = title
    const url = `/share?title=${sendTitle}`

    window.open(
      url,
      "_blank",
      `width=${width}, height=${height}, left=${left}, top=${top}, resizable=no, scrollbars=yes`
    );
  };

  return (
    <div className='mypage-container'>
      <p className='mypage-title'>
        <span className='mypage-user-nickname'>{userId}</span> 님의 발표기록
      </p>
      <div className='record-container'>
        <ul className='practice-record'>
          {pptTitle.map((title, index) => (
            <li key={index}>
              <span>{title}</span>
              <button onClick={() => goToDetailPage(title)}>결과보기</button>
              <button onClick={() => goToSharePage(title)}>영상공유</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default MyPage
