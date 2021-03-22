import React, {
  useMemo,
  useEffect,
  useContext,
} from "react";
import Circle from "./Circle";
import { dodger } from "./utils";
import { SettingsContext } from "../../Viz";
import _ from "lodash";
import { usePrevious } from "./utils"

const Samples = ({
  data,
  xScalePopDist,
  xScaleSampleDist,
  add,
  w,
  h,
  M0,
  M1,
  phacked,
  meanShiftPx,
}) => {
  const { state, dispatch } = useContext(SettingsContext);
  const { updateDodge, n, xAxis } = state;
  const radius = w < 400 ? 2 : 4;
  const prevPhacked = usePrevious(phacked);
  const pHackedChanged = prevPhacked != phacked;
  const dodge = useMemo(() => dodger(radius * 2 + 1), [
    updateDodge,
    phacked,
    xAxis,
    n,
  ]);
  const closeTimer = React.useRef();

  useEffect(() => {
    // Debounce update of dodger on resize
    if (prevPhacked != undefined) {
      const handler = setTimeout(() => {
        dispatch({ name: "CHANGE_COMMITTED", value: "" });
      }, 100);
      return () => {
        clearTimeout(handler);
      };
    }
  }, [w]);

  const samples = useMemo(
    () =>
      data.map((props, i) => {
        return (<Circle
          id={i}
          key={i}
          test={i - (data.length - add)}
          {...props}
          h={h}
          w={w}
          xScalePopDist={xScalePopDist}
          xScaleSampleDist={xScaleSampleDist}
          dodge={dodge}
          M0={M0}
          M1={M1}
          radius={radius}
          phacked={phacked}
          timerRef={closeTimer}
          meanShiftPx={meanShiftPx}
        />)
      }
      ),
    [data.length, updateDodge, phacked, xAxis, n, xScaleSampleDist, w]
  );
  return <>{samples}</>;
};

export default Samples;
