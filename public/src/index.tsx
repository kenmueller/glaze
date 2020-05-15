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
