import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useLocation } from 'react-router-dom';
import { IoIosSend } from "react-icons/io";
import { IoExit } from "react-icons/io5";
import axios from "axios";

const Observe = () => {
  // 실시간 통신을 위한 변수 선언-----------------------------------------------
  const socket = useRef(); //소켓 객체
  const myFaceRef = useRef(); //내 비디오 요소
  const peerFaceRef = useRef(); //상대방 비디오 요소
  const myStream = useRef(null);
  const [muted, setMuted] = useState(false); //음소거 여부
  const myPeerConnection = useRef(null); //피어 연결 객체
  // ----------------------------------------------------------------------

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const visitorCode = searchParams.get('visitorcode');

  //----------------------------------------------------------------------

  const [userId, setUserId] = useState(null);

  const leavePage = () => {
    window.close();
  }

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
    const apiUrl = 'http://localhost:3001/user/';

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

  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        myStream.current = stream;
        myFaceRef.current.srcObject = myStream.current;
      } catch (error) {
        console.log(error);
      }
    };

    //RTCPeerConnection 객체 생성-----------------------------------------------
    const makeConnection = () => {
      myPeerConnection.current = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
              "stun:stun2.l.google.com:19302",
              "stun:stun3.l.google.com:19302",
              "stun:stun4.l.google.com:19302",
            ],
          },
        ],
      });
      myPeerConnection.current.addEventListener("icecandidate", handleIce);

      myPeerConnection.current.oniceconnectionstatechange = () => {
        console.log("ICE connection state change:", myPeerConnection.current.iceConnectionState);
      };

      myPeerConnection.current.ontrack = (event) => {
        console.log("got an stream from my peer", event.streams[0]);
        peerFaceRef.current.srcObject = event.streams[0];
        console.log("peerFaceRef", peerFaceRef);
      };
      if (myStream.current) {
        myStream.current.getTracks().forEach((track) => myPeerConnection.current.addTrack(track, myStream.current));
      }
    };

    const handleIce = (data) => {
      console.log(`sent candidate : ${visitorCode}`, data);
      socket.current.emit("ice", {
        visitorcode: visitorCode,
        icecandidate: data.candidate,
      });
    };

    console.log(socket);
    socket.current = io('http://localhost:3001/room', { //소켓 연결
      withCredentials: true,
    });
    console.log(socket.current);
    console.log("visitorCode : ", visitorCode);

    socket.current.on("connect", async () => {
      console.log("connect");
      await getMedia(); //비디오, 오디오 스트림 가져오기 
      makeConnection(); //RTCPeerConnection 객체 생성

      console.log("joinRoom : ", visitorCode, "admin3");
      await socket.current.emit("joinRoom", { visitorcode: visitorCode, userId: "admin3" });
    });

    socket.current.on("join-succ", async (data) => {
      console.log("joinRoom : ", data);

      //offer 생성
      const offer = await myPeerConnection.current.createOffer();
      myPeerConnection.current.setLocalDescription(offer);
      console.log(`sent the offer ${visitorCode} : `, offer);
      socket.current.emit("offer", { visitorcode: visitorCode, offer: offer });
    });

    //offer 받기
    socket.current.on("offer", async (data) => {
      console.log(`received the offer ${visitorCode} : `, data);
      myPeerConnection.current.setRemoteDescription(data.offer);
      const answer = await myPeerConnection.current.createAnswer();
      myPeerConnection.current.setLocalDescription(answer);
      socket.current.emit("answer", { visitorcode: visitorCode, answer: answer });
      console.log(`sent the answer ${visitorCode} : `, answer);
    });

    //answer 받기
    socket.current.on("answer", async (data) => {
      console.log(`received the answer ${visitorCode} : `, data.answer);
      await myPeerConnection.current.setRemoteDescription(data.answer);
    });

    //icecandidate 받기
    socket.current.on("ice", async (ice) => {
      console.log("received candidate", visitorCode, ice);
      await myPeerConnection.current.addIceCandidate(ice);
    });
  }, [visitorCode]);

  const handleMuteClick = () => {
    myStream.current.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    setMuted((prevMuted) => !prevMuted); // 상태 업데이트 방법 변경
  }

  return (
    <div className="observe-page-container">
      <header>
        <h1 className="observe-title">발표 참관 중</h1>
        <div className="observe-user-info">{userId}</div>
      </header>
      <main>
        <div className="observe-page-middle">
          <div className="pdf-area">
            <embed
              src=""
              type="application/pdf"
              width="100%"
              height="100%"
            />

            <h2 className="presentation-title">정글 중간 발표</h2>

          </div>
          <div id="call">
            <div id="myStream">
              <video
                ref={peerFaceRef}
                className="presentator-camera"
                autoPlay
                playsInline
              />
              <video
                ref={myFaceRef}
                className="observe-camera"
                autoPlay
                playsInline
                muted={muted} // 상태를 이용하여 비디오 요소의 'muted' 속성 설정
              />
              {/* <button onClick={handleMuteClick} id="mute">
              {muted ? "Unmute" : "Mute"}
            </button> */}
            </div>
          </div>
        </div>
        <div className="observe-page-bottom">
          <p className="timer">00:00</p>
          <input type="text" className="comment" placeholder="코멘트를 입력해주세요!" />
          <button className="comment-submit" type="submit"><IoIosSend size={40} /></button>
          <button className="leave-observe-page-button" onClick={leavePage}><IoExit size={60} /></button>
        </div>
      </main>
    </div>
  );
};

export default Observe;