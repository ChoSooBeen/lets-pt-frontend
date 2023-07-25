import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

const PrivateRoute = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate("/main");
    }
  }, [navigate, token]);

  return <Outlet />
};

export default PrivateRoute;
