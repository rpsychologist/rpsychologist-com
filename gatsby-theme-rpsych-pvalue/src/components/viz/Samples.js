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
  pHacked,
  meanShiftPx,
}) => {
  const { state, dispatch } = useContext(SettingsContext);
  const { updateDodge } = state;
  const radius = w < 400 ? 2 : 4;
  const prevPhacked = usePrevious(pHacked);
  const pHackedChanged = prevPhacked != pHacked;
  const dodge = useMemo(() => dodger(radius * 2 + 1), [
    state.updateDodge,
    pHacked,
    state.xAxis,
    state.n,
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
      data.map((props, i) => (
        <Circle
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
          pHackedChanged={pHackedChanged}
          timerRef={closeTimer}
          meanShiftPx={meanShiftPx}
        />
      )),
    [data.length, M1, updateDodge, pHacked, state.xAxis, state.n, xScaleSampleDist, w]
  );
  return <>{samples}</>;
};

export default Samples;
