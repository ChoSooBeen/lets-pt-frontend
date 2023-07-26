// import React, { useCallback, useEffect, useState } from 'react';
// import { useDropzone } from 'react-dropzone';
// import axios from 'axios';

// const Test = () => {
//   const [pdfFile, setPdfFile] = useState(null);
//   const [base64Url, setBase64Url] = useState(null);

//   const onDrop = useCallback(acceptedFiles => {
//     const file = acceptedFiles[0];
//     console.log(file);

//     let formData = new FormData();
//     formData.append('pdf', file);

//     axios.post('http://localhost:3001/s3/pdf', formData);
//     // .then(response => {
//     //   const base64data = btoa(
//     //     new Uint8Array(response.data)
//     //       .reduce((data, byte) => data + String.fromCharCode(byte), '')
//     //   );
//     //   setPdfFile("data:;base64," + base64data);
//     //   console.log(pdfFile)
//     // });
//   }, []);

//   useEffect(() => {
//     const res = "https://speech-video-storage.s3.ap-northeast-2.amazonaws.com/test.pdf";
//     res.blob();
//     const newBlob = new Blob([blob], { type: 'application/pdf' })
//     blobToBase64(newBlob);
//     const blobToBase64 = (blob) => {
//       const reader = new FileReader() // FileReader는 blob을 읽을 수 있다
//       reader.readAsDataURL(blob) // 바이너리 파일을 Base64 Encode 문자열로 반환
//       reader.onloadend = () => { // 다 끝난 후 뭐할지 작성
//         const base64data = reader.result // base64로 반환된 결과값 저장
//         setBase64Url(base64data) // state에 저장해두고 view에 뿌렸다
//       }
//     }
//   })


//   const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });



//   return (
//     <div {...getRootProps()}>
//       <input {...getInputProps()} />
//       {
//         isDragActive ?
//           <p>Drop the files here ...</p> :
//           <p>Drag 'n' drop some files here, or click to select files</p>
//       }
//       <object type='application/pdf' data=''>
//         <embed type='application/pdf' src='' />
//       </object>

//     </div>
//   )
// }

// export default Test
