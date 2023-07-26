import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import logo from "../img/logo.png";
import axios from "axios";
import Modal from "react-modal";
import { io } from "socket.io-client";
import { BsStopCircleFill, BsStopwatchFill } from "react-icons/bs";

const Practice = () => {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPractice, setIsPractice] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [modal, setModal] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [title, setTitle] = useState("");
  const videoOutputRef = useRef(null);
  const screenRecordedVideoRef = useRef(null);
  const camRecordedVideoRef = useRef(null);
  const screenMediaStreamRef = useRef(null);
  const camMediaStreamRef = useRef(null);
  const screenMediaRecorderRef = useRef(null);
  const camMediaRecorderRef = useRef(null);
  const screenRecordedChunksRef = useRef([]);
  const camRecordedChunksRef = useRef([]);
  const quitFlag = useRef(null); //녹화 종료 버튼 클릭 여부 확인

  // 실시간 통신을 위한 변수 선언-----------------------------------------------
  const socket = useRef(); //소켓 객체
  const peerFaceRef = useRef(); //상대방 비디오 요소
  const [roomName, setRoomName] = useState(""); //참관코드
  const myPeerConnection = useRef(null); //피어 연결 객체

  let roomname;
  // ----------------------------------------------------------------------

  // stt-----------------------------------------------------------------
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef(null);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const handleStartStopListening = () => {
    // 음성 인식 시작/중지 기능 처리
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "ko-KR";
      recognitionRef.current.continuous = true;

      recognitionRef.current.onstart = () => {
        setListening(true);
        console.log("음성 인식 시작");
      };

      recognitionRef.current.onend = () => {
        setListening(false);
        console.log("음성 인식 종료");
      };

      recognitionRef.current.onresult = (event) => {
        const { transcript } = event.results[event.results.length - 1][0];
        setTranscript((prevTranscript) => prevTranscript + transcript + " ");
      };
    }

    if (listening) {
      recognitionRef.current.stop(); // 이미 시작된 경우 중지
    } else {
      recognitionRef.current.start(); // 아닌 경우 시작
    }
  };

  // --------------------------------------------------------------------------
  // 키워드 모달창 --------------------------------------------------------------

  const [recommendedWords, setRecommendedWords] = useState([]);
  const [prohibitedWords, setProhibitedWords] = useState([]);
  const [recommendedWord, setRecommendedWord] = useState('');
  const [prohibitedWord, setProhibitedWord] = useState('');
  const [keywordModal, setKeywordModal] = useState(false);

  function openKeywordModal() {
    setKeywordModal(true);
  }

  function closeKeywordModal() {
    setKeywordModal(false);
  }

  const handleRecommendedInputChange = (event) => {
    setRecommendedWord(event.target.value);
  };

  const handleProhibitedInputChange = (event) => {
    setProhibitedWord(event.target.value);
  };

  const handleRegisterRecommended = () => {
    if (recommendedWord.trim() !== '') {
      setRecommendedWords([...recommendedWords, { word: recommendedWord, count: 0 }]);
      setRecommendedWord('');
    }
  };

  const handleRegisterProhibited = () => {
    if (prohibitedWord.trim() !== '') {
      setProhibitedWords([...prohibitedWords, { word: prohibitedWord, count: 0 }]);
      setProhibitedWord('');
    }
  };

  const handleRemoveRecommended = (index) => {
    const updatedWords = recommendedWords.filter((_, i) => i !== index);
    setRecommendedWords(updatedWords);
  };

  const handleRemoveProhibited = (index) => {
    const updatedWords = prohibitedWords.filter((_, i) => i !== index);
    setProhibitedWords(updatedWords);
  };

  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
    },
  };

  Modal.setAppElement("#root");

  // --------------------------------------------------------------------------

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
    let timer;
    if (playing) {
      setIsTimerRunning(true);
      timer = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds === 59) {
            setMinutes((prevMinutes) => prevMinutes + 1);
            return 0;
          } else {
            return prevSeconds + 1;
          }
        });
      }, 1000);
    } else {
      setIsTimerRunning(false);
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  useEffect(() => {
    // 유저의 화면 공유 요청
    navigator.mediaDevices
      .getDisplayMedia({ video: true })
      .then(function (newMediaStream) {
        screenMediaStreamRef.current = newMediaStream;
      });

    // 유저의 카메라로 부터 입력을 사용할 수 있도록 요청
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(function (newMediaStream) {
        camMediaStreamRef.current = newMediaStream;
        // 카메라의 입력을 실시간으로 비디오 태그에서 확인
        videoOutputRef.current.srcObject = camMediaStreamRef.current;
        videoOutputRef.current.onloadedmetadata = function (e) {
          videoOutputRef.current.play();
        };
      });
  }, [isPractice]);

  const handleFileChange = useCallback((event) => {
    const file = event.target.files[0];
    setPdfFile(file);
  }, []);

  const pdfComponent = useMemo(() => {
    return pdfFile ? (
      <embed
        className="pdf"
        src={URL.createObjectURL(pdfFile) + "#toolbar=0&scrollbar=0"}
        type="application/pdf"
        width="100%"
        height="100%"
      />
    ) : (
      <div>
        <p>PDF 파일을 드래그 앤 드롭하거나</p>
        <input type="file" accept=".pdf" onChange={handleFileChange} />
      </div>
    );
  }, [pdfFile, handleFileChange]);

  const titleChange = (event) => {
    const newInputValue = event.target.value;
    setTitle(newInputValue);
  };

  const startPractice = () => {
    startRecording();
    setMinutes(0);
    setSeconds(0);
    handleStartStopListening();
  };

  const quitPractice = async () => {
    quitFlag.current = true;
    stopRecording();
    setMinutes(0);
    setSeconds(0);
    handleStartStopListening();
    const apiUrl = 'http://localhost:3001/presentation/';
    await axios.post(apiUrl, { "userId": userId, "title": title, "pdfURL": "pdfURL", "recommendedWord": recommendedWords, "forbiddenWord": prohibitedWords });
    setModal(true);
  };

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    setPdfFile(file);
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const startRecording = () => {
    setPlaying(true);
    setIsTimerRunning(true);
    screenRecordedChunksRef.current = [];
    camRecordedChunksRef.current = [];
    screenMediaRecorderRef.current = new MediaRecorder(
      screenMediaStreamRef.current,
      {
        mimetype: "video/webm",
      }
    );
    camMediaRecorderRef.current = new MediaRecorder(camMediaStreamRef.current, {
      mimetype: "video/webm",
    });

    screenMediaRecorderRef.current.ondataavailable = function (event) {
      if (event.data && event.data.size > 0) {
        console.log("ondataavailable");
        screenRecordedChunksRef.current.push(event.data);
        console.log("screenMediaRecorderRef: ", screenRecordedChunksRef);
      }
    };
    camMediaRecorderRef.current.ondataavailable = function (event) {
      if (event.data && event.data.size > 0) {
        console.log("ondataavailable");
        camRecordedChunksRef.current.push(event.data);
        console.log("camMediaRecorderRef: ", camRecordedChunksRef);
      }
    };

    screenMediaRecorderRef.current.onstop = function () {
      if (screenRecordedChunksRef.current.length > 0) {
        const screenBlob = new Blob(screenRecordedChunksRef.current, {
          type: "video/webm",
        });
        console.log("screenMediaRecorderRef.stop blob: ", screenBlob);
        const camBlob = new Blob(camRecordedChunksRef.current, {
          type: "video/webm",
        });
        console.log("camRecordedChunksRef.stop blob: ", camBlob);
        const screenRecordedMediaURL = URL.createObjectURL(screenBlob);
        const camRecordedMediaURL = URL.createObjectURL(camBlob);
        if (screenRecordedVideoRef.current && camRecordedVideoRef.current) {
          //아무 값도 없을 때 참조 금지
          screenRecordedVideoRef.current.src = screenRecordedMediaURL;
          camRecordedVideoRef.current.src = camRecordedMediaURL;
        }

        console.log(quitFlag);
        if (quitFlag.current === true) {
          //녹화 종료 버튼이 눌렸을 때만 서버에 데이터 전송
          const formData = new FormData();
          const nowDate = new Date();
          const token = localStorage.getItem('token');
          const config = {
            headers: {
              Authorization: `Bearer ${token}`
            }
          };

          formData.append(
            //화면 녹화 추가
            "screen",
            screenBlob,
            `screen_userID_${nowDate.getFullYear()}.${nowDate.getMonth() + 1
            }.${nowDate.getDate()}_${nowDate.getHours()}:${nowDate.getMinutes()}.webm`
          );

          formData.append(
            //웹캠 녹화 추가
            "cam",
            camBlob,
            `cam_userID_${nowDate.getFullYear()}.${nowDate.getMonth() + 1
            }.${nowDate.getDate()}_${nowDate.getHours()}:${nowDate.getMinutes()}.webm`
          );
          console.log(formData);
          formData.append("title", title);

          //영상 서버 전송
          axios
            .post("http://localhost:3001/ffmpeg/", formData, config)
            .then((response) => {
              console.log("영상 전송 완료", response.data); // 서버 응답 처리
            })
            .catch((error) => {
              console.error("영상 전송 실패:", error); // 서버 응답 처리
            });
        }
        screenMediaRecorderRef.current = null;
        console.log(screenMediaRecorderRef.current);
        camMediaRecorderRef.current = null;
        console.log(camMediaRecorderRef.current);
      }
    };
    console.log("Recording Start!");
    camMediaRecorderRef.current.start();
    screenMediaRecorderRef.current.start();
    setPlaying(true);
  };

  const stopRecording = () => {
    if (screenMediaRecorderRef.current) {
      camMediaRecorderRef.current.stop();
      screenMediaRecorderRef.current.stop();
      setPlaying(false);
      setIsTimerRunning(false);
    }
  };

  const goToDetailPage = () => {
    const width = 1000;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      "/result",
      "_blank",
      `width=${width}, height=${height}, left=${left}, top=${top}, resizable=no, scrollbars=yes`
    );
  };
  const goToScriptPage = () => {
    const width = 1000;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      "/script",
      "_blank",
      `width=${width}, height=${height}, left=${left}, top=${top}, resizable=no, scrollbars=yes`
    );
  };

  const stopPractice = () => {
    stopRecording();
    setMinutes(0);
    setSeconds(0);
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
      console.log(
        "ICE connection state change:",
        myPeerConnection.current.iceConnectionState
      );
    };

    myPeerConnection.current.ontrack = (event) => {
      console.log("got an stream from my peer", event.streams[0]);
      peerFaceRef.current.srcObject = event.streams[0];
    };
    if (camMediaStreamRef.current) {
      camMediaStreamRef.current
        .getTracks()
        .forEach((track) =>
          myPeerConnection.current.addTrack(track, camMediaStreamRef.current)
        );
    }
  };

  const handleIce = (data) => {
    console.log(`sent candidate : ${roomname}`, data);
    socket.current.emit("ice", {
      visitorcode: roomname,
      icecandidate: data.candidate,
    });
  };
  //----------------------------------------------------------------------

  const realMode = () => {
    //실전모드로 전환
    setIsPractice(false);
    makeConnection(); //피어 연결 - RTCPeerConnection 객체 생성

    console.log(socket);
    socket.current = io("http://localhost:3001/room", {
      //소켓 연결
      withCredentials: true,
    });
    console.log(socket.current);

    socket.current.on("connect", () => {
      console.log("connect");
      socket.current.emit("createRoom", { userId: "admin" });
    });

    socket.current.on("create-succ", async (room) => {
      console.log("create-succ", room);
      console.log("바뀌기 전 방이름", roomName);
      roomname = room;
      setRoomName(room);
      console.log("바뀐 방이름", roomName);


      //offer를 보내는 쪽
      const offer = await myPeerConnection.current.createOffer();
      await myPeerConnection.current.setLocalDescription(offer);
      socket.current.emit("offer", { visitorcode: room, offer: offer });
      console.log(`sent the offer : ${room}`, offer);
    });
    //offer를 받는 쪽
    socket.current.on("offer", async (data) => {
      console.log(`received the offer : ${data.visitorcode}`, data);
      myPeerConnection.current.setRemoteDescription(data.offer);
      const answer = await myPeerConnection.current.createAnswer();
      myPeerConnection.current.setLocalDescription(answer);
      socket.current.emit("answer", {
        visitorcode: data.visitorcode,
        answer: answer,
      });
      console.log(`sent the answer : ${data.visitorcode}`, answer);
    });

    //answer를 받는 쪽
    socket.current.on("answer", async (data) => {
      console.log(`received the answer : ${data.visitorcode}`, data);
      await myPeerConnection.current.setRemoteDescription(data.answer);
    });

    //ice를 받는 쪽
    socket.current.on("ice", async (ice) => {
      console.log("received candidate", ice);
      await myPeerConnection.current.addIceCandidate(ice);
    });
  };

  return (
    <div className="practice-container">
      <div className="practice-top">
        <BsStopwatchFill className="timer-icon" size={30} />
        <div className="timer-container">
          <div className="timer-area">
            <span>{minutes < 10 ? `0${minutes}` : minutes}</span> :&nbsp;
            <span>{seconds < 10 ? `0${seconds}` : seconds}</span>
            &nbsp;/&nbsp;
            <input type="number" className="minutes-input" />
            &nbsp;:&nbsp;
            <input type="number" className="seconds-input" />
          </div>
        </div>
        <button className="stop-button" onClick={stopPractice}>
          <BsStopCircleFill size={30} />
        </button>
        <div className="change-mode-button-container">
          <button className="" onClick={() => setIsPractice(true)}>
            연습모드
          </button>
          &nbsp;/&nbsp;
          <button onClick={realMode}>실전모드</button>
        </div>
        <button className="change-script-button" onClick={goToScriptPage}>
          스크립트 변환
        </button>
        <button className="keyword-button" onClick={openKeywordModal}>
          키워드 등록
        </button>
        <div className="practice-user-info">{userId}</div>
      </div>
      <div className="my-3">
        <textarea
          name="content"
          className="form-control"
          value={transcript}
          readOnly
        ></textarea>
      </div>
      <Modal isOpen={keywordModal} onRequestClose={closeKeywordModal} style={customStyles}>
        <div className='keyword-container'>
          <h1 className='keyword-title'>키워드 등록</h1>
          <div className='yes-word-container'>
            권장단어
            <input
              className="yes-word-input"
              type="text"
              placeholder='단어 입력'
              value={recommendedWord}
              onChange={handleRecommendedInputChange}
            />
            <button className='yes-word-button' onClick={handleRegisterRecommended}>
              등록
            </button>
            <div className="word-list">
              {recommendedWords.map((word, index) => (
                <div key={index} className="word-item">
                  <span>{word.word}</span>
                  <button onClick={() => handleRemoveRecommended(index)}>X</button>
                </div>
              ))}
            </div>
          </div>
          <div className='no-word-container'>
            금지단어
            <input
              className="no-word-input"
              type="text"
              placeholder='단어 입력'
              value={prohibitedWord}
              onChange={handleProhibitedInputChange}
            />
            <button className='no-word-button' onClick={handleRegisterProhibited}>
              등록
            </button>
            <div className="word-list">
              {prohibitedWords.map((word, index) => (
                <div key={index} className="word-item">
                  <span>{word.word}</span>
                  <button onClick={() => handleRemoveProhibited(index)}>X</button>
                </div>
              ))}
            </div>
          </div>
          <button className="close-keyword-modal-button" onClick={closeKeywordModal}>닫기</button>
        </div>
      </Modal>

      {isPractice ? (
        <div className="practice-camera-pdf-container">
          <div className="practice-left">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="practice-pdf-area"
            >
              {pdfComponent}
            </div>
            <textarea
              className="script-input"
              placeholder="스크립트 작성"
            ></textarea>
          </div>
          <div className="practice-right">
            <video
              ref={videoOutputRef}
              className="practice-live-camera"
              muted
            ></video>
            {playing ? (
              <p className="practice-title-save">{title}</p>
            ) : (
              <input
                type="text"
                className="practice-title"
                placeholder="발표 제목을 입력해주세요"
                value={title}
                onChange={(e) => titleChange(e)}
              />
            )}
            <br />
            {playing ? (
              <button onClick={quitPractice} className="start-stop-button">
                발표 종료
              </button>
            ) : (
              <button onClick={startPractice} className="start-stop-button">
                발표 시작
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="observe-camera-container">
            <video
              className="observe-live-camera"
              ref={peerFaceRef}
              muted
              autoPlay
            >
            </video>
          </div>
          <div className="real-camera-pdf-container">
            <div className="real-left">
              <div
                className="real-pdf-area"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {pdfComponent}
              </div>
            </div>
            <div className="real-right">
              <h2 className="observe-code-title">참관코드</h2>
              <h2 className="observe-code">{roomName}</h2>
              <video
                ref={videoOutputRef}
                className="real-live-camera"
                muted
              ></video>
              {playing ? (
                <p className="real-title-save">{title}</p>
              ) : (
                <input
                  type="text"
                  className="real-title"
                  placeholder="발표 제목을 입력해주세요"
                  value={title}
                  onChange={(e) => titleChange(e)}
                />
              )}

              <br />
              {playing ? (
                <button onClick={quitPractice} className="start-stop-button">
                  발표 종료
                </button>
              ) : (
                <button onClick={startPractice} className="start-stop-button">
                  발표 시작
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onRequestClose={() => setModal(false)}>
        <div className="modal-container">
          <img src={logo} className="modal-logo" alt="logo" width={200} />
          <h2 className="modal-title">{title}</h2>
          <video
            className="modal-video"
            ref={camRecordedVideoRef}
            autoPlay
            controls
          ></video>
          <div className="modal-button-container">
            <button className="detail-button" onClick={goToDetailPage}>
              상세보기
            </button>
            <button className="save-button">저장하기</button>
          </div>
        </div>
        <button onClick={() => setModal(false)} className="modal-close">
          닫기
        </button>
      </Modal>
    </div>
  );
};

export default Practice;