import React from 'react'
import ReactDOM from 'react-dom'

import App from './components/App'
import * as serviceWorker from './serviceWorker'

import './scss/index.scss'

ReactDOM.render(<App />, document.getElementById('root'))

serviceWorker.register()
