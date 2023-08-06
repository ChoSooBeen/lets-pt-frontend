import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const Test = () => {
  // PDF 파일 URL
  const pdfUrl = 'https://green-2team-bucket.s3.ap-northeast-2.amazonaws.com/test.pdf'; // Replace with the URL of your PDF file.

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [arrVideoData, setArrVideoData] = useState([]);
  const [pdfInstance, setPdfInstance] = useState(null); // Declare pdfInstance here

  // Refs
  const canvasRef = useRef(null);
  const videoRecordedRef = useRef(null);

  // PDF를 이미지로 변환하여 캔버스에 렌더링 및 녹화
  const renderPdfToCanvasAndRecord = (pdf, pageNumber) => {
    pdf.getPage(pageNumber).then((page) => {
      const viewport = page.getViewport({ scale: 1 });
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = viewport.width;
      canvasRef.current.height = viewport.height;

      // PDF 페이지를 이미지로 변환하여 캔버스에 렌더링
      page.render({
        canvasContext: context,
        viewport: viewport,
        background: 'transparent', // 투명 배경 설정
      }).promise.then(() => {
        // 캔버스에 렌더링된 내용을 기반으로 녹화한 Blob 데이터를 생성하고 배열에 추가
        canvasRef.current.toBlob((blob) => {
          setArrVideoData((prevData) => [...prevData, blob]);
        }, 'video/webm');

        // 렌더링이 완료되면 녹화 시작 버튼 활성화
        setMediaRecorder(null);

        // 이전 스트림 정리 및 새로운 스트림 생성
        if (videoRecordedRef.current.srcObject) {
          videoRecordedRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        const stream = canvasRef.current.captureStream();
        const newMediaRecorder = new MediaRecorder(stream);

        // MediaRecorder.dataavailable 이벤트 처리
        newMediaRecorder.ondataavailable = (event) => {
          console.log('스트림 데이터 수집');
          // 스트림 데이터(Blob)가 들어올 때마다 배열에 담아둔다.
          setArrVideoData((prevData) => [...prevData, event.data]);
        };

        // MediaRecorder.stop 이벤트 처리
        newMediaRecorder.onstop = (event) => {
          console.log('녹화 종료');
          // 들어온 스트림 데이터들(Blob)을 통합한 Blob객체를 생성
          const blob = new Blob(arrVideoData, { type: 'video/webm' });

          // BlobURL 생성: 통합한 스트림 데이터를 가리키는 임시 주소를 생성
          const blobURL = window.URL.createObjectURL(blob);

          // 재생 구현
          videoRecordedRef.current.src = blobURL;
          videoRecordedRef.current.play();

          // 배열 초기화
          setArrVideoData([]);
        };

        // 녹화 시작
        newMediaRecorder.start();
        setMediaRecorder(newMediaRecorder);
      });
    });
  };

  useEffect(() => {
    // PDF.js를 사용하여 PDF 파일 로드
    pdfjs.getDocument(pdfUrl).promise.then((pdf) => {
      setPdfInstance(pdf); // Set the pdfInstance using the useState hook
      renderPdfToCanvasAndRecord(pdf, currentPage);
    });
  }, [pdfUrl, currentPage]);

  // "이전 페이지" 버튼 이벤트 처리
  const handlePrevClick = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  // "다음 페이지" 버튼 이벤트 처리
  const handleNextClick = () => {
    if (currentPage < pdfInstance.numPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  // 녹화 시작 함수
  const startRecording = () => {
    // 버튼 활성화
    setMediaRecorder(null); // 추가: 녹화 시작 버튼을 활성화

    renderPdfToCanvasAndRecord(pdfInstance, currentPage);

    // 이전 코드와 동일
  };

  // "녹화시작" 버튼 이벤트 처리
  const handleStartClick = () => {
    console.log('녹화시작 버튼 클릭');
    if (!mediaRecorder) {
      startRecording();
    }
  };

  // "녹화중지" 버튼 이벤트 처리
  const handleStopClick = () => {
    console.log('녹화중지 버튼 클릭');
    // 녹화 중단!
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width="1000"
        height="300"
        style={{ border: '1px solid black' }}
      ></canvas>
      <br />
      <br />

      <button onClick={handleStartClick} disabled={!!mediaRecorder}>
        녹화시작
      </button>
      <button onClick={handleStopClick} disabled={!mediaRecorder}>
        녹화중지
      </button>
      <button onClick={handlePrevClick}>이전 페이지</button>
      <button onClick={handleNextClick}>다음 페이지</button>
      <br />
      <br />

      <video
        ref={videoRecordedRef}
        controls
        style={{ border: '1px solid black' }}
      ></video>
    </div>
  );
};

export default Test;
