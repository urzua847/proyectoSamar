import React from 'react';

const Home = () => {
  const user = JSON.parse(sessionStorage.getItem('usuario'));

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>Situacion Actual de Planta</h1>
      {user && <h2>Hola, {user.nombreCompleto}</h2>}
      <p>Aqui veremos el estado de la planta.</p>
      <p>Donde se mostraran:</p>
      <p>- Los ultimos lotes recepcionados,</p> 
      <p>- La materia prima que se encuentre en las camaras de frio</p> 
      <p>- El estado de los contenedores con la materia prima procesada.</p>
    </div>
  );
};

export default Home;