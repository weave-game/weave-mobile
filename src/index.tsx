import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Router from './Router';
import FastClick from 'fastclick';

if ('addEventListener' in document) {
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      (FastClick as any).attach(document.body);
    },
    false,
  );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <Router />
);
