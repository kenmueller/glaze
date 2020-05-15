import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as express from 'express'
import * as cors from 'cors'

import { parseStringToBoolean } from './utils'

const firestore = admin.firestore()
const app = express()

export default functions.https.onRequest(app)

app.use(cors())

app.post('/api/online', async ({ body }, res) => {
	try {
		const isOnline = parseStringToBoolean(body)
		
		await firestore.doc('counts/online').update({
			value: admin.firestore.FieldValue.increment(isOnline ? 1 : -1)
		})
		
		res.send()
	} catch (error) {
		console.error(error)
		res.status(500).send(error.message)
	}
})

app.post('/api/stop-chat', async ({ body }, res) => {
	try {
		const { chat: chatId, user: uid } = JSON.parse(body)
		
		if (!(typeof chatId === 'string' && typeof uid === 'string'))
			throw new Error('Invalid types')
		
		const batch = firestore.batch()
		
		batch.delete(firestore.doc(`chats/${chatId}`))
		batch.set(firestore.doc(`requests/${uid}`), {
			available: false
		})
		
		await batch.commit()
		
		res.send()
	} catch (error) {
		console.error(error)
		res.status(500).send(error.message)
	}
})
