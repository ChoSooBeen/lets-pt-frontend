// 브라우저가 Web Speech API를 지원하는지 확인하는 함수
export function isSpeechRecognitionSupported() {
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}
