import React, { useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

enum DirectionState {
  LEFT,
  RIGHT,
  FORWARD
}

export default function App() {
  const [directionState, setDirectionState] = useState<DirectionState>(DirectionState.FORWARD);
  const [socketUrl] = useState('ws://localhost:5001');
  const { sendMessage, readyState } = useWebSocket(socketUrl);

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      sendMessage(DirectionState[directionState])
    }
  }, [directionState, readyState, sendMessage])

  function HandleButtonUp() {
    setDirectionState(DirectionState.FORWARD);
  }

  function HandleButtonDown(direction: DirectionState) {
    setDirectionState(direction);
  }

  return (
    <div>
      <span>The WebSocket is currently {connectionStatus}</span>
      <div style={{ display: "flex" }}>
        <div onMouseDown={() => HandleButtonDown(DirectionState.LEFT)}
          onMouseUp={HandleButtonUp}
          onTouchStart={() => HandleButtonDown(DirectionState.LEFT)}
          onTouchEnd={HandleButtonUp}
          onTouchCancel={HandleButtonUp}>
          <img src="svg/left_arrow.svg" alt="Left arrow" />
        </div>
        <div onMouseDown={() => HandleButtonDown(DirectionState.RIGHT)}
          onMouseUp={HandleButtonUp}
          onTouchStart={() => HandleButtonDown(DirectionState.RIGHT)}
          onTouchEnd={HandleButtonUp}
          onTouchCancel={HandleButtonUp}>
          <img src="svg/right_arrow.svg" alt="Right arrow" />
        </div>
      </div>
    </div>
  );
};
