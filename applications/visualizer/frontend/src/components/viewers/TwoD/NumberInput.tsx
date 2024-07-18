// NumberInput.tsx
import * as React from "react";
import { Unstable_NumberInput as BaseNumberInput, NumberInputProps } from "@mui/base/Unstable_NumberInput";
import { Box } from "@mui/system";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";

const NumberInput = React.forwardRef(function CustomNumberInput(
  props: NumberInputProps & {
    value: number;
    onIncrement: () => void;
    onDecrement: () => void;
  },
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const { value, onIncrement, onDecrement, ...otherProps } = props;

  const handleIncrementClick = () => {
    onIncrement();
  };

  const handleDecrementClick = () => {
    onDecrement();
  };

  return (
    <BaseNumberInput
      slots={{
        root: (props) => <Box {...props} sx={rootSx} />,
        input: (props) => <Box component="input" {...props} sx={inputSx} value={value} />,
        incrementButton: (props) => (
          <Box component="button" {...props} sx={buttonSx} className="increment" onClick={handleIncrementClick}>
            <AddIcon fontSize="small" />
          </Box>
        ),
        decrementButton: (props) => (
          <Box component="button" {...props} sx={buttonSx} className="decrement" onClick={handleDecrementClick}>
            <RemoveIcon fontSize="small" />
          </Box>
        ),
      }}
      slotProps={{
        incrementButton: {
          onClick: handleIncrementClick,
        },
        decrementButton: {
          onClick: handleDecrementClick,
        },
      }}
      {...otherProps}
      ref={ref}
    />
  );
});

export default NumberInput;

const rootSx = {
  fontWeight: 400,
  display: "flex",
  flexFlow: "row nowrap",
  justifyContent: "center",
  alignItems: "center",
};

const inputSx = {
  fontSize: "0.875rem",
  fontFamily: "inherit",
  fontWeight: 400,
  lineHeight: 1.375,
  padding: ".5rem 1px",
  outline: 0,
  minWidth: 0,
  width: "2.375rem",
  height: "2.25rem",
  textAlign: "center",
  border: "1px solid #BABAB5",
  borderLeft: 0,
  borderRight: 0,
  color: "#63625F",
};

const buttonSx = {
  fontFamily: "IBM Plex Sans, sans-serif",
  fontSize: "0.875rem",
  boxSizing: "border-box",
  lineHeight: 1.5,
  border: "1px solid #BABAB5",
  width: "2.25rem",
  height: "2.25rem",
  display: "flex",
  flexFlow: "row nowrap",
  justifyContent: "center",
  alignItems: "center",
  transitionProperty: "all",
  transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
  transitionDuration: "120ms",
  outline: 0,
  backgroundColor: "transparent",

  "&:hover": {
    cursor: "pointer",
  },
  "&:focus-visible": {
    outline: 0,
  },
  "&.increment": {
    order: 1,
    borderTopRightRadius: ".5rem",
    borderBottomRightRadius: ".5rem",
  },
  "&.decrement": {
    borderTopLeftRadius: ".5rem",
    borderBottomLeftRadius: ".5rem",
  },
  "& .MuiSvgIcon-root": {
    margin: 0,
    color: "#757570",
  },
};
