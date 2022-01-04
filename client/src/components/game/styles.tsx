import styled from "styled-components";

export const Pre = styled.pre`
  text-align: left;
  margin: 1em 0;
  padding: 2em;
  max-height: 512px;
  overflow-y: scroll;

  & .token-line {
    line-height: 1.3em;
    height: 1.3em;
  }
`;

export const Line = styled.div`
  display: table-row;
`;

export const LineNo = styled.span`
  display: table-cell;
  text-align: right;
  padding-right: 1em;
  user-select: none;
  opacity: 0.5;
`;

export const LineContent = styled.span`
  display: table-cell;
`;
