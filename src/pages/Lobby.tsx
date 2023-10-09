import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

export default function Lobby() {
    const [inputText, setInputText] = useState<string>("");
    const navigate = useNavigate();

    function HandleClickJoinGame() {
        navigate(inputText);
    }

    return (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh'}}>
            <div>
                <input type="text" placeholder="Insert lobby code" value={inputText} onChange={(e) => setInputText(e.target.value)} />
            </div>
            <div>
                <button onClick={HandleClickJoinGame}>
                    Join game
                </button>
            </div>
        </div>
    )
}