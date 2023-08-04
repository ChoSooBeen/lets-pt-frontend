// import React, { useState } from "react";
// import { useDropzone } from "react-dropzone";
// import PptxGenJS from "pptxgenjs";
// import extractNotes from "./extractNotes"; // Your custom function to extract notes

// const Test = () => {
//   const [pptxData, setPPTXData] = useState(null);
//   const [notes, setNotes] = useState([]);

//   const onDrop = (acceptedFiles) => {
//     const reader = new FileReader();
//     reader.onload = () => {
//       setPPTXData(reader.result);

//       // Extract notes from PPTX file
//       const pptx = new PptxGenJS();
//       pptx.load(reader.result);
//       const notes = extractNotes(pptx); // Custom function to extract notes
//       setNotes(notes);
//     };
//     reader.readAsArrayBuffer(acceptedFiles[0]);
//   };

//   const { getRootProps, getInputProps } = useDropzone({
//     onDrop,
//     accept: ".pptx",
//   });

//   return (
//     <div>
//       <div {...getRootProps()} style={{ border: "2px dashed black", padding: "20px", textAlign: "center" }}>
//         <input {...getInputProps()} />
//         <p>드래그 & 드랍하거나 클릭하여 PPT 파일을 업로드하세요.</p>
//       </div>
//       {pptxData && <PPTXRenderer data={pptxData} />}
//       <div>
//         {notes.map((note, index) => (
//           <div key={index}>
//             <h3>Slide {index + 1} Notes:</h3>
//             <p>{note}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Test;
