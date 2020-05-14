import React from 'react'
import ReactDOM from 'react-dom'

import App from './components/App'
import * as serviceWorker from './serviceWorker'

import './scss/index.scss'

const rootElement = document.getElementById('root') ?? document.body

ReactDOM[rootElement.hasChildNodes() ? 'hydrate' : 'render'](
	<App />,
	rootElement
)

serviceWorker.register()
