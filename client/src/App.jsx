import { useState,lazy } from 'react';
import { BrowserRouter as Router, Routes,Route } from 'react-router-dom';
import Protectedroute from './components/Routeverify/Protectedroute';
const Lodingpage =lazy(()=>import('./pages/Lodingpage'));
const Loginpage = lazy(()=>import('./pages/Loginpage'));
const Signuppage=lazy(()=>import('./pages/Signuppage'));
const Passresetpage=lazy(()=>import('./pages/Passreset'));
const Chatpage=lazy(()=>import('./pages/Chatpage'));


function App() {
  

  return (
    <Router>

    <Routes>

      <Route path='/' element={<Lodingpage/>}/>
      <Route path='/login' element={<Loginpage/>}/>
      <Route path='/signup' element={<Signuppage/>}/>
      <Route path='/password-reset' element={<Passresetpage/>}/>

      <Route path='/chats' element={<Protectedroute><Chatpage/></Protectedroute>}/>

      <Route path='*' element={<Loginpage/>}/>


    </Routes>

    </Router>
  )
}

export default App
