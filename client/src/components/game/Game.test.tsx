import { cleanup, render, screen } from "@testing-library/react";
import Game from "./Game";
import useSocket from "./hooks/socket/UseSocket";
import IGameState, { SessionState } from "../../interfaces/GameState";
import { useHistory } from "react-router-dom";

jest.mock("./hooks/socket/UseSocket");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({
    push: jest.fn(),
    location: { pathname: "/game/mockSessionCode/mockUsername" },
  }),
}));

afterEach(cleanup);

test("blue border indicating host on left leaderboard", () => {
  (useSocket as jest.Mock).mockReturnValue({ sendMessage: () => {} });
  const mockLobbyState = {
    players: [
      {
        username: "amogh1155",
        has_guessed: false,
        score: 0,
      },
      {
        username: "ramko9999",
        has_guessed: false,
        score: 0,
      },
      {
        username: "TanushN",
        has_guessed: false,
        score: 0,
      },
    ],
    host: {
      username: "amogh1155",
      has_guessed: false,
      score: 0,
    },
    state: SessionState.IN_LOBBY,
  };
  render(<Game initialState={mockLobbyState as IGameState} />);
  const hostTag = screen.getByTestId("host");
  expect(hostTag).toBeInTheDocument();
  expect(hostTag).toHaveTextContent(mockLobbyState.host.username);
});
