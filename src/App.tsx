import React, { useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

enum ButtonState {
  PRESSED,
  RELEASED
}

enum DirectionState {
  LEFT,
  RIGHT,
  NONE
}

export default function App() {
  const [buttonState, setButtonState] = useState<ButtonState>(ButtonState.RELEASED);
  const [directionState, setDirectionState] = useState<DirectionState>(DirectionState.NONE);
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
      sendMessage(`${directionState} ${buttonState}`)
    }
  }, [buttonState, directionState, readyState, sendMessage])

  function HandleButtonUp(){
    setDirectionState(DirectionState.NONE);
    setButtonState(ButtonState.RELEASED)
  }

  function HandleButtonDown(direction: string){
    setDirectionState(direction === "left" ? DirectionState.LEFT : DirectionState.RIGHT);
    setButtonState(ButtonState.PRESSED)
  }

  return (
    <div>
      <span>The WebSocket is currently {connectionStatus}</span>
      <div style={{ display: "flex" }}>
        <div onMouseDown={() => HandleButtonDown("left")}
          onMouseUp={HandleButtonUp}
          onTouchStart={() => HandleButtonDown("left")}
          onTouchEnd={HandleButtonUp}
          onTouchCancel={HandleButtonUp}>
          <img src="svg/left_arrow.svg" alt="Left arrow" />
        </div>
        <div onMouseDown={() => HandleButtonDown("right")}
          onMouseUp={HandleButtonUp}
          onTouchStart={() => HandleButtonDown("right")}
          onTouchEnd={HandleButtonUp}
          onTouchCancel={HandleButtonUp}>
          <img src="svg/right_arrow.svg" alt="Right arrow" />
        </div>
      </div>
    </div>
  );
};
