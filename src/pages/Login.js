import React, { useState } from 'react'
import logo from '../img/logo.png'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Login = () => {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [pwd, setPwd] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 아이디가 비어있는지 검사
    if (id.trim() === '') {
      console.log('아이디를 입력해주세요.');
      return;
    }

    if (pwd.trim() === '') {
      console.log('비밀번호를 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_SITE_URL}/user/login`, { "id": id, "password": pwd });
      const tokenFromServer = response.data.data.token
      localStorage.setItem('token', tokenFromServer);
      alert("로그인 성공!");
      window.close();

    } catch (error) {
      alert("일치하는 정보가 없습니다.");
    }
  };

  const handleResize = () => {
    window.resizeTo(400, 500);
    navigate("/join");
  }

  return (
    <div className="login-container">
      <img src={logo} className="login-logo" alt="logo" width={200} />
      <form onSubmit={handleSubmit}>
        <div className="id-container">
          <input
            type="text"
            placeholder="아이디를 입력해주세요"
            className="id-area"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
        </div>
        <div className="pwd-container">
          <input
            type="password"
            placeholder="비밀번호를 입력해주세요"
            className="pwd-area"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
        </div>
        <div className="login-button-container">
          <button className="join-button" type="button" onClick={handleResize}>
            회원가입
          </button>
          <button className="login-login-button" type='submit'>
            로그인
          </button>
        </div>
      </form>
    </div>
  )
}

export default Login
