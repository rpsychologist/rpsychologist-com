import React, { useState, useEffect } from "react";
import TextField from "@material-ui/core/TextField";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(() => ({
  textField: {
    width: "100%"
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
  const [input, setInput] = useState(value);

  useEffect(() => {
    setInput(value);
  }, [value]);

  const onChange = e => {
    const value = e.target.type === "number" ? Number(e.target.value) : e.target.value;
    const checkInput = (name === "M0") | (name === "M1") | name === "CER" | name === "SD";
    if (!((value > max) & checkInput) & !((value < min) & checkInput)) {
      handleChange({
        name: e.target.name,
        value: value
      });
      setError(false);
    } else {
      setError(true);
    }
    setInput(value)
  };
  return (
    <form
      className={classes.container}
      noValidate
      autoComplete="off"
      onSubmit={handleSubmit}
    >
      <div>
        <TextField
          error={error}
          id={`input-${name}`}
          label={label}
          name={name}
          type={type}
          className={classes.textField}
          InputLabelProps={{
            shrink: true
          }}
          inputProps={inputProps}
          margin="dense"
          variant="filled"
          onChange={onChange}
          value={input}
          helperText={helperText}
        />
      </div>
    </form>
  );
};
export default SettingsInput;
