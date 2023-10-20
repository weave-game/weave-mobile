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
  const [directionState, setDirectionState] = useState<DirectionState>(DirectionState.NONE);
  const [isLeftPressed, setIsLeftPressed] = useState<boolean>(false);
  const [isRightPressed, setIsRightPressed] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.CONNECTING);
  const [isAcceptingInput, setIsAcceptingInput] = useState<boolean>(false);
  const [playerColor, setPlayerColor] = useState<string>('#fff');
  const dataChannel = useRef<RTCDataChannel>();
  const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_SERVER ?? 'ws://localhost:8080';

  useEffect(() => {
    function handleConnected() {
      toast.success('Connected!');
      setConnectionState(ConnectionState.CONNECTED);
      setIsAcceptingInput(true);
    }

    function handleDisconnected(error?: string) {
      showError(error ?? 'Connection closed');
      setConnectionState(ConnectionState.DISCONNECTED);
      setIsAcceptingInput(false);

      if (dataChannel.current) {
        dataChannel.current.close();
      }
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

    ws.onopen = async () => sendWebsocketMessage({ type: 'register-client' });

    ws.onerror = async () => handleDisconnected('WebSocket error: Unable to connect to server');

    pc.onicecandidate = evt => evt.candidate && sendWebsocketMessage({ type: 'ice-candidate-client', candidate: evt.candidate });

    pc.onconnectionstatechange = () => pc.connectionState === 'failed' && handleDisconnected('Something went terribly wrong');

    pc.ondatachannel = (ev) => {
      dataChannel.current = ev.channel;
      dataChannel.current.onopen = () => handleConnected();
      dataChannel.current.onerror = () => handleDisconnected('WebRTC error: Connection closed');
      dataChannel.current.onclose = () => handleDisconnected('WebRTC error: Connection closed');
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
            .then(() => sendWebsocketMessage({ type: 'answer', answer: pc.localDescription }));

          for (const candidate of candidateQueue) {
            await pc.addIceCandidate(candidate);
          }
          candidateQueue = [];
          break;

        case 'message':
          setIsAcceptingInput(obj.message === 'start');
          break;

        case 'color-change':
          console.log(obj?.color)
          console.log(rgbaToHex( obj?.color ))
          setPlayerColor(rgbaToHex(obj?.color));
          break

        case 'error':
          handleDisconnected(obj?.message);
          break

        default:
          showError('Message type not supported');
      }
    };

    function sendWebsocketMessage(message: any) {
      message.lobbyCode = lobbyCode;
      message.clientId = id;
      ws.send(JSON.stringify(message));
    }
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
    } else {
      setDirectionState(DirectionState.FORWARD);
      setIsLeftPressed(false);
      setIsRightPressed(false);
    }
  }, [directionState, isAcceptingInput])

  useEffect(() => {
    if ((isLeftPressed && isRightPressed) || (!isLeftPressed && !isRightPressed)) {
      setDirectionState(DirectionState.FORWARD);
    } else if (isLeftPressed) {
      setDirectionState(DirectionState.LEFT);
    } else if (isRightPressed) {
      setDirectionState(DirectionState.RIGHT);
    }
  }, [isLeftPressed, isRightPressed]);

  function rgbaToHex(rgba: string) {
    const matches = RegExp(/\(([^)]+)\)/).exec(rgba);
    if (!matches) return '';

    const values = matches[1].split(',').map(parseFloat);

    const toHex = (value: number): string => {
      const hex = Math.round(value * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    const alphaToHex = (value: number): string => {
      const hex = Math.round(value * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    const hexColor = `#${toHex(values[0])}${toHex(values[1])}${toHex(values[2])}`;
    const alphaHex = values[3] !== undefined ? alphaToHex(values[3]) : '';

    return hexColor + alphaHex;
  }

  function showError(message?: string) {
    toast.error(message ?? 'Error');
  }

  return (
    <div>
      <Toaster />

      <div className="status">
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

        {connectionState === ConnectionState.CONNECTED && (
          <div className="player-color-state">
            Player color:
            <span className="player-color-dot" style={{ backgroundColor: playerColor }}></span>
          </div>
        )}
      </div>

      <div className="button-container">
        <button className="button-left"
          disabled={!isAcceptingInput}
          onMouseDown={(event) => { event.preventDefault(); setIsLeftPressed(true) }}
          onMouseUp={(event) => { event.preventDefault(); setIsLeftPressed(false) }}
          onTouchStart={(event) => { event.preventDefault(); setIsLeftPressed(true) }}
          onTouchEnd={(event) => { event.preventDefault(); setIsLeftPressed(false) }}
          onTouchCancel={(event) => { event.preventDefault(); setIsLeftPressed(false) }}>
          &lt;
        </button>

        <div className="vertical-rule"></div>

        <button className="button-right"
          disabled={!isAcceptingInput}
          onMouseDown={(event) => { event.preventDefault(); setIsRightPressed(true) }}
          onMouseUp={(event) => { event.preventDefault(); setIsRightPressed(false) }}
          onTouchStart={(event) => { event.preventDefault(); setIsRightPressed(true) }}
          onTouchEnd={(event) => { event.preventDefault(); setIsRightPressed(false) }}
          onTouchCancel={(event) => { event.preventDefault(); setIsRightPressed(false) }}>
          &gt;
        </button>
      </div>
    </div>
  );
};