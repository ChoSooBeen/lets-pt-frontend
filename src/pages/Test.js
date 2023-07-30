import React, { useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { useState } from 'react';

const Test = () => {
  const videoHeight = 480;
  const videoWidth = 640;
  const videoRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    runFaceApi();
  }, []);

  const runFaceApi = async () => {
    await loadModels();
    startVideo();

    videoRef.current.addEventListener('play', () => {
      const canvas = faceapi.createCanvasFromMedia(videoRef.current);
      document.body.append(canvas);
      const displaySize = { width: videoWidth, height: videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
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
            setMessage('좋습니다');
          } else {
            setMessage('좀 웃어보세요');
          }
        }
      }, 100)

    });
  };

  const loadModels = async () => {
    const MODEL_URL = '/models';
    await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
    await faceapi.loadFaceExpressionModel(MODEL_URL);
  };

  const startVideo = () => {
    navigator.getUserMedia(
      { video: {} },
      stream => (videoRef.current.srcObject = stream),
      err => console.error(err)
    );
  };

  const [message, setMessage] = useState('');

  return (
    <div className="App">
      <video
        ref={videoRef}
        autoPlay
        muted
        height={videoHeight}
        width={videoWidth}
      />
      <div className="message">{message}</div>

    </div>
  );
};

export default Test;
