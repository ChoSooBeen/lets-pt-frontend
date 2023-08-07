import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { MdDelete } from "react-icons/md";

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
  }, [userId]);


  const goToDetailPage = (title) => {
    const width = 1000;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const sendTitle = title
    const url = `/result?title=${sendTitle}&userId=${userId}`

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
    const url = `/share?title=${sendTitle}&userId=${userId}`

    window.open(
      url,
      "_blank",
      `width=${width}, height=${height}, left=${left}, top=${top}, resizable=no, scrollbars=yes`
    );
  };

  const deleteResult = async (title) => {
    try {
      // 실제 데이터베이스에서 타이틀을 삭제하는 API 엔드포인트 URL로 대체해주세요.
      const apiUrlDelete = `${process.env.REACT_APP_SITE_URL}/presentation/delete`;

      // 해당 타이틀을 페이로드로 전송하여 삭제 요청을 보냅니다.
      const response = await axios.post(apiUrlDelete, { title, userId });
      alert("발표 연습 기록이 삭제됐습니다.")
      window.location.reload();
      // 삭제가 성공적으로 이루어졌을 경우, pptTitle 상태에서 삭제된 타이틀을 제거합니다.
    } catch (error) {
      console.error('에러:', error);
    }
  };

  return (
    <div className='mypage-container'>
      <p className='mypage-title'>
        <span className='mypage-user-nickname'>{userId}</span> 님의 발표기록
      </p>
      <div className='mypage-record-container'>
        <ul className='practice-record'>
          {pptTitle.map((title, index) => (
            <li key={index}>
              <span>{title}</span>
              <button onClick={() => goToDetailPage(title)}>결과보기</button>
              <button onClick={() => goToSharePage(title)}>영상공유</button>
              <button id='delete-button' onClick={() => deleteResult(title)}><MdDelete size={40} /></button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default MyPage
