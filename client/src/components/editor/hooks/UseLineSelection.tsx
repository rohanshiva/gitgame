import { useState } from "react";

export interface SelectedLines {
  start: number | undefined;
  end: number | undefined;
}

interface UseLineSelectionResult {
  selectedLines: SelectedLines;
  clearLineSelection: () => void;
  handleLineToggle: (e: any, lineNumber: number) => void;
  isLineSelected: (lineNumber: number) => boolean;
  isStartOfSelection: (lineNumber: number) => boolean;
}

function useLineSelection(): UseLineSelectionResult {
  const [selectedLines, setSelectedLines] = useState<SelectedLines>({
    start: undefined,
    end: undefined,
  });

  const handleLineToggle = (e: any, lineNumber: number) => {
    const { start } = selectedLines;

    if (!e.shiftKey || start === undefined) {
      setSelectedLines({ start: lineNumber, end: lineNumber });
    } else if (lineNumber < start) {
      setSelectedLines({ start: lineNumber, end: start });
    } else if (lineNumber > start) {
      setSelectedLines({ ...selectedLines, end: lineNumber });
    } else {
      setSelectedLines({ ...selectedLines, end: lineNumber });
    }
  };

  const clearLineSelection = () => {
    setSelectedLines({ start: undefined, end: undefined });
  };

  const isLineSelected = (lineNumber: number) => {
    const { start, end } = selectedLines;

    if (start !== undefined && end !== undefined) {
      return lineNumber >= start && lineNumber <= end;
    } else if (start !== undefined) {
      return lineNumber === start;
    }

    return false;
  };

  const isStartOfSelection = (lineNumber: number) => {
    return lineNumber === selectedLines.start;
  };

  return {
    selectedLines,
    clearLineSelection,
    handleLineToggle,
    isLineSelected,
    isStartOfSelection,
  };
}

export default useLineSelection;
