import React, { useState, useEffect } from "react";
import TextField from "@material-ui/core/TextField";
import { makeStyles } from "@material-ui/core/styles";
import CloseIcon from '@material-ui/icons/Close';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import clsx from 'clsx'

const useStyles = makeStyles(() => ({
  textField: {
    minWidth: "100%",
    padding: 0,
    '& .MuiFilledInput-adornedEnd': {
      paddingRight: 0,
    }
  },
  unsubmitted: {
    backgroundColor: "rgb(0, 102, 255, 0.09)"
  },

  clear: {
    '& .MuiIconButton-root': {
      padding: '10px'
    }
  }

}));

const SettingsInput = ({
  handleChange,
  handleSubmit,
  label,
  value,
  type,
  name,
  min,
  max,
  step,
  helperText
}) => {
  const classes = useStyles();
  const inputProps = { min: min, max: max, step: step };
  const [error, setError] = useState(false);
  const [submitted, setSubmitted] = useState(true);
  const [input, setInput] = useState(value);
  useEffect(() => {
    setInput(value);
    setSubmitted(true)
  }, [value]);

  const onChange = e => {
    const value = e.target.type === "number" ? e.target.value : e.target.value;
    const checkInput = (name === "M0") | (name === "M1") | name === "CER" | name === "SD";
    if (!((value > max) & checkInput) & !((value < min) & checkInput)) {
      setError(false);
    } else {
      setError(true);
    }
    setSubmitted(false)
    setInput(value)
  };
  const onSubmit = (e) => {
    switch (e.key) {
      case "Enter":
        setSubmitted(true)
        handleChange({
          name: e.target.name,
          value: input,
        });
        break;
      case "Esc":
      case "Escape":
        setSubmitted(true)
        setError(false)
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
            [classes.unsubmitted]: !submitted

          })
           }
          InputLabelProps={{
            shrink: true
          }}
          InputProps={{ 
            ...inputProps,
            endAdornment: (
              <InputAdornment position="end" className={classes.clear}>
                <IconButton
                  disabled={submitted}
                  aria-label="toggle password visibility"
                  onClick={() => setSubmitted(true)}
                >
                  < CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
             ) }}
          margin="dense"
          variant={"filled"}
          onChange={onChange}
          onKeyDown={onSubmit}
          value={submitted ? value : input}
          helperText={helperText}
        />
  );
};
export default SettingsInput;
