import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import logo from "../img/logo.png";
import observeIcon from "../img/observeicon.png";
import axios from "axios";
import * as faceapi from 'face-api.js';
import Modal from "react-modal";
import { io } from "socket.io-client";
import { BsStopCircleFill, BsStopwatchFill } from "react-icons/bs";
import { IoTimerOutline, IoCloseCircleSharp } from "react-icons/io5";
import { GrLinkNext, GrLinkPrevious } from "react-icons/gr";
import { FaUserCircle } from "react-icons/fa";
import { BiMessageAdd } from "react-icons/bi";
import { PiCopyBold } from "react-icons/pi";
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const Practice = () => {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPractice, setIsPractice] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [modal, setModal] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const pdfFileRef = useRef(null);
  const [title, setTitle] = useState("");
  const titleRef = useRef(null);
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
  const peerFaceRef = useRef([]); //상대방 비디오 요소
  const [roomName2, setRoomName2] = useState(""); //참관코드 - 화면에 바로 띄우기 위해 사용
  const myPeerConnection = useRef({}); //피어 연결 객체

  const roomName = useRef(); //참관코드 - RTC 연결에 사용되는 변수
  const [joinUser, setJoinUser] = useState([]); //접속한 유저 정보
  // ----------------------------------------------------------------------

  // stt, 표정인식-----------------------------------------------------------------
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  // const [pauseDuration, setPauseDuration] = useState(0);
  const [message, setMessage] = useState(`발표 시작 버튼을 눌러주세요!`); //메시지 띄우는 곳

  const recognitionRef = useRef(null);
  const pauseStartTimeRef = useRef(null);

  const countSmile = useRef(0);

  const compareMessage = useRef(`발표 시작 버튼을 눌러주세요!`); //메시지 비교를 위한 변수

  const faceIntervalId = useRef(null);
  const listeningIntervalId = useRef(null);

  const runFaceApi = async () => {
    const videoHeight = 315;
    const videoWidth = 420;

    await loadModels();
    setVideoOutput();

    videoOutputRef.current.addEventListener('play', () => {
      const canvas = faceapi.createCanvasFromMedia(videoOutputRef.current);
      document.body.append(canvas);
      const displaySize = { width: videoWidth, height: videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      faceIntervalId.current = setInterval(async () => {
        const detections = await faceapi.detectAllFaces(videoOutputRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        // faceapi.draw.drawDetections(canvas, resizedDetections);
        // faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

        if (resizedDetections && resizedDetections.length > 0) {
          let expressions = resizedDetections[0].expressions;
          let max = 0.00;
          let expression = 'neutral';

          Object.keys(expressions).forEach(key => {
            if (expressions[key] > max) {
              max = expressions[key];
              expression = key;
            }
          });

          if (expression === 'happy') {
            console.log('웃음', compareMessage.current);
            countSmile.current = countSmile.current > 0 ? 0 : countSmile.current - 1;
            if (compareMessage.current === `표정이 너무 굳어있네요! SMILE*^-^*` || countSmile.current >= -3) {
              compareMessage.current = '좋습니다! 계속 진행하세요!';
              setMessage('좋습니다! 계속 진행하세요!');
            }
            else {
              compareMessage.current = '발표가 진행 중입니다.';
              setMessage('발표가 진행 중입니다.');
            }
          }
          else {
            console.log('웃지 않음', compareMessage.current);
            countSmile.current = countSmile.current < 0 ? 0 : countSmile.current + 1;
            if (compareMessage.current !== `표정이 너무 굳어있네요! SMILE*^-^*` && countSmile.current >= 5) {
              compareMessage.current = `표정이 너무 굳어있네요! SMILE*^-^*`;
              setMessage(`표정이 너무 굳어있네요! SMILE*^-^*`);
            }
          }
        }
      }, 1000);
    });
  }

  const loadModels = async () => {
    const MODEL_URL = '/models';
    await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
    await faceapi.loadFaceExpressionModel(MODEL_URL);
  };

  useEffect(() => {
    let intervalId;

    if (listening) {
      intervalId = setInterval(() => {
        if (pauseStartTimeRef.current) {
          let pauseEndTime = Date.now();
          const pauseDuration = pauseEndTime - pauseStartTimeRef.current;
          console.log("무음 지속 시간 (밀리초):", pauseDuration);

          if (pauseDuration > 5000) {
            console.log("렌더링됨");
            pauseStartTimeRef.current = null; // 무음 시작 시간 초기화
            pauseEndTime = null;
          }
        }
      }, 1000);
    }

    return () => {
      clearInterval(intervalId);
      pauseStartTimeRef.current = null; // 컴포넌트가 언마운트되면 무음 시작 시간 초기화
    };
  }, [listening]);

  const handleStartStopListening = () => {
    if (!recognitionRef.current) {
      const isSpeechRecognitionSupported =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!isSpeechRecognitionSupported) {
        console.log("현재 브라우저에서 SpeechRecognition API를 지원하지 않습니다.");
        return;
      }

      recognitionRef.current = new isSpeechRecognitionSupported();
      recognitionRef.current.lang = "ko-KR";
      recognitionRef.current.continuous = true;

      recognitionRef.current.onstart = () => {
        setListening(true);
        console.log("음성 인식 시작");
      };

      recognitionRef.current.onend = () => {
        setListening(false);
        console.log("음성 인식 종료");
        pauseStartTimeRef.current = null;
      };

      recognitionRef.current.onresult = (event) => {
        const { transcript } = event.results[event.results.length - 1][0];
        setTranscript((prevTranscript) => prevTranscript + transcript + " ");
        pauseStartTimeRef.current = Date.now();
      };
    }

    if (listening) {
      recognitionRef.current.stop();
      pauseStartTimeRef.current = null; // 음성이 인식이 종료되면 무음 시작 시간 초기화
    } else {
      recognitionRef.current.start();
      pauseStartTimeRef.current = Date.now(); // 음성이 인식되면 무음 시작 시간 초기화
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
    const apiUrl = `${process.env.REACT_APP_SITE_URL}/user/`;

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

  const [inputMinutes, setInputMinutes] = useState("");
  const [inputSeconds, setInputSeconds] = useState("");

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

  function setVideoOutput() {
    videoOutputRef.current.srcObject = camMediaStreamRef.current;
    videoOutputRef.current.onloadedmetadata = function (e) {
      videoOutputRef.current.play();
    };
  }

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
        // 카메라의 입력을 실시간으로 비디오 태그에
        setVideoOutput();

        // 이 함수 두 번 쓰지 말고 아예 지우고 하는 법 알아보기!!
      })
  }, []);

  useEffect(() => {
    setVideoOutput();
  }, [isPractice]);

  // pdf 관련 함수들--------------------------------------
  const [scriptText, setscriptText] = useState("");
  const [scriptArray, setScriptArray] = useState([]);
  const [currentScriptIndex, setcurrentScriptIndex] = useState(0);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageTimeArray, setPageTimeArray] = useState([]);
  const [prevTime, setPrevTime] = useState(null);


  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    console.log(file);

    let formData = new FormData();
    formData.append('pdf', file);

    axios.post(`${process.env.REACT_APP_SITE_URL}/s3/pdf`, formData)
      .then(response => {
        setPdfFile(response.data);
        pdfFileRef.current = response.data;
      });
    console.log(pdfFile);
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }


  // function msToTime(duration) {
  //   let minutes = Math.floor((duration / (1000 * 60)) % 60),
  //     seconds = Math.ceil((duration / 1000) % 60);

  //   minutes = (minutes < 10) ? "0" + minutes : minutes;
  //   seconds = (seconds < 10) ? "0" + seconds : seconds;

  //   return minutes + ":" + seconds;
  // }

  function nextPage() {
    if (playing && prevTime && pageNumber < numPages) {
      const currentTime = Date.now();
      const timeDifference = currentTime - prevTime;

      const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
      const seconds = Math.ceil((timeDifference / 1000) % 60);

      setPageTimeArray(prevArray => [...prevArray, { minutes, seconds }]);
      setPrevTime(currentTime);
    }
    setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages));
  }

  function prevPage() {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  }

  const handleChange = (event) => {
    setscriptText(event.target.value);
  };

  const handleSave = () => {
    if (scriptText.trim() === "") {
      setScriptArray((prevArray) => [...prevArray, "해당 페이지에는 스크립트 내용이 없습니다."]);
    } else {
      setScriptArray((prevArray) => [...prevArray, scriptText]);
    }
    setscriptText("");
    if (!playing) {
      setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages));
    } else {
      nextPage();
    }
    if (numPages === scriptArray.length + 1) {
      alert("마지막 페이지입니다");
    }
  };

  const handlePrevious = () => {
    if (!playing) {
      setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
      setscriptText(scriptArray[pageNumber - 2]);
    }
  };

  const handleArrowKey = (event) => {
    if (playing) {
      if (event.key === "ArrowLeft") {
        setcurrentScriptIndex((prevIndex) => Math.max(prevIndex - 1, 0));
        if (!isPractice) {
          //socket으로 참관자들에게 왼쪽 이벤트 발생 알리기
          console.log("leftArrow");
          socket.current.emit("leftArrow");
        }
        prevPage();
      } else if (event.key === "ArrowRight") {
        setcurrentScriptIndex((prevIndex) => Math.min(prevIndex + 1, scriptArray.length - 1));
        if (!isPractice) {
          //socket으로 참관자들에게 오른쪽 이벤트 발생 알리기
          console.log("rightArrow");
          socket.current.emit("rightArrow");
        }
        if (pageNumber < numPages) {
          nextPage();
        } else if (pageNumber === numPages && pageTimeArray.length < numPages - 1) {
          const currentTime = Date.now();
          const timeDifference = currentTime - prevTime;

          const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
          const seconds = Math.ceil((timeDifference / 1000) % 60);

          setPageTimeArray(prevArray => [...prevArray, { minutes, seconds }]);
          setPrevTime(currentTime);
        }
      }
    }
  };

  useEffect(() => {

    window.addEventListener("keydown", handleArrowKey);

    return () => {
      window.removeEventListener("keydown", handleArrowKey);
    };
  }, [currentScriptIndex, playing, pageNumber, numPages]);


  const pdfComponent =
    (pdfFile ? (
      <div>
        <Document
          file={pdfFile}
          onLoadSuccess={onDocumentLoadSuccess}
        >
          <Page pageNumber={pageNumber} width={isPractice ? "560" : "728"} />
        </Document>
      </div>
    ) : (
      <div className="pdf-file-drag-drop-container">
        <p className="pdf-file-drag-drop">PDF 파일을 드래그 & 드롭해주세요</p>
      </div>

    ))

  const titleChange = (event) => {
    const newInputValue = event.target.value;
    setTitle(newInputValue);
    titleRef.current = newInputValue;
    console.log(title);
  };

  const startPractice = async () => {
    if (title === "") {
      window.alert('발표 제목을 입력해주세요!');
      return;
    }
    setMinutes(0);
    setSeconds(0);
    setcurrentScriptIndex(0);
    setPageNumber(1);
    compareMessage.current = `발표가 진행 중입니다.`;
    setMessage(`발표가 진행 중입니다.`);
    handleStartStopListening();
    setPrevTime(Date.now());
    startRecording();
    if (!isPractice) {
      socket.current.emit("start-timer"); //socket으로 참관자들에게 타이머 시작 알리기
    } else {
      runFaceApi();
    }
  };

  const [resultMinutes, setResultMinutes] = useState();
  const [resultSeconds, setResultSeconds] = useState();
  const [resultScript, setResultScript] = useState();

  const quitPractice = async () => {
    quitFlag.current = true;
    stopRecording();
    if (!isPractice) {
      socket.current.emit("stop-timer"); //socket으로 참관자들에게 타이머 종료 알리기
    }
    else {
      clearInterval(faceIntervalId.current); //얼굴인식 멈춤
      faceIntervalId.current = null;
      clearInterval(listeningIntervalId.current); //음성인식 멈춤
      listeningIntervalId.current = null;
      compareMessage.current = `발표 시작 버튼을 눌러주세요!`;
      setMessage(`발표 시작 버튼을 눌러주세요!`);
    }
    handleStartStopListening();
    const apiUrl = `${process.env.REACT_APP_SITE_URL}/presentation/`;
    const transmissionData = {
      "userId": userId,
      "title": title,
      "pdfURL": pdfFile,
      "recommendedWord": recommendedWords,
      "forbiddenWord": prohibitedWords,
      "sttScript": transcript,
      "pdfTime": pageTimeArray,
      "settingTime": { "minute": inputMinutes, "second": inputSeconds },
      "progressingTime": {
        "minute": minutes, "second": seconds
      },
    };
    await axios.post(apiUrl, transmissionData);
    setResultMinutes(minutes);
    setResultSeconds(seconds);
    setResultScript(transcript);
    setModal(true);
    setMinutes(0);
    setSeconds(0);
    setTranscript("");
    setPageTimeArray([]);
  };

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
          formData.append("userId", userId);

          //영상 서버 전송
          axios
            .post(`${process.env.REACT_APP_SITE_URL}/ffmpeg/`, formData, config)
            .then((response) => {
              console.log("영상 전송 완료", response.data); // 서버 응답 처리
            })
            .catch((error) => {
              console.error("영상 전송 실패:", error); // 서버 응답 처리
            });
        }
        screenMediaRecorderRef.current = null;
        camMediaRecorderRef.current = null;
      }
    };
    console.log("Recording Start!");
    camMediaRecorderRef.current.start();
    screenMediaRecorderRef.current.start();
    setPlaying(true);
  };

  const stopRecording = () => {
    const currentTime = Date.now();
    const timeDifference = currentTime - prevTime;
    const lastMinutes = Math.floor((timeDifference / (1000 * 60)) % 60);
    const lastSeconds = Math.ceil((timeDifference / 1000) % 60);
    pageTimeArray.push({ minutes: lastMinutes, seconds: lastSeconds });

    if (screenMediaRecorderRef.current) {
      camMediaRecorderRef.current.stop();
      screenMediaRecorderRef.current.stop();
      setPlaying(false);
      setIsTimerRunning(false);
    }
  };

  const handleModalOpen = async () => {
    if (camRecordedVideoRef.current) {
      const camBlob = new Blob(camRecordedChunksRef.current, {
        type: "video/webm",
      });

      // Blob 데이터를 Data URL로 인코딩
      const camRecordedMediaDataUrl = await getBlobDataUrl(camBlob);
      camRecordedVideoRef.current.src = camRecordedMediaDataUrl;
    }
  };

  // Blob 데이터를 Data URL로 인코딩하는 함수
  function getBlobDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const goToDetailPage = () => {
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
    if (isPractice) {
      clearInterval(faceIntervalId.current); //얼굴인식 멈춤
      faceIntervalId.current = null;
      clearInterval(listeningIntervalId.current); //음성인식 멈춤
      listeningIntervalId.current = null;
      compareMessage.current = `발표 시작 버튼을 눌러주세요!`;
      setMessage(`발표 시작 버튼을 눌러주세요!`);
    }
    handleStartStopListening();
    stopRecording();
    setMinutes(0);
    setSeconds(0);
    setPageTimeArray([]);
  };

  //실전모드-----------------------------------------------------------------
  const realMode = () => {
    setIsPractice(false);

    socket.current = io(`${process.env.REACT_APP_SITE_URL}/room`, { //소켓 연결
      withCredentials: true,
    });
    console.log(socket.current);

    socket.current.on("connect", () => {
      console.log("connect : ", socket.current.id);
      //방 생성
      socket.current.emit("createRoom", { userId: userId });
    });

    //방 생성 성공 - 참관코드 부여
    socket.current.on("create-succ", async (roomCode) => {
      console.log("create-succ", roomCode);
      setRoomName2(roomCode);
      roomName.current = roomCode;
    });

    //offer를 받는 쪽
    socket.current.on("offer", async (data) => {
      console.log(`from ${data.from} received the offer : `, data);
      if (!myPeerConnection.current[data.from]) {
        makeConnection(data.from);
      }

      if (myPeerConnection.current[data.from].connectionState === "stable") {
        console.log("Ignoring offer, connection already established.");
        return;
      }

      myPeerConnection.current[data.from].setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await myPeerConnection.current[data.from].createAnswer();
      await myPeerConnection.current[data.from].setLocalDescription(answer);

      //answer를 보내는 쪽
      socket.current.emit("answer", {
        visitorcode: data.visitorcode,
        answer: answer,
        to: data.from,
      });
      console.log(`${data.from} sent the answer : `, answer);
    });

    //answer 받기
    socket.current.on("answer", async (data) => {
      console.log(`${data.from} received the answer : `, data.answer);

      await myPeerConnection.current[data.from].setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    //ice를 받는 쪽
    socket.current.on("ice", async (data) => {
      console.log("received candidate", data);
      if (myPeerConnection.current[data.from]) {
        await myPeerConnection.current[data.from].addIceCandidate(
          data.icecandidate
        );
      }
    });

    //참관자 입장
    socket.current.on("user-join", async (data) => {
      await socket.current.emit("title-url", { 'title': titleRef.current, 'pdfURL': pdfFileRef.current, 'userName': userId });
      setJoinUser(data.filter((id) => id !== socket.current.id));
      console.log("title-url", titleRef.current, pdfFileRef.current);
    });

    const makeConnection = (id) => {
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
      myPeerConnection.current[id].addEventListener("icecandidate", (data) => handleIce(data, id));

      myPeerConnection.current[id].oniceconnectionstatechange = () => {
        console.log("ICE connection state change:", myPeerConnection.current[id].iceConnectionState);
      };

      myPeerConnection.current[id].ontrack = (event) => {
        console.log("got an stream from my peer", id, event.streams[0]);
        peerFaceRef.current[id].srcObject = event.streams[0];
      };
      console.log(`myPeerConnection.current[${id}].ontrack`, myPeerConnection.current[id]);

      if (camMediaStreamRef.current) {
        camMediaStreamRef.current
          .getTracks()
          .forEach((track) =>
            myPeerConnection.current[id].addTrack(track, camMediaStreamRef.current)
          );
      }
    };

    const handleIce = (data, id) => {
      console.log(`sent candidate : ${data}`);
      socket.current.emit("ice", {
        visitorcode: roomName.current,
        icecandidate: data.candidate,
        to: id,
      });
    };

  };

  //input값 음수로 못가게 제한하는 함수
  const handleMinutesChange = (e) => {
    const newValue = parseInt(e.target.value);
    setInputMinutes(Math.max(0, newValue)); // 입력값과 0 중 더 큰 값으로 설정
  };

  const handleSecondsChange = (e) => {
    const newValue = parseInt(e.target.value);
    setInputSeconds(Math.max(0, newValue)); // 입력값과 0 중 더 큰 값으로 설정
  };

  const copyRoomName = () => {
    navigator.clipboard.writeText(roomName2);
  }

  //스크립트 숨기기 기능 추가
  const [showScript, setShowScript] = useState(true);
  const handleToggleScript = () => {
    setShowScript((prevShowScript) => !prevShowScript); // 스크립트 보이기/숨기기 상태를 반전시킴
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
            <input
              type="number"
              className="minutes-input"
              value={inputMinutes}
              onChange={(e) => {
                setInputMinutes(e.target.value);
                handleMinutesChange(e);
              }}
            />
            &nbsp;:&nbsp;
            <input
              type="number"
              className="seconds-input"
              value={inputSeconds}
              onChange={(e) => {
                setInputSeconds(e.target.value);
                handleSecondsChange(e);
              }}
            />
          </div>
        </div>
        <button className="stop-button" onClick={stopPractice}>
          <BsStopCircleFill size={30} />
        </button>
        <div className="change-mode-button-container">
          <button className={`mode-button ${isPractice ? 'active-practice' : ''}`} onClick={() => setIsPractice(true)}>
            연습모드
          </button>
          &nbsp;/&nbsp;
          <button className={`mode-button ${isPractice ? '' : 'active-real'}`} onClick={realMode}>실전모드</button>
        </div>
        <div className="script-keyword-button-container">
          <button className="change-script-button" onClick={goToScriptPage}>
            스크립트 변환
          </button>
          <button className="keyword-button" onClick={openKeywordModal}>
            키워드 등록
          </button>
        </div>
        <div className="practice-user-info">
          <FaUserCircle size={40} className="user-icon" />
          <div className="top-user-info">
            {userId}
          </div>
        </div>
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
            강조단어
            <input
              className="yes-word-input"
              type="text"
              placeholder='단어 입력'
              value={recommendedWord}
              onChange={handleRecommendedInputChange}
            />
            <button className='yes-word-button' onClick={handleRegisterRecommended}>
              <BiMessageAdd size={30} />
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
              <BiMessageAdd size={30} />
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
          <button className="close-keyword-modal-button" onClick={closeKeywordModal}><IoCloseCircleSharp size={30} /></button>
        </div>
      </Modal>

      {isPractice ? (
        <div className="practice-camera-pdf-container">
          <div className="practice-left">
            <div className="observer-container">
              <img src={observeIcon} className="observe-icon" alt="observer" width={180} />
              <img src={observeIcon} className="observe-icon" alt="observer" width={180} />
              <img src={observeIcon} className="observe-icon" alt="observer" width={180} />
            </div>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="practice-pdf-area"
            >
              {pdfComponent}
            </div>
            <div className="prev-next-button-container">
              {!playing && (
                <button onClick={handlePrevious} className="prev-page-button">
                  <GrLinkPrevious size={24} />
                </button>
              )}
              <p className="page-area">
                페이지 {pageNumber || (numPages ? 1 : "--")} / {numPages || "--"}
              </p>
              {!playing && (
                <button onClick={handleSave} className="next-page-button">
                  <GrLinkNext size={24} />
                </button>
              )}
              {playing ? (
                <button onClick={handleToggleScript} className="script-show-button">
                  {showScript ? "스크립트 숨기기" : "스크립트 보기"}
                </button>
              ) : null}

            </div>
            {!playing && (
              <textarea
                className="script-input"
                placeholder="스크립트 작성"
                value={scriptText}
                onChange={handleChange}
              />
            )}
            {playing && (
              <div>
                {showScript &&
                  scriptArray[currentScriptIndex].split("\n").map((line, lineIndex) => (
                    <div key={lineIndex} className="script-save">
                      {line}
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div className="practice-right">
            <div className="message">{message}</div>
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
              <button onClick={quitPractice} className="practice-stop-button">
                발표 종료
              </button>
            ) : (
              <button onClick={startPractice} className="practice-start-button">
                발표 시작
              </button>
            )}
          </div>
        </div>

      ) : (
        <div>
          <div className="observe-camera-container">
            {joinUser.map((user, index) => (
              <video key={index}
                ref={(el) => {
                  peerFaceRef.current[user] = el
                }}
                muted
                autoPlay
                width={200}
              >
              </video>
            ))}

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
              <p className="real-page-area">
                페이지 {pageNumber || (numPages ? 1 : "--")} / {numPages || "--"}
              </p>
            </div>
            <div className="real-right">
              <h2 className="observe-code-title">참관코드</h2>
              <div className="observe-code">
                <h2>{roomName2}</h2>
              </div>
              <button onClick={copyRoomName} className="copy-button"><PiCopyBold size={30} /></button>
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
                <button onClick={quitPractice} className="practice-stop-button">
                  발표 종료
                </button>
              ) : (
                <button onClick={startPractice} className="practice-start-button">
                  발표 시작
                </button>
              )}
            </div>
          </div>
        </div>
      )
      }

      <Modal isOpen={modal} onRequestClose={() => setModal(false)} onAfterOpen={handleModalOpen}>
        <div className="modal-container">
          <div className="modal-left">
            <div className="modal-keyword-container modal-result-summary">
              <h1>등록된 키워드</h1>
              <div className="modal-recommend-word-container">
                <h2 className="modal-recommend-word-title">강조 단어</h2>
                <div className="modal-recommend-word">
                  {recommendedWords.map((word, index) => (
                    <div>
                      {word.word}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-forbidden-word-container">
                <h2 className="modal-forbidden-word-title">금지 단어</h2>
                <div className="modal-forbidden-word">
                  {prohibitedWords.map((word, index) => (
                    <div>
                      {word.word}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-timer-container modal-result-summary">
              <h1>경과 시간 / 설정 시간</h1>
              <IoTimerOutline size={100} className="modal-timer-icon" />
              <div className="modal-time-detail">
                {resultMinutes}분 {resultSeconds} 초 / {inputMinutes}분 {inputSeconds} 초
              </div>
            </div>
          </div>
          <div className="modal-middle">
            <img src={logo} className="modal-logo" alt="logo" width={250} />
            <h2 className="modal-title">{title}</h2>
            <video
              className="modal-video"
              ref={camRecordedVideoRef}
              autoPlay
              controls
              muted
              width={300}
            ></video>
            <div className="modal-button-container">
              <button className="modal-close" onClick={() => setModal(false)}>닫기</button>
              <button className="detail-button" onClick={goToDetailPage}>
                상세보기
              </button>
            </div>
          </div>
          <div className="modal-right">
            <div className="modal-eye-container modal-result-summary">
              <h1>시선 처리</h1>
            </div>
            <div className="modal-question-container modal-result-summary">
              <h1>음성 텍스트 변환</h1>
              <p>
                {resultScript}
              </p>
            </div>

          </div>
        </div>
      </Modal>
    </div >
  );
};

export default Practice;