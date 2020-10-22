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
  step
}) => {
  const classes = useStyles();
  const inputProps = { min: min, max: max, step: step };
  const [input, setInput] = useState(Number(value));

  useEffect(() => {
    setInput(value);
  }, [value]);

  const onChange = e => {
    const value = e.target.value;
    const name = e.target.name;

    setInput(value);
    const checkInput = (name === "M0" | name === "M1");
    if ((value > max & checkInput) | (value < min & checkInput)) {
    } else {
      handleChange({
        name: e.target.name,
        value: value
      });
    }
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
        />
      </div>
    </form>
  );
};
export default SettingsInput;
