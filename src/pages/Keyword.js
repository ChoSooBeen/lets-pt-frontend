import React from 'react'

const Keyword = () => {
  return (
    <div className='keyword-container'>
      <h1 className='keyword-title'>키워드 등록</h1>
      <div className='yes-word-container'>
        권장단어
        <input className="yes-word-input" type="text" placeholder='단어 입력' />
        <button className='yes-word-button'> 등록 </button>
      </div>
      <div className='no-word-container'>
        금지단어
        <input className="no-word-input" type="text" placeholder='단어 입력' />
        <button className='no-word-button'> 등록 </button>
      </div>
    </div>
  )
}

export default Keyword
