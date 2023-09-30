import React, { useState, useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

export default function App() {
  const [socketUrl, setSocketUrl] = useState('ws://localhost:5001');
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  function HandleTurnLeft(){
    useCallback(() => sendMessage('Hello'), []);
  }

  function HandleTurnRight(){
    useCallback(() => sendMessage('Hello'), []);
  }

  return (
    <div>
      <span>The WebSocket is currently {connectionStatus}</span>
      <div style={{display: "flex"}}>
        <div onClick={HandleTurnLeft}>
          <img src="svg/left_arrow.svg" alt="Left arrow"/>
        </div>
        <div onClick={HandleTurnRight}>
          <img src="svg/right_arrow.svg" alt="Right arrow"/>
        </div>
      </div>
    </div>
  );
};
