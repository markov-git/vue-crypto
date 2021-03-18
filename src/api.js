import keys from '@/key'

const tickersHandlers = new Map()
let socket
const AGGREGATE_INDEX = '5'
const INVALID_MESSAGE = 'INVALID_SUB'
const SUBSCRIBE_COMPLETE = 'SUBSCRIBECOMPLETE'
const USD_CURRENCY = 'USD'
const BTC_CURRENCY = 'BTC'
const worker = new SharedWorker('/sharedWorker.js')

const callApiHandlers = e => {
  const {TYPE: type, FROMSYMBOL: currency, PRICE: newPrice} = JSON.parse(e.data)
  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return
  }
  const handlers = tickersHandlers.get(currency) ?? []
  handlers.forEach(fn => fn(newPrice))
}

worker.port.addEventListener('message', e => {
  if (e.data === 'firstTab') {
    socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${keys.API_CRYPTO}`)
    socket.addEventListener('message', event => {
      callApiHandlers(event)
      worker.port.postMessage(event.data)
    })
  } else {
    callApiHandlers(e)
  }
})
worker.port.start()
worker.port.postMessage('start')

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message)
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage)
    return
  }
  socket.addEventListener('open', () => {
    console.log('afterOpen')
    socket.send(stringifiedMessage)
  }, {once: true})
}

function subscribeToTickerOnWs(ticker, currency) {
  sendToWebSocket({
    action: 'SubAdd',
    subs: [`5~CCCAGG~${ticker}~${currency}`]
  })
  return new Promise((resolve, reject) => {
    socket.addEventListener('message', e => {
      const {MESSAGE: message} = JSON.parse(e.data)
      if (message === INVALID_MESSAGE) {
        reject()
      }
      if (message === SUBSCRIBE_COMPLETE) {
        resolve()
      }
    })
  })
}

function unsubscribeToTickerOnWs(ticker) {
  sendToWebSocket({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${ticker}~USD`]
  })
}

export const subscribeToTicker = async (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || []
  tickersHandlers.set(ticker, [...subscribers, cb])
  try {
    await subscribeToTickerOnWs(ticker, USD_CURRENCY)
    return USD_CURRENCY
  } catch (_) {
    try {
      await subscribeToTickerOnWs(ticker, BTC_CURRENCY)
      return BTC_CURRENCY
    } catch (_) {
      return false
    }
  }
}

export const unsubscribeFromTicker = ticker => {
  unsubscribeToTickerOnWs(ticker)
  tickersHandlers.delete(ticker)
}
