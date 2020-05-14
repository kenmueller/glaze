import React from 'react'
import { render } from 'react-snapshot'

import App from './components/App'
import * as serviceWorker from './serviceWorker'

import './scss/index.scss'

render(<App />, document.getElementById('root'))

serviceWorker.register()
