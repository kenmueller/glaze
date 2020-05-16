import { useState, useCallback, useEffect, useRef } from 'react'

import firebase from '../firebase'
import useUID from './useUID'
import useAudio from './useAudio'
import { ChatColor, randomElement } from '../utils'
import { CHAT_COLORS, DEFAULT_CHAT_COLOR, MAX_PARTICIPANT_COUNT } from '../constants'

import 'firebase/firestore'

export interface PendingMessage {
	uid: string
	data: string
}

export interface Message {
	id: string
	didSend: boolean
	from: string
	data: string
}

const { FieldValue } = firebase.firestore
const firestore = firebase.firestore()

export default () => {
	const availableColors = useRef(CHAT_COLORS)
	
	const [isReady, setIsReady] = useState(false)
	const [chatId, setChatId] = useState(null as string | null)
	
	const [pendingMessages, setPendingMessages] = useState([] as PendingMessage[])
	const [participantCount, setParticipantCount] = useState(0)
	const [isGroupChat, setIsGroupChat] = useState(false)
	
	const [colors, setColors] = useState({} as Record<string, ChatColor>)
	
	const [messages, setMessages] = useState([] as Message[])
	
	const uid = useUID()
	
	const [playJoinChatSound] = useAudio(require('../sounds/join-chat.wav'))
	const [playSendMessageSound] = useAudio(require('../sounds/send-message.mp3'))
	const [playReceiveMessageSound] = useAudio(require('../sounds/receive-message.wav'))
	const [playTypingSound, pauseTypingSound] = useAudio(require('../sounds/typing.mp3'), true)
	
	const loadChat = useCallback(async () => {
		const { empty, docs } = await firestore
			.collection('chats')
			.where('available', '==', true)
			.limit(1)
			.get()
		
		const batch = firestore.batch()
		const requestDoc = firestore.doc(`requests/${uid}`)
		
		if (empty) {
			const chatDoc = firestore.collection('chats').doc()
			
			batch.set(chatDoc, {
				available: true,
				participants: 1,
				creator: uid
			})
			
			batch.set(requestDoc, {
				available: true,
				chat: chatDoc.id
			})
		} else {
			const snapshot = docs[0]
			
			batch.update(snapshot.ref, {
				available: Boolean(
					snapshot.get('group') && ((snapshot.get('participants') + 1) < MAX_PARTICIPANT_COUNT)
				),
				participants: FieldValue.increment(1)
			})
			
			const requestData = {
				available: false,
				chat: snapshot.id
			}
			
			batch.set(requestDoc, requestData)
			batch.set(
				firestore.doc(`requests/${snapshot.get('creator')}`),
				requestData
			)
		}
		
		return batch.commit()
	}, [uid])
	
	useEffect(() => (
		firestore.doc(`requests/${uid}`).onSnapshot(
			snapshot => {
				setIsReady(snapshot.exists && !snapshot.get('available'))
				setChatId(snapshot.get('chat') ?? null)
			},
			error => {
				alert(error.message)
				console.error(error)
			}
		)
	), [uid])
	
	useEffect(() => {
		if (!chatId)
			return void loadChat()
		
		const removeChatListener = firestore
			.doc(`chats/${chatId}`)
			.onSnapshot(
				snapshot => {
					if (!snapshot.exists)
						return firestore.doc(`requests/${uid}`).set({
							available: false
						})
					
					setIsGroupChat(snapshot.get('group') ?? false)
					setParticipantCount(snapshot.get('participants') ?? 0)
					
					const pendingMessages: (
						Record<string, string> | undefined
					) = snapshot.get('pendingMessages')
					
					if (!pendingMessages)
						return
					
					const entries = Object.entries(pendingMessages)
					
					setPendingMessages(entries.reduce((acc, [key, data]) => (
						!data || (key === uid)
							? acc
							: [...acc, { uid: key, data }]
					), [] as PendingMessage[]))
					
					setColors(colors => {
						const acc = { ...colors }
						
						for (const [key] of entries) {
							if (key in acc || key === uid)
								continue
							
							if (entries.length === 2) {
								acc[key] = DEFAULT_CHAT_COLOR
								return acc
							}
							
							const element = randomElement(availableColors.current, null)
							
							acc[key] = element?.value ?? DEFAULT_CHAT_COLOR
							
							availableColors.current =
								availableColors.current.filter((_, i) => i !== element?.index)
						}
						
						return acc
					})
				},
				error => {
					alert(error.message)
					console.error(error)
				}
			)
		
		const removeMessagesListener = firestore
			.collection(`chats/${chatId}/messages`)
			.onSnapshot(
				snapshot => {
					for (const { type, doc } of snapshot.docChanges()) {
						const { id } = doc
						
						switch (type) {
							case 'added': {
								const from = doc.get('from')
								const didSend = from === uid
								
								setMessages(messages => [
									...messages,
									{ id, didSend, from, data: doc.get('data') }
								])
								
								didSend
									? playSendMessageSound()
									: playReceiveMessageSound()
								
								break
							}
							case 'removed':
								setMessages(messages =>
									messages.filter(message => message.id !== id)
								)
								break
						}
					}
				},
				error => {
					alert(error.message)
					console.error(error)
				}
			)
		
		return () => {
			removeChatListener()
			removeMessagesListener()
			
			setPendingMessages([])
			setParticipantCount(0)
			availableColors.current = CHAT_COLORS
			setColors({})
			setMessages([])
		}
	}, [chatId, uid, loadChat, playSendMessageSound, playReceiveMessageSound])
	
	useEffect(() => {
		if (isReady)
			playJoinChatSound()
	}, [isReady, playJoinChatSound])
	
	useEffect(() => {
		pendingMessages.length > 0
			? playTypingSound()
			: pauseTypingSound()
	}, [pendingMessages, playTypingSound, pauseTypingSound])
	
	return {
		isReady,
		pendingMessages,
		setPendingMessage: useCallback((message: string) => {
			if (chatId)
				firestore.doc(`chats/${chatId}`).update({
					[`pendingMessages.${uid}`]: message
				})
		}, [chatId, uid]),
		messages,
		sendMessage: useCallback((data: string) => {
			if (chatId)
				firestore.collection(`chats/${chatId}/messages`).add({
					from: uid,
					data
				})
		}, [chatId, uid]),
		stopChat: useCallback(() => {
			if (chatId)
				navigator.sendBeacon(
					'https://glaze.chat/api/stop-chat',
					JSON.stringify({
						chat: chatId,
						user: uid,
						count: participantCount - 1
					})
				)
		}, [chatId, uid, participantCount]),
		participantCount,
		isGroupChat,
		setIsGroupChat: useCallback((isGroupChat: boolean) => {
			if (chatId)
				firestore.doc(`chats/${chatId}`).update({
					available: isGroupChat,
					group: isGroupChat
				})
		}, [chatId]),
		colorForParticipant: useCallback((key: string) => (
			colors[key] ?? DEFAULT_CHAT_COLOR
		), [colors])
	}
}
