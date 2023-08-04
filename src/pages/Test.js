import React, { useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

const Test = () => {
  const wavesurfer = useRef(null);
  const waveformRef = useRef(null);
  let mediaRecorder = null;

  useEffect(() => {
    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'violet',
      progressColor: 'purple'
    });
    startRecording();
  }, []);

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(handleSuccess);
  }

  const handleSuccess = (stream) => {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();

    const audioChunks = [];
    mediaRecorder.addEventListener("dataavailable", event => {
      audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", () => {
      const audioBlob = new Blob(audioChunks);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onloadedmetadata = () => {
        wavesurfer.current.loadBlob(audioBlob);
      }
    });

    setTimeout(() => {
      mediaRecorder.stop();
    }, 3000);  // Stop recording after 3 seconds
  }

  return <div ref={waveformRef} />;
}

export default Test;
