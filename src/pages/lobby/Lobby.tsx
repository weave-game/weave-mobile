import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import './Lobby.css'

export default function Lobby() {
    const [inputText, setInputText] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    function HandleClickJoinGame() {
        if (inputText !== "") {
            navigate(inputText);
        }
    }

    function HandleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Enter") {
            HandleClickJoinGame();
        }
    }

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [])

    return (
        <div className="lobby-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <div>
                <input className="input-lobby-code"
                    onKeyDown={HandleKeyDown}
                    ref={inputRef}
                    type="text"
                    placeholder="Insert lobby code"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)} />
            </div>
            <div>
                <button className="button-join-game" onClick={HandleClickJoinGame}>
                    Join game
                </button>
            </div>
        </div>
    )
}