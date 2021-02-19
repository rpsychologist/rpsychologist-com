import { NumberParam, StringParam, ObjectParam, BooleanParam } from 'use-query-params';


export const queryTypes = {
    d: NumberParam,
    M0: NumberParam,
    M1: NumberParam,
    SD: NumberParam,
    CER: NumberParam,
    M0lab: StringParam,
    M1lab: StringParam,
    xlab: StringParam,    
    c0: ObjectParam,
    c1: ObjectParam,
    c2: ObjectParam,
    q: StringParam,
    slider: BooleanParam, //minimal slider
    donuts: BooleanParam
  }