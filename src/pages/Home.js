import React, { useState } from 'react'
import logo from '../img/logo.png';
import { CgEnter } from "react-icons/cg";


const Home = () => {
  const [visitorcode, setVisitorCode] = useState("");

  const handleInputChange = (event) => {
    setVisitorCode(event.target.value);
    console.log(visitorcode);
  };

  const goToPracticePage = () => {
    const width = 1200;
    const height = 800;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      '/practice',
      '_blank',
      `width=${width}, height=${height}, left=${left}, top=${top}, resizable=no, scrollbars=yes`
    );
  }

  const goToObservePage = () => {
    const width = 1200;
    const height = 800;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const url = `/observe?visitorcode=${encodeURIComponent(visitorcode)}`;

    window.open(
      url,
      '_blank',
      `width=${width}, height=${height}, left=${left}, top=${top}, resizable=no, scrollbars=yes`
    );
  }
  return (
    <div className='home-container'>
      <img src={logo} className="home-logo" alt="logo" width={350} />
      <div className='home-inner-container'>
        <form className='observe-container'>
          <input
            type='text'
            placeholder='참관코드를 입력해주세요'
            className='observe-text'
            value={visitorcode}
            onChange={handleInputChange}></input>
          <button className='observe-button' type="submit" onClick={goToObservePage}><CgEnter size={40} /></button>
        </form>
        <button className='practice-button' type='button' onClick={goToPracticePage}>발표 연습</button>
      </div>
    </div >
  )
}

export default Home
