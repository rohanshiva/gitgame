import styled from "styled-components";

export const Pre = styled.pre`
  text-align: left;
  margin: 0;
  padding: 0.5rem;
  margin: 0rem;
  min-height: calc(60vh - 1rem);
  max-height: calc(60vh - 1rem);
  overflow-y: scroll;
  // border: solid var(--secondary-accent) 0.1rem;
  border-radius: 3px;
  & .token-line {
    line-height: 1.3em;
    height: 1.3em;
  }
  z-index: 0;
`;

export const Line = styled.div`
  display: table-row;
`;

export const LineNo = styled.span`
  display: table-cell;
  text-align: right;
  padding-left: 0.5em;
  padding-right: 1em;
  user-select: none;
  cursor: pointer;
  opacity: 0.5;
  &:hover {
    opacity: 1;
  }
`;

export const LineContent = styled.span`
  padding-left: 0.5rem;
  display: table-cell;
`;

export const LineActions = styled.span`
  display: table-cell;
  cursor: pointer;
  vertical-align: center;
`;
