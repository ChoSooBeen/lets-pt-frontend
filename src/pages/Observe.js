import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const Observe = () => {
  const socket = useRef(); //소켓 객체
  const myFaceRef = useRef(); //내 비디오 요소
  const peerFaceRef = useRef(); //상대방 비디오 요소
  const [myStream, setMyStream] = useState(null); //내 스트림
  const [muted, setMuted] = useState(false); //음소거 여부
  const [cameraOff, setCameraOff] = useState(false); //카메라가 꺼져있는지 여부
  const [roomName, setRoomName] = useState(""); //참관코드
  const myPeerConnection = useRef(null); //피어 연결 객체
  const camerasSelect = useRef(null); //카메라 선택 요소

  useEffect(() => {
    socket.current = io();

    // socket event -------------------------------------------------------
    // socket.current.on("connect", (socket) => { //연결 확인
    //   console.log("connected to socket server");
    //   socket.current.emit("joinRoom", "admin");
    // });

    socket.current.on("create-succ", async () => {
      const offer = await myPeerConnection.current.createOffer();
      myPeerConnection.current.setLocalDescription(offer);
      console.log("sent the offer");
      socket.current.emit(roomName, offer);
    });

    socket.current.on("offer", async (offer) => {
      console.log("received the offer");
      myPeerConnection.current.setRemoteDescription(offer);
      const answer = await myPeerConnection.current.createAnswer();
      myPeerConnection.current.setLocalDescription(answer);
      socket.current.emit("answer", answer, "answer");
      console.log("sent the answer");
    });

    socket.current.on("answer", (answer) => {
      console.log("received the answer");
      myPeerConnection.current.setRemoteDescription(answer);
    });

    socket.current.on("ice", (ice) => {
      console.log("received candidate");
      myPeerConnection.current.addIceCandidate(ice);
    });
    // -------------------------------------------------------------------

    // RTC Code
    makeConnection();

    return () => {
      if (myPeerConnection.current) {
        myPeerConnection.current.close();
      }
      if (myStream) {
        myStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomName]);

  async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = document.querySelector("#welcome input"); // 'welcomeForm' 대신 document.querySelector를 사용
    await initCall();
    socket.current.emit("joinRoom", input.value);
    setRoomName(input.value); // 'roomName' 상태를 변경하도록 수정
    input.value = "";
  }

  async function initCall() {
    const welcome = document.getElementById("welcome"); // 'welcome'과 'call'을 document.getElementById로 찾기
    const call = document.getElementById("call");
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
  }

  async function getMedia(deviceId) {
    const initialConstrains = {
      audio: true,
      video: { facingMode: "user" },
    };
    const cameraConstraints = {
      audio: true,
      video: { deviceId: { exact: deviceId } },
    };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        deviceId ? cameraConstraints : initialConstrains
      );
      setMyStream(stream); // 'setMyStream'으로 상태 업데이트
      myFaceRef.current.srcObject = stream; // 'myFaceRef'를 사용하여 비디오 요소 업데이트
      if (!deviceId) {
        await getCameras();
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function getCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    camerasSelect.current.innerHTML = ""; // Clear previous options
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      camerasSelect.current.appendChild(option);
    });
  }

  function handleMuteClick() {
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    setMuted((prevMuted) => !prevMuted); // 상태 업데이트 방법 변경
  }

  function handleCameraClick() {
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    setCameraOff((prevCameraOff) => !prevCameraOff); // 상태 업데이트 방법 변경
  }

  async function handleCameraChange() {
    await getMedia(camerasSelect.value);
    if (myPeerConnection.current) {
      const videoTrack = myStream.getVideoTracks()[0];
      const videoSender = myPeerConnection.current.getSenders().find((sender) => sender.track.kind === "video");
      videoSender.replaceTrack(videoTrack);
    }
  }
  function makeConnection() {
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
    myPeerConnection.current.addEventListener("addstream", handleAddStream);
    if (myStream) {
      myStream.getTracks().forEach((track) => myPeerConnection.current.addTrack(track, myStream));
    }
  }

  function handleIce(data) {
    console.log("sent candidate");
    socket.current.emit("ice", data.candidate, roomName);
  }

  function handleAddStream(data) {
    peerFaceRef.current.srcObject = data.stream;
  }


  return (
    <div>
      <header>
        <h1>참관 페이지</h1>
      </header>
      <main>
        <div id="welcome">
          <form onSubmit={handleWelcomeSubmit}>
            <input
              placeholder="room name"
              required
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
            <button type="submit">Enter room</button>
          </form>
        </div>
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
            <button onClick={handleCameraClick} id="camera">
              {cameraOff ? "Turn Camera On" : "Turn Camera Off"}
            </button>
            <select onChange={handleCameraChange} id="cameras">
              {/* 옵션들을 동적으로 렌더링하도록 구현 */}
            </select>
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
