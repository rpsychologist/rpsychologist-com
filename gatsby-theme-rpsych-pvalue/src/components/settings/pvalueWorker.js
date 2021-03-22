import PvalueWorker from './calcPvalues.worker.js'

const pvalueWorker = typeof window === 'object' && new PvalueWorker()

export default pvalueWorker