let connected = false
const tabs = []

self.addEventListener('connect', e => {
  e.source.addEventListener('message', ev => {
    if (ev.data === 'start') {
      if (connected === false) {
        e.source.postMessage('init:main')
        connected = true
      } else {
        e.source.postMessage('init:child')
        tabs.push(e.source)
      }
    } else {
      tabs.forEach(tab => tab.postMessage(`data:${ev.data}`))
    }
  })
  e.source.start()
})
