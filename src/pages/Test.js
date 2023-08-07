import React, { useRef, useState } from 'react';
import { Page, pdfjs } from 'react-pdf';


pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function Test() {
  const pdfUrl = 'https://green-2team-bucket.s3.ap-northeast-2.amazonaws.com/TCP_IP.pdf';
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfInstance, setPdfInstance] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const loadPdf = async () => {
    try {
      const pdf = await pdfjs.getDocument(pdfUrl).promise;
      setPdfInstance(pdf);
      return renderPdfToCanvas(pdf, currentPage);
    } catch (error) {
      console.error('PDF 로드 중 오류 발생:', error);
    }
  };

  const renderPdfToCanvas = async (pdf, pageNumber) => {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport,
      background: 'transparent',
    }).promise;
  };


  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
      renderPdfToCanvas(pdfInstance, currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pdfInstance && currentPage < pdfInstance.numPages) {
      setCurrentPage((prevPage) => prevPage + 1);
      renderPdfToCanvas(pdfInstance, currentPage + 1);
    }
  };

  const startRecording = async () => {
    recordedChunksRef.current = [];
    const stream = canvasRef.current.captureStream(30);
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current.ondataavailable = handleDataAvailable;
    mediaRecorderRef.current.onstop = handleStop;
    mediaRecorderRef.current.start();
    setIsRecording(true);
    // Re-load the PDF and render the first page
    await loadPdf();
  };


  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleStop = () => {
    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    videoRef.current.src = url;
    videoRef.current.onload = () => {
      videoRef.current.play();
    };
  };


  const handleDataAvailable = (event) => {
    if (event.data.size > 0) {
      recordedChunksRef.current.push(event.data);
    }
  };

  return (
    <div>
      <canvas ref={canvasRef} width={800} height={450} style={{ border: '1px solid black' }} />
      <br /><br />
      <button onClick={handlePrevPage}>이전 페이지</button>
      <button onClick={handleNextPage}>다음 페이지</button>
      <br /><br />
      {currentPage} / {pdfInstance ? pdfInstance.numPages : '-'}
      <br />
      <button onClick={loadPdf}>Load PDF</button>
      <button onClick={startRecording} disabled={isRecording}>녹화 시작</button>
      <button onClick={stopRecording} disabled={!isRecording}>녹화 중지</button>
      <br /><br />
      <video ref={videoRef} width={300} controls style={{ border: '1px solid black' }}></video>
    </div>
  );
}

export default Test;
