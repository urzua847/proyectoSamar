import React from 'react';

const Home = () => {
  const user = JSON.parse(sessionStorage.getItem('usuario'));

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Bienvenido a Proyecto Samar</h1>
      {user && <h2>Hola, {user.nombreCompleto}</h2>}
      <p>Esta es la página de inicio.</p>
    </div>
  );
};

export default Home;