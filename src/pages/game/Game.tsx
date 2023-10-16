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

enum ConnectionState {
  CONNECTED,
  DISCONNECTED,
  CONNECTING
}

export default function Game() {
  const location = useLocation();
  const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_SERVER ?? 'ws://localhost:8080';
  const [directionState, setDirectionState] = useState<DirectionState>(DirectionState.NONE);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.CONNECTING);
  const [isAcceptingInput, setIsAcceptingInput] = useState<boolean>(false);
  const dataChannel = useRef<RTCDataChannel>();

  useEffect(() => {
    function handleConnected() {
      showSuccess("Connected!");
      setConnectionState(ConnectionState.CONNECTED);
      setIsAcceptingInput(true);
    }

    function handleDisconnected(error?: string) {
      showError(error ?? 'Connection closed');
      setConnectionState(ConnectionState.DISCONNECTED);
      setIsAcceptingInput(false);
    }

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

    ws.onopen = async () => { ws.send(JSON.stringify({ type: 'register-client', id: id, lobby_code: lobbyCode })); }

    ws.onerror = async () => handleDisconnected('Unable to connect to server');

    pc.onicecandidate = evt => evt.candidate && ws.send(JSON.stringify({ type: 'ice-candidate-client', candidate: evt.candidate, clientId: id }));

    pc.ondatachannel = (ev) => {
      dataChannel.current = ev.channel;
      dataChannel.current.onopen = () => handleConnected();
      dataChannel.current.onclose = () => handleDisconnected('Connected closed');
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
          handleDisconnected(obj?.message);
          break

        default:
          showError('Message type not supported');
      }
    };

  }, [WEBSOCKET_URL, location.pathname]);

  useEffect(() => {
    function SendMessage(message: string) {
      if (dataChannel.current && dataChannel.current.readyState === 'open') {
        dataChannel.current.send(message);
      } else {
        showError('Data channel is not open');
      }
    }

    if (isAcceptingInput) {
      SendMessage(DirectionState[directionState])
    }
  }, [directionState, isAcceptingInput])

  function showSuccess(message?: string) {
    toast.success(message ?? 'Success')
  }

  function showError(message?: string) {
    toast.error(message ?? 'Error');
  }

  function handleButtonUp() {
    setDirectionState(DirectionState.FORWARD);
  }

  function handleButtonDown(direction: DirectionState) {
    setDirectionState(direction);
  }

  return (
    <div>
      <Toaster />
      <div className="connection-state">
        {connectionState === ConnectionState.CONNECTED && (
          <div className="status connected">
            <span className="status-dot"></span>
            Connected
          </div>
        )}
        {connectionState === ConnectionState.DISCONNECTED && (
          <div className="status disconnected">
            <span className="status-dot"></span>
            Disconnected
          </div>
        )}
        {connectionState === ConnectionState.CONNECTING && (
          <div className="status connecting">
            <span className="status-dot"></span>
            Connecting...
          </div>
        )}
      </div>

      <div className="button-container">
        <button className="button-left"
          disabled={!isAcceptingInput}
          onMouseDown={() => handleButtonDown(DirectionState.LEFT)}
          onMouseUp={handleButtonUp}
          onTouchStart={() => handleButtonDown(DirectionState.LEFT)}
          onTouchEnd={handleButtonUp}
          onTouchCancel={handleButtonUp}>
          &lt;
        </button>

        <div className="vertical-rule"></div>

        <button className="button-right"
          disabled={!isAcceptingInput}
          onMouseDown={() => handleButtonDown(DirectionState.RIGHT)}
          onMouseUp={handleButtonUp}
          onTouchStart={() => handleButtonDown(DirectionState.RIGHT)}
          onTouchEnd={handleButtonUp}
          onTouchCancel={handleButtonUp}>
          &gt;
        </button>
      </div>
    </div>
  );
};