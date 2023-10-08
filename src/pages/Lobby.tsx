import React from 'react';

export default function Lobby() {
    return (
        <div>
            <div>
                <p>This is the lobby!</p>
            </div>
            <div>
                <input type="text" placeholder="Insert lobby code" />
            </div>
            <div>
                <button>
                    Join game
                </button>
            </div>
        </div>
    )
}