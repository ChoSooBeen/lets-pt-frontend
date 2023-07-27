import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const pdfTest = () => {
  const [pdfFile, setPdfFile] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    console.log(file);

    let formData = new FormData();
    formData.append('pdf', file);

    axios.post('http://localhost:3001/s3/pdf', formData)
      .then(response => {
        setPdfFile(response.data);
      });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {
        isDragActive ?
          <p>Drop the files here ...</p> :
          <p>Drag 'n' drop some files here, or click to select files</p>
      }
      <iframe
        src={pdfFile + "#toolbar=0&scrollbar=0"}
        style={{ width: '80%', height: '500px', border: '1px solid black' }} />

    </div>
  )
}

export default pdfTest

