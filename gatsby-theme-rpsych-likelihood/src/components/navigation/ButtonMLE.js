import React from "react";
import Button from '@material-ui/core/Button';

export default function SampleButton({thetaHat, handleCange }) {
  const onClick = () => {
    handleCange(null, thetaHat)
  }

  return (
    <div>
      <div>
        <Button
          variant="contained"
          onClick={onClick}>
          MLE
        </Button>
      </div>
    </div>
  );
}
