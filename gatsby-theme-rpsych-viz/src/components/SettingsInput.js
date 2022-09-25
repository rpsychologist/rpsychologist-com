import React, { useState, useEffect } from "react";
import TextField from "@material-ui/core/TextField";
import { makeStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";
import InputAdornment from "@material-ui/core/InputAdornment";
import IconButton from "@material-ui/core/IconButton";
import clsx from "clsx";

const useStyles = makeStyles(() => ({
  textField: {
    minWidth: "100%",
    padding: 0,
    "& .MuiFilledInput-adornedEnd": {
      paddingRight: 0,
    },
  },
  unsubmitted: {
    backgroundColor: "rgb(0, 102, 255, 0.09)",
  },
  clear: {
    "& .MuiIconButton-root": {
      padding: "10px",
    },
  },
}));

const SettingsInput = ({
  label,
  value,
  type,
  name,
  min,
  max,
  step,
  helperText,
}) => {
  const classes = useStyles();
  const inputProps = { min: min, max: max, step: step };
  const [error, setError] = useState(false);
  const [input, setInput] = useState(value);
  useEffect(() => {
    setInput(value);
  }, [value]);

  const onChange = (e) => {
    const currentValue =
      e.target.type === "number" ? e.target.value : e.target.value;
    const checkInput =
      (name === "M0") | (name === "M1") | (name === "CER") | (name === "SD");
    if (
      !((currentValue > max) & checkInput) &
      !((currentValue < min) & checkInput)
    ) {
      setError(false);
    } else {
      setError(true);
    }
    setInput(currentValue);
  };
  const handleKeyDown = (e) => {
    switch (e.key) {
      case "Esc":
      case "Escape":
        setError(false);
        setInput(value);
        break;
    }
  };
  return (
    <TextField
      error={error}
      id={`input-${name}`}
      fullWidth
      label={label}
      name={name}
      type={type}
      className={clsx({
        [classes.textField]: true,
        [classes.unsubmitted]: input != value,
      })}
      InputLabelProps={{
        shrink: true,
      }}
      InputProps={{
        inputProps: inputProps,
        endAdornment: (
          <InputAdornment position="end" className={classes.clear}>
            <IconButton
              disabled={input == value}
              aria-label="reset"
              onClick={() => setInput(value)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ),
      }}
      margin="dense"
      variant={"filled"}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      value={input}
      helperText={helperText}
    />
  );
};
export default SettingsInput;
