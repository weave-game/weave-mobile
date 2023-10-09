import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Header from './components/Header';
import Lobby from './pages/lobby/Lobby';
import Game from './pages/game/Game';
import PageNotFound from './pages/PageNotFound';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><Header /><Outlet /></>}>
          <Route path="/" element={<Lobby />} />
          <Route path="/*" element={<Game />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}