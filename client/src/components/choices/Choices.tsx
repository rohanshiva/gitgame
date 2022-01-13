import React, { useState } from "react";
import "./Choices.css";

interface IChoices {
  choices: string[];
  guessHandler: (guess: string) => void;
}

function Choices({ choices, guessHandler = (guess: string) => {} }: IChoices) {
  const [selected, setSelected] = useState<string>("");
  const [hasGuessed, setHasGuessed] = useState<boolean>(false);

  const confirmGuessHandler = (event: any) => {
    guessHandler(selected);
    setHasGuessed(true);
  };

  const isSelected = (choice: string) => {
    return choice === selected;
  };

  return (
    <div className="choices">
      {choices.map((choice: string, i: number) => (
        <button
          className={`game-buttons ${
            isSelected(choice) ? "selected-choice" : ""
          }`}
          onClick={(event: any) => setSelected(event.target.innerText)}
          disabled={hasGuessed}
        >
          {choice}
        </button>
      ))}
      <button
        onClick={(event) => confirmGuessHandler(event)}
        disabled={hasGuessed}
        className="game-buttons confirm"
      >
        Confirm
      </button>
    </div>
  );
}

export default Choices;
