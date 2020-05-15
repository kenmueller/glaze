import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom'

import App from './components/App'
import * as serviceWorker from './serviceWorker'

import './scss/index.scss'

ReactDOM.render((
	<StrictMode>
		<App />
	</StrictMode>
), document.getElementById('root'))

serviceWorker.register()

if (!navigator.sendBeacon)
	navigator.sendBeacon = (url, body) => {
		fetch(url, { method: 'POST', body, credentials: 'include' })
		return true
	}
