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

  function HandleButtonUp(event: React.SyntheticEvent) {
    event.preventDefault();
    setDirectionState(DirectionState.FORWARD);
  }

  function HandleButtonDown(event: React.SyntheticEvent, direction: DirectionState) {
    event.preventDefault();
    setDirectionState(direction);
  }

  return (
    <div>
      <span>The WebSocket is currently {connectionStatus}</span>
      <div style={{ display: "flex" }}>
        <div onMouseDown={(event) => HandleButtonDown(event, DirectionState.LEFT)}
          onMouseUp={(event) => HandleButtonUp(event)}
          onTouchStart={(event) => HandleButtonDown(event, DirectionState.LEFT)}
          onTouchEnd={(event) => HandleButtonUp(event)}
          onTouchCancel={(event) => HandleButtonUp(event)}>
          <img src="svg/left_arrow.svg" alt="Left arrow" />
        </div>
        <div onMouseDown={(event) => HandleButtonDown(event, DirectionState.RIGHT)}
          onMouseUp={(event) => HandleButtonUp(event)}
          onTouchStart={(event) => HandleButtonDown(event, DirectionState.RIGHT)}
          onTouchEnd={(event) => HandleButtonUp(event)}
          onTouchCancel={(event) => HandleButtonUp(event)}>
          <img src="svg/right_arrow.svg" alt="Right arrow" />
        </div>
      </div>
    </div>
  );
};
