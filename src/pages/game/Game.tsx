import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast';
import './Game.css'

enum DirectionState {
  LEFT,
  RIGHT,
  FORWARD,
  NONE
}

export default function Game() {
  const location = useLocation();
  const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_SERVER ?? 'ws://localhost:8080';
  const [directionState, setDirectionState] = useState<DirectionState>(DirectionState.NONE);
  const [isAcceptingInput, setIsAcceptingInput] = useState<boolean>(false);
  const dataChannel = useRef<RTCDataChannel>();

  useEffect(() => {
    const id = Math.random().toString(16).slice(2);
    const lobbyCode = location.pathname.substring(1);
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);
    const ws = new WebSocket(WEBSOCKET_URL, []);
    let candidateQueue: RTCIceCandidate[] = [];

    ShowLoading('Connecting to host...');

    ws.onopen = async () => {
      ws.send(JSON.stringify({ type: 'register-client', id: id, lobby_code: lobbyCode }));
    }

    ws.onerror = async () => {
      ShowError('Unable to connect to server');
    }

    pc.onicecandidate = evt => evt.candidate && ws.send(JSON.stringify({ type: 'ice-candidate-client', candidate: evt.candidate, clientId: id }));

    pc.ondatachannel = (ev) => {
      dataChannel.current = ev.channel;
      dataChannel.current.onopen = () => ShowSuccess('Connection established');
      dataChannel.current.onclose = () => {
        ShowError('Connection lost');
        setIsAcceptingInput(false);
      };
    };

    // Handle signaling server message
    ws.onmessage = async function (evt) {
      let obj = JSON.parse(evt.data);

      switch (obj?.type) {
        case 'ice-candidate':
          let candidateObject = obj?.candidate;
          if (!candidateObject.candidate.startsWith('candidate:')) {
            candidateObject.candidate = 'candidate:' + candidateObject.candidate;
          }
          if (pc.remoteDescription) {
            pc.addIceCandidate(candidateObject);
          } else {
            candidateQueue.push(candidateObject);
          }
          break;

        case 'offer':
          let newOffer = {
            type: obj?.type,
            sdp: obj?.offer.sdp
          }
          await pc.setRemoteDescription(new RTCSessionDescription(newOffer));
          pc.createAnswer()
            .then((answer) => pc.setLocalDescription(answer))
            .then(() => ws.send(JSON.stringify({ type: 'answer', answer: pc.localDescription, clientId: id })));

          for (const candidate of candidateQueue) {
            await pc.addIceCandidate(candidate);
          }
          candidateQueue = [];
          break;

        case 'message':
          setIsAcceptingInput(obj.message === 'start');
          break;

        case 'error':
          ShowError(obj?.message);
          setIsAcceptingInput(false);
          break

        default:
          ShowError('Message type not supported');
      }
    };

  }, [WEBSOCKET_URL, location.pathname])

  useEffect(() => {
    function SendMessage(message: string) {
      if (dataChannel.current && dataChannel.current.readyState === 'open') {
        dataChannel.current.send(message);
      } else {
        ShowError('Data channel is not open');
      }
    }

    if (isAcceptingInput) {
      SendMessage(DirectionState[directionState])
    }
  }, [directionState, isAcceptingInput])

  function ShowSuccess(message?: string) {
    toast.success(message ?? 'Success')
  }

  function ShowLoading(message?: string) {
    toast.loading(message ?? 'Loading...');
  }

  function ShowError(message?: string) {
    toast.error(message ?? 'Error');
  }

  function HandleButtonUp() {
    setDirectionState(DirectionState.FORWARD);
  }

  function HandleButtonDown(direction: DirectionState) {
    setDirectionState(direction);
  }

  return (
    <div>
      <Toaster />
      <div className="button-container">
        <button className="button-left"
          disabled={!isAcceptingInput}
          onMouseDown={() => HandleButtonDown(DirectionState.LEFT)}
          onMouseUp={HandleButtonUp}
          onTouchStart={() => HandleButtonDown(DirectionState.LEFT)}
          onTouchEnd={HandleButtonUp}
          onTouchCancel={HandleButtonUp}>
          <img onContextMenu={(e) => e.preventDefault()} src="svg/left_arrow.svg" alt="Left arrow" />
        </button>
        <div className="vertical-rule"></div>
        <button className="button-right"
          disabled={!isAcceptingInput}
          onMouseDown={() => HandleButtonDown(DirectionState.RIGHT)}
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