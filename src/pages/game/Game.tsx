import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom'
import { IMessage, MessageType } from '../../types';
import './Game.css'

enum DirectionState {
	LEFT,
	RIGHT,
	FORWARD,
	NONE
}

export default function Game() {
	const location = useLocation();
	const PACKET_INTERVAL_MS = 100;
	const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_SERVER ?? 'ws://localhost:8080';
	const [directionState, setDirectionState] = useState<DirectionState>(DirectionState.NONE);
	const [isSendingPackets, setIsSendingPackets] = useState<boolean>(false);
	const dataChannel = useRef<RTCDataChannel>();

	useEffect(() => {
		const lobbyCode = location.pathname.substring(1);
		const configuration: RTCConfiguration = {
			iceServers: [
				{ urls: 'stun:stun.l.google.com:19302' }
			]
		};

		let id = "id" + Math.random().toString(16).slice(2);
		const pc = new RTCPeerConnection();
		const ws = new WebSocket(WEBSOCKET_URL, []);
		let candidateQueue: RTCIceCandidate[] = [];

		ws.onopen = async () => {
			ws.send(JSON.stringify({ type: "register-client", id: id, lobby_code: lobbyCode }));
		}

		pc.onicecandidate = evt => evt.candidate && ws.send(JSON.stringify({ type: 'ice-candidate-client', candidate: evt.candidate, clientId: id }));

		pc.ondatachannel = (ev) => {
			dataChannel.current = ev.channel;
			dataChannel.current.onmessage = HandleDataChannelMessage;
			dataChannel.current.onopen = HandleDataChannelOpen;
			dataChannel.current.onclose = HandleDataChannelClose;
		};

		// Handle signaling server message
		ws.onmessage = async function (evt) {
			let obj = JSON.parse(evt.data);

			switch (obj?.type) {
				case 'ice-candidate':
					let candidateObject = obj?.candidate;
					if (!candidateObject.candidate.startsWith("candidate:")) {
						candidateObject.candidate = "candidate:" + candidateObject.candidate;
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
						.then(() => ws.send(JSON.stringify({ type: "answer", answer: pc.localDescription, clientId: id })));

					for (const candidate of candidateQueue) {
						await pc.addIceCandidate(candidate);
					}
					candidateQueue = [];
					break;

				case 'message':
					let message: IMessage = obj.message;
					setIsSendingPackets(message.MessageType === MessageType.StartGame);
					break;

				case 'error':
					HandleError(obj?.message);
					break

				default:
					HandleError('Message type not supported');
			}
		};

	}, [WEBSOCKET_URL, location.pathname])

	// Send the direction state continuously in case of packet loss
	useEffect(() => {
		if (isSendingPackets) {
			const interval = setInterval(() => {
				SendMessage(DirectionState[directionState])
			}, PACKET_INTERVAL_MS);
			return () => clearInterval(interval);
		}
	}, [directionState, isSendingPackets])

	function SendMessage(message: string) {
		if (dataChannel.current && dataChannel.current.readyState === "open") {
			dataChannel.current.send(message);
		} else {
			HandleError("Data channel is not open. Cannot send message.");
		}
	}

	function HandleError(message: string) {
		console.warn(message)
	}

	function HandleDataChannelMessage(event: MessageEvent) {
		console.log("Received data channel message" + event.data)
	}

	function HandleDataChannelOpen() {
		console.log("Data channel open")
	}

	function HandleDataChannelClose() {
		console.log("Data channel closed")
		setIsSendingPackets(false);
	}

	function HandleButtonUp() {
		setDirectionState(DirectionState.FORWARD);
	}

	function HandleButtonDown(direction: DirectionState) {
		setDirectionState(direction);
	}

	return (
		<div>
			<div className="button-container">
				<button className="button-left"
					disabled={!isSendingPackets}
					onMouseDown={() => HandleButtonDown(DirectionState.LEFT)}
					onMouseUp={HandleButtonUp}
					onTouchStart={() => HandleButtonDown(DirectionState.LEFT)}
					onTouchEnd={HandleButtonUp}
					onTouchCancel={HandleButtonUp}>
					<img onContextMenu={(e) => e.preventDefault()} src="svg/left_arrow.svg" alt="Left arrow" />
				</button>
				<div className="vertical-rule"></div>
				<button className="button-right"
					disabled={!isSendingPackets}
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