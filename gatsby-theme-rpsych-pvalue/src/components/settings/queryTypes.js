import { NumberParam, StringParam, BooleanParam } from 'use-query-params';
export const queryTypes = {
    d: NumberParam,
    M0: NumberParam,
    M1: NumberParam,
    SD: NumberParam,
    M0lab: StringParam,
    M1lab: StringParam,
    xlab: StringParam,    
    q: StringParam,
    slider: BooleanParam, //minimal slider
  }