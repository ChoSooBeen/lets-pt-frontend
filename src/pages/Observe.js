import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useLocation } from 'react-router-dom';

const Observe = () => {
  // 실시간 통신을 위한 변수 선언-----------------------------------------------
  const socket = useRef(); //소켓 객체
  const myFaceRef = useRef(); //내 비디오 요소
  const peerFaceRef = useRef(); //상대방 비디오 요소
  const [myStream, setMyStream] = useState(null); //내 스트림
  const [muted, setMuted] = useState(false); //음소거 여부
  const [cameraOff, setCameraOff] = useState(false); //카메라가 꺼져있는지 여부
  const roomName = useState(""); //참관코드
  const myPeerConnection = useRef(null); //피어 연결 객체
  const camerasSelect = useRef(null); //카메라 선택 요소
  // ----------------------------------------------------------------------

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const visitorCode = searchParams.get('visitorcode');

  useEffect(() => {
    console.log(socket);
    socket.current = io('http://localhost:3001/room', { //소켓 연결
      withCredentials: true,
    });
    console.log(socket.current);

    socket.current.on("connect", () => {
      console.log("connect");
      socket.current.emit("joinRoom", { "visitorcode": visitorCode, "userId": "admin2" });
    });

    socket.current.on("join-succ", (data) => {
      console.log("joinRoom : ", data);
    });
  }, [roomName]);

  return (
    <div>
      <header>
        <h1>참관 페이지</h1>
      </header>
      <main>
        <div id="call">
          <div id="myStream">
            <video
              ref={myFaceRef}
              autoPlay
              playsInline
              width="400"
              height="400"
              muted={muted} // 상태를 이용하여 비디오 요소의 'muted' 속성 설정
            />
            {/* <button onClick={handleMuteClick} id="mute">
              {muted ? "Unmute" : "Mute"}
            </button> */}
            {/* <button onClick={handleCameraClick} id="camera">
              {cameraOff ? "Turn Camera On" : "Turn Camera Off"}
            </button> */}
            {/* <select onChange={handleCameraChange} id="cameras"> */}
              {/* 옵션들을 동적으로 렌더링하도록 구현 */}
            {/* </select> */}
            <video
              ref={peerFaceRef}
              autoPlay
              playsInline
              width="400"
              height="400"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Observe;
