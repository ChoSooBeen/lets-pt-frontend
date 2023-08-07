import axios from 'axios';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { GoDotFill } from "react-icons/go";
import { IoIosSend } from "react-icons/io";


const Record = () => {
  const [userId, setUserId] = useState(null);
  const [data, setData] = useState(null);
  const [send, setSend] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState(0);
  const [duration, setDuration] = useState(0);
  const [comment, setComment] = useState("");
  const [commentList, setCommentList] = useState([]); // 코멘트 리스트 추가
  const intervalRef = useRef(null);
  const videoRef = useRef(null);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const presentationTitle = searchParams.get("title");
  const presentationUser = searchParams.get("userId");

  useEffect(() => {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const apiUrl = `${process.env.REACT_APP_SITE_URL}/user/`;

    axios.get(apiUrl, config)
      .then((response) => {
        console.log('서버 응답:', response.data);
        setUserId(response.data.data.name);
      })
      .catch((error) => {
        console.error('에러:', error);
      });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SITE_URL}/presentation/?title=${presentationTitle}&userId=${presentationUser}`);
        setData(response.data);
        console.log(response);
      } catch (error) {
        console.log('An error occurred:', error);
      }
    };
    fetchData();
  }, [presentationTitle, presentationUser]);

  const formatTime = useCallback((timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, []);

  const handleCommentSubmit = async (comment) => {
    const dataToSend = {
      title: presentationTitle,
      userId: presentationUser,
      userComment: {
        name: userId,
        time: {
          minute: Math.floor(timer / 60),
          second: Math.floor(timer % 60), // 소수점 이하를 버립니다.
        },
        message: comment,
      },
    };

    // 서버에 PUT 요청 보내기
    await axios.put(`${process.env.REACT_APP_SITE_URL}/presentation/update-comment`, dataToSend)
      .then((response) => {
        setSend("코멘트 전송 완료!");
      })
      .catch((error) => {
        setSend("코멘트 전송 실패");
      });

    // 코멘트 리스트에 새로운 코멘트 추가
    setCommentList((prevCommentList) => [
      ...prevCommentList,
      {
        name: userId,
        time: {
          minute: Math.floor(timer / 60),
          second: timer % 60,
        },
        message: comment,
      },
    ]);

    setComment('');
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    videoRef.current.pause();
    clearInterval(intervalRef.current);
    setTimer(0);
  };

  const handleLoadedData = () => {
    setDuration(videoRef.current.duration);
  };

  const handleVideoSeek = (time) => {
    videoRef.current.currentTime = time;
  };

  return (
    <div className="record-container">
      {data ? (
        <div className="record-video">
          <video
            ref={videoRef}
            muted
            controls
            className='record-result-video'
            width={550}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onEnded={handleVideoEnd}
            onLoadedData={handleLoadedData}
            onTimeUpdate={() => isPlaying && setTimer(videoRef.current.currentTime)}
          >
            <source src={data.resultVideo} type='video/webm' />
          </video>
        </div>
      ) : null}

      {data ? (
        <div className="record-detail">
          <h1 className='record-result-detail-page-title'>유저 코멘트 기록</h1>
          <div className='record-result-page-comment-container'>
            <div className='record-result-comment-detail'>

              {data.comment.map((user, index) => (
                <div key={index} className="record-user-comment-card" onClick={() => handleVideoSeek(user.time.minute * 60 + user.time.second)}>
                  <div className='record-comment-name-time-container'>
                    <GoDotFill className='record-comment-dot' size={30} />
                    <div className='record-comment-name-area'>{user.name}</div>
                    <div className='record-comment-time-area'>
                      <div>{`0${Math.floor(user.time.minute)}:${String(Math.floor(user.time.second)).padStart(2, "0")}`}</div>
                    </div>
                  </div>
                  <div className='record-comment-message-area'>
                    {user.message}
                  </div>
                </div>
              ))}

              {commentList.map((user, index) => (
                <div key={index} className="record-user-comment-card" onClick={() => handleVideoSeek(user.time.minute * 60 + user.time.second)}>
                  <div className='record-comment-name-time-container'>
                    <GoDotFill className='record-comment-dot' size={30} />
                    <div className='record-comment-name-area'>{user.name}</div>
                    <div className='record-comment-time-area'>
                      <div>{`0${Math.floor(user.time.minute)} : ${String(Math.floor(user.time.second)).padStart(2, "0")}`}</div>
                    </div>
                  </div>
                  <div className='record-comment-message-area'>
                    {user.message}
                  </div>
                </div>
              ))}


            </div>
          </div>
          <div className="record-comment-write">
            <p className="record-timer">{formatTime(timer)}</p>
            <input
              type="text"
              className="record-comment"
              placeholder="코멘트를 입력해주세요!"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button className="record-comment-submit" type="submit" onClick={() => handleCommentSubmit(comment)}>
              <IoIosSend size={40} />
            </button>

          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Record;
