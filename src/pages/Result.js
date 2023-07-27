import React from 'react'

const Result = () => {
  return (
    <div className="detail-container">
      <div className="left-column">
        <h1>녹화 영상</h1>
        <p>
          편집된 영상 pdf+발표자카메라 들어가야함
        </p>
      </div>
      <div className="right-column">
        <div className='result-page-comment-container'>
          <h1 className='result-detail-page-title'>유저 코멘트</h1>
          <div className='result-comment-detail'>유저 코멘트 들어갈 자리</div>
        </div>
        <div className='result-page-timer-container'>
          <h1 className='result-detail-page-title'>발표 시간</h1>
          <div className='result-timer-detail'>페이지 별 경과 시간 들어갈 자리</div>
        </div>
        <div className='result-page-eye-container'>
          <h1 className='result-detail-page-title'>시선 처리</h1>
          <div className='result-eye-detail'>시선 처리 시간 들어갈 자리</div>
        </div>
        <div className='result-page-script-container'>
          <h1 className='result-detail-page-title'>스크립트 확인</h1>
          <div className='result-script-detail'>스크립트 확인 들어갈 자리</div>
        </div>
        <div className='result-page-question-container'>
          <h1 className='result-detail-page-title'>예상질문</h1>
          <div className='result-question-detail'>예상 질문 및 추천 답변 들어갈 자리</div>
        </div>
      </div>
    </div>
  )
}

export default Result
