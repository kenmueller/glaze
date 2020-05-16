import React, { useState, useCallback, FormEvent, useEffect } from 'react'
import cx from 'classnames'

import useChat from '../hooks/useChat'
import useOnline from '../hooks/useOnline'
import { MAX_PARTICIPANT_COUNT } from '../constants'

import githubIcon from '../images/github.png'

import '../scss/components/Chat.scss'

export default () => {
	const {
		isReady,
		pendingMessages,
		setPendingMessage,
		messages,
		sendMessage,
		stopChat,
		participantCount,
		isGroupChat,
		setIsGroupChat,
		colorForParticipant
	} = useChat()
	
	const { onlineCount, setIsOnline } = useOnline()
	
	const [message, setMessage] = useState('')
	
	const next = useCallback(() => {
		stopChat()
	}, [stopChat])
	
	const send = useCallback((event: FormEvent) => {
		event.preventDefault()
		
		sendMessage(message)
		setMessage('')
	}, [sendMessage, message])
	
	const onMessagesRef = useCallback((div: HTMLDivElement | null) => {
		if (div)
			div.scrollTop = div.scrollHeight
	}, [messages, pendingMessages]) // eslint-disable-line
	
	const onInputRef = useCallback((input: HTMLInputElement | null) => {
		input?.focus()
	}, [message]) // eslint-disable-line
	
	useEffect(() => {
		setIsOnline(true)
	}, [setIsOnline])
	
	useEffect(() => {
		window.onbeforeunload = isReady
			? () => {
				stopChat()
				setIsOnline(false)
			}
			: null
	}, [isReady, stopChat, setIsOnline])
	
	useEffect(() => {
		setPendingMessage(message)
	}, [message, setPendingMessage])
	
	return (
		<div className="chat-container">
			<div className={cx('chat', { loading: !isReady })}>
				{isReady
					? (
						<>
							<div className="header">
								{onlineCount === null || (
									<p className="online">
										{onlineCount} online
									</p>
								)}
								<button className="next" onClick={next}>
									Next chat
								</button>
							</div>
							<div ref={onMessagesRef} className="messages">
								<p className="header">
									Say hi! You're chatting with {
										participantCount > 2
											? `${participantCount - 1} other people`
											: 'a random person'
									}.
								</p>
								{messages.map(({ id, didSend, from, data }) => (
									<p
										key={id}
										className={cx('message', { 'did-send': didSend })}
										style={didSend ? undefined : colorForParticipant(from)}
									>
										{data}
									</p>
								))}
								{pendingMessages.map(({ uid, data }) => (
									<p
										key={uid}
										className="message pending"
										style={colorForParticipant(uid)}
									>
										{data}
									</p>
								))}
							</div>
							<form onSubmit={send}>
								<input
									ref={onInputRef}
									placeholder="Say anything!"
									value={message}
									onChange={({ target: { value } }) => setMessage(value)}
								/>
								<button disabled={!message}>
									Send
								</button>
							</form>
						</>
					)
					: (
						<>
							<div className="loader" />
							{onlineCount === null || (
								<p>{onlineCount} online</p>
							)}
						</>
					)
				}
			</div>
			<footer className={cx({ ready: isReady })}>
				{isReady && (
					<button
						className={cx('group-toggle', { on: isGroupChat })}
						onClick={() => setIsGroupChat(!isGroupChat)}
					>
						<div className="indicator" />
						<p>Group chat ({participantCount}/{MAX_PARTICIPANT_COUNT})</p>
					</button>
				)}
				<a
					className="github"
					href="https://github.com/kenmueller/glaze"
					target="_blank"
					rel="author nofollow noopener noreferrer"
				>
					<img src={githubIcon} alt="GitHub" />
					<p>GitHub</p>
				</a>
			</footer>
		</div>
	)
}
