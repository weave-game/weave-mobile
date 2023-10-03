import React, { useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

enum DirectionState {
  LEFT,
  RIGHT,
  FORWARD,
  NONE
}

export default function App() {
  const url = process.env.REACT_APP_WEBSOCKET_SERVER ?? 'ws://localhost:5001';
  const [socketUrl] = useState(url);
  const { sendMessage, readyState } = useWebSocket(socketUrl);
  const [directionState, setDirectionState] = useState<DirectionState>(DirectionState.NONE);

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
        <button onMouseDown={() => HandleButtonDown(DirectionState.LEFT)}
          onMouseUp={HandleButtonUp}
          onTouchStart={() => HandleButtonDown(DirectionState.LEFT)}
          onTouchEnd={HandleButtonUp}
          onTouchCancel={HandleButtonUp}>
          <img onContextMenu={(e) => e.preventDefault()} src="svg/left_arrow.svg" alt="Left arrow" />
        </button>
        <button onMouseDown={() => HandleButtonDown(DirectionState.RIGHT)}
          onMouseUp={HandleButtonUp}
          onTouchStart={() => HandleButtonDown(DirectionState.RIGHT)}
          onTouchEnd={HandleButtonUp}
          onTouchCancel={HandleButtonUp}>
          <img onContextMenu={(e) => e.preventDefault()} src="svg/right_arrow.svg" alt="Right arrow" />
        </button>
      </div>
    </div>
  );
};
