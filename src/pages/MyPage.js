import axios from 'axios';
import React, { useEffect, useState } from 'react'

const MyPage = () => {
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

  return (
    <div className='mypage-container'>
      <p className='mypage-title'>
        <span className='mypage-user-nickname'>{userId}</span> 님의 발표기록
      </p>
      <div className='record-container'>
        <ul className='practice-record'>
          <li><span>정글 중간 발표</span><button>영상보기</button><button>결과보기</button><button>영상공유</button></li>
          <li><span>기획 최종 발표</span><button>영상보기</button><button>결과보기</button><button>영상공유</button></li>
          <li><span>기획 2차 발표</span><button>영상보기</button><button>결과보기</button><button>영상공유</button></li>
          <li><span>기획 1차 발표</span><button>영상보기</button><button>결과보기</button><button>영상공유</button></li>
          <li><span>연습</span><button>영상보기</button><button>결과보기</button><button>영상공유</button></li>
        </ul>
      </div>
    </div>
  )
}

export default MyPage
