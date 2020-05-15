import * as admin from 'firebase-admin'

admin.initializeApp({
	storageBucket: 'glaze-chat.appspot.com'
})

export { default as api } from './api'
