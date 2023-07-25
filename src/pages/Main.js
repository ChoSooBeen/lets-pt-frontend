import React, { useEffect } from 'react'
import logo from '../img/logo.png'
import { useNavigate } from 'react-router-dom'

const Main = () => {
  const navigate = useNavigate();

  const goToLoginPage = () => {
    const width = 400;
    const height = 300;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const loginPopup = window.open(
      '/login',
      '_blank',
      `width=${width}, height=${height}, left=${left}, top=${top}, resizable=no, scrollbars=yes`
    );

    const channel = new MessageChannel();

    loginPopup.postMessage('initialize', '*', [channel.port2]);

    channel.port1.onmessage = (event) => {
      if (event.data === 'closed' && ((localStorage.getItem("token")) !== "")) {
        navigate("/");
      }
    }
  }

  useEffect(() => {
    // Handle 'storage' events across windows
    window.addEventListener('storage', (event) => {
      if (event.key === 'token' && event.newValue !== "") {
        navigate("/");
      }
    })
  }, [navigate])

  return (
    <div className='main-container'>
      <img src={logo} alt="logo" className='main-logo' width={350} />
      <button className='main-login-button' onClick={goToLoginPage}>로그인</button>
    </div>
  )
}

export default Main
