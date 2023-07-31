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
  const peerFaceRef = useRef({}); //상대방 비디오 요소
  const myStream = useRef(null);
  const [muted, setMuted] = useState(false); //음소거 여부
  const myPeerConnection = useRef({}); //피어 연결 객체

  const joinUser = useRef([]); //접속한 유저 정보
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
    const makeConnection = (id) => {
      return new Promise((resolve, reject) => {
        myPeerConnection.current[id] = new RTCPeerConnection({
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
        console.log("Peer connection created for ID:", id, myPeerConnection.current[id]);
        myPeerConnection.current[id].addEventListener("icecandidate", (data) => handleIce(data, id));

        myPeerConnection.current[id].oniceconnectionstatechange = () => {
          console.log("ICE connection state change:", myPeerConnection.current[id].iceConnectionState);
        };

        console.log(`myPeerConnection.current[${id}].ontrack`, myPeerConnection.current[id]);
        myPeerConnection.current[id].ontrack = (event) => {
          console.log("got an stream from my peer", event.streams[0]);

          if (!peerFaceRef.current[id]) {
            peerFaceRef.current[id] = document.createElement("video");
            peerFaceRef.current[id].autoplay = true;
            peerFaceRef.current[id].playsInline = true;
          }

          peerFaceRef.current[id].srcObject = event.streams[0];
          console.log("peerFaceRef", peerFaceRef.current[id].srcObject);
        };

        if (myStream.current) {
          myStream.current.getTracks().forEach((track) => myPeerConnection.current[id].addTrack(track, myStream.current));
        }

        resolve();
      });
    };

    const handleIce = (data, id) => {
      console.log(`${id} sent candidate : `, data);
      socket.current.emit("ice", {
        visitorcode: visitorCode,
        icecandidate: data.candidate,
        to: id,
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

      console.log("joinRoom : ", visitorCode, userId);
      await socket.current.emit("joinRoom", { visitorcode: visitorCode, userId: userId });
    });

    socket.current.on("join-succ", async (data) => {
      console.log("joinRoom : ", data);

      try {
        console.log("socket.current.id: ", socket.current.id);
        // console.log("userlist : ", data.userlist);
        joinUser.current = data.userlist;
        console.log("joinUser.current : ", joinUser.current);
        for (const id in data.userlist) {
          if (data.userlist[id] !== socket.current.id) {
            if (!myPeerConnection.current[data.userlist[id]]) {
              await makeConnection(data.userlist[id]); //상대방과 연결 객체 생성
              //offer 생성
              const offer = await myPeerConnection.current[data.userlist[id]].createOffer();
              myPeerConnection.current[data.userlist[id]].setLocalDescription(offer);
              console.log(`sent the offer ${data.userlist[id]} : `, offer);
              socket.current.emit("offer", { visitorcode: visitorCode, offer: offer, to: data.userlist[id] });
            }
          }
        }
      } catch (error) {
        console.log("Error creating offer!", error);
      }
    });

    socket.current.on("join-fail", (data) => {
      console.log("Fail join-Room : ", data);
    });

    //offer 받기
    socket.current.on("offer", async (data) => {
      console.log(`${data.from} received the offer : `, data);

      if (!myPeerConnection.current[data.from]) {
        await makeConnection(data.from);
      }

      if (myPeerConnection.current[data.from].connectionState === "stable") {
        console.log("Ignoring offer, connection already established.");
        return;
      }

      //answer 보내기
      myPeerConnection.current[data.from].setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await myPeerConnection.current[data.from].createAnswer();
      myPeerConnection.current[data.from].setLocalDescription(answer);
      socket.current.emit("answer", { visitorcode: visitorCode, answer: answer, to: data.from });
      console.log(`${data.from} sent the answer : `, answer);
    });

    //answer 받기
    socket.current.on("answer", async (data) => {
      console.log(`${data.from} received the answer : `, data.answer);

      await myPeerConnection.current[data.from].setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    //icecandidate 받기
    socket.current.on("ice", async (data) => {
      console.log("received candidate", data.visitorcode, data.icecandidate);
      if (myPeerConnection.current[data.from]) {
        await myPeerConnection.current[data.from].addIceCandidate(data.icecandidate);
      }
    });

    //pdf 이벤트 받기
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
            <iframe
              src="https://speech-video-storage.s3.ap-northeast-2.amazonaws.com/%C3%A1%C2%84%C2%80%C3%A1%C2%85%C2%B3%C3%A1%C2%84%C2%85%C3%A1%C2%85%C2%B5%C3%A1%C2%86%C2%AB%C3%A1%C2%84%C2%87%C3%A1%C2%85%C2%A1%C3%A1%C2%86%C2%AB_2%C3%A1%C2%84%C2%90%C3%A1%C2%85%C2%B5%C3%A1%C2%86%C2%B7_%C3%A1%C2%84%C2%87%C3%A1%C2%85%C2%A1%C3%A1%C2%86%C2%AF%C3%A1%C2%84%C2%91%C3%A1%C2%85%C2%AD%C3%A1%C2%84%C2%89%C3%A1%C2%85%C2%B5%C3%A1%C2%84%C2%8C%C3%A1%C2%85%C2%A1%C3%A1%C2%86%C2%A8%C3%A1%C2%84%C2%92%C3%A1%C2%85%C2%A1%C3%A1%C2%84%C2%80%C3%A1%C2%85%C2%A6%C3%A1%C2%86%C2%BB%C3%A1%C2%84%C2%89%C3%A1%C2%85%C2%B3%C3%A1%C2%86%C2%B8%C3%A1%C2%84%C2%82%C3%A1%C2%85%C2%B5%C3%A1%C2%84%C2%83%C3%A1%C2%85%C2%A1.pdf#toolbar=0&scrollbar=0"
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
                muted
              />
              <video
                ref={myFaceRef}
                className="observe-camera"
                autoPlay
                playsInline
                muted // 상태를 이용하여 비디오 요소의 'muted' 속성 설정
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
