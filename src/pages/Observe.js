import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useLocation } from 'react-router-dom';

const Observe = () => {
  // 실시간 통신을 위한 변수 선언-----------------------------------------------
  const socket = useRef(); //소켓 객체
  const myFaceRef = useRef(); //내 비디오 요소
  const peerFaceRef = useRef(); //상대방 비디오 요소
  // const [myStream, setMyStream] = useState(null); //내 스트림
  // let myStream;
  const myStream = useRef(null);
  const [muted, setMuted] = useState(false); //음소거 여부
  const myPeerConnection = useRef(null); //피어 연결 객체
  // ----------------------------------------------------------------------

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const visitorCode = searchParams.get('visitorcode');

  //----------------------------------------------------------------------
  
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
  
    // const handleAddStream = (data) => {
    //   console.log("got an stream from my peer", data.stream);
    //   peerFaceRef.current.srcObject = data.stream;
    //   console.log("peerFaceRef", peerFaceRef);
    //   console.log("peerFaceRef.current", peerFaceRef.current);
    //   console.log("peerFaceRef.current.srcObject", peerFaceRef.current.srcObject);
    // }
  
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
      }
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
      
      console.log("joinRoom : ", visitorCode,"admin3" );
      await socket.current.emit("joinRoom", { visitorcode: visitorCode, userId: "admin3" });
    });

    socket.current.on("join-succ", async (data) => {
      console.log("joinRoom : ", data);
  
      //offer 생성
      const offer = await myPeerConnection.current.createOffer();
      myPeerConnection.current.setLocalDescription(offer);
      console.log(`sent the offer ${visitorCode} : `, offer);
      socket.current.emit("offer", {visitorcode: visitorCode, offer: offer});
    });

    //offer 받기
    socket.current.on("offer", async (data) => {
      console.log(`received the offer ${visitorCode} : `, data);
      myPeerConnection.current.setRemoteDescription(data.offer);
      const answer = await myPeerConnection.current.createAnswer();
      myPeerConnection.current.setLocalDescription(answer);
      socket.current.emit("answer", {visitorcode: visitorCode, answer: answer});
      console.log(`sent the answer ${visitorCode} : `, answer);
    });
  
    //answer 받기
    socket.current.on("answer", async (data) => {
      console.log(`received the answer ${visitorCode} : `, data.answer);
      await myPeerConnection.current.setRemoteDescription(data.answer);
    });
  
    //icecandidate 받기
    socket.current.on("ice", async (ice) => {
      console.log("received candidate",visitorCode, ice);
      await myPeerConnection.current.addIceCandidate(ice);
    });
  }, [visitorCode]);

  const handleMuteClick = () => {
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    setMuted((prevMuted) => !prevMuted); // 상태 업데이트 방법 변경
  }

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
            <button onClick={handleMuteClick} id="mute">
              {muted ? "Unmute" : "Mute"}
            </button>
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
