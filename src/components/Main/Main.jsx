import React, { useState } from 'react'
import './Main.css'
import { assets } from '../../assets/assets'
import { generateEngineeringResponse } from '../../config/gemini'

const quickActions = [
    {
        question: 'Calculate bending stress for a simply supported beam with a center load.',
        detail: 'Civil and Mechanical',
    },
    {
        question: 'Derive the transfer function of a DC motor from first principles.',
        detail: 'Electrical and Control',
    },
    {
        question: 'Compare Otto and Diesel cycle efficiency for a chosen compression ratio.',
        detail: 'Thermodynamics',
    },
    {
        question: 'Solve this RLC network using nodal analysis step by step.',
        detail: 'Circuit Analysis',
    },
    {
        question: 'Recommend mesh size and boundary conditions for a plate with a hole.',
        detail: 'Finite Element Method',
    },
    {
        question: 'Create a manufacturing process plan for a machined aluminum bracket.',
        detail: 'Production Engineering',
    },
]

const Main = ({
    onMenuClick,
    onMainClick,
    activeChatId,
    messages,
    onAddMessageToChat,
    onSetChatTitleFromPrompt,
}) => {
    const [prompt, setPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handlePromptSubmit = async (valueFromAction) => {
        if (isLoading) return
        if (!activeChatId) return

        const query = (valueFromAction ?? prompt).trim()
        if (!query) return

        const chatIdForRequest = activeChatId

        setError('')
        setPrompt('')
        onSetChatTitleFromPrompt?.(chatIdForRequest, query)
        onAddMessageToChat?.(chatIdForRequest, { role: 'user', text: query })
        setIsLoading(true)

        try {
            const answer = await generateEngineeringResponse(query)
            onAddMessageToChat?.(chatIdForRequest, { role: 'assistant', text: answer })
        } catch (requestError) {
            setError(requestError.message || 'Something went wrong while fetching the response.')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePromptKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault()
            handlePromptSubmit()
        }
    }

    return (
        <main className="main" onClick={onMainClick}>
            <div className="main-nav">
                <div className="main-nav-left">
                    <button
                        type="button"
                        className="mobile-menu-button"
                        onClick={onMenuClick}
                        aria-label="Open menu"
                    >
                        <img className="mobile-menu-icon" src={assets.menu_icon} alt="" />
                    </button>
                    <p>Abhiyanta GPT</p>
                </div>
                <img className="profile-icon" src={assets.user_icon} alt="User profile" />
            </div>

            <div className="main-container">
                {messages.length === 0 ? (
                    <div className="greet">
                        <p><span>Hello, Abhiyanta Chatr.</span></p>
                        <p>How can I help you today?</p>
                    </div>
                ) : (
                    <div className="chat-feed">
                        {messages.map((message, index) => (
                            <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
                                <img
                                    src={message.role === 'user' ? assets.user_icon : assets.gemini_icon}
                                    alt={message.role === 'user' ? 'User' : 'Abhiyanta GPT'}
                                />
                                <p>{message.text}</p>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="chat-message assistant loading-message">
                                <img src={assets.gemini_icon} alt="Abhiyanta GPT" />
                                <p>Thinking...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="main-bottom">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Enter a prompt here"
                        value={prompt}
                        onChange={(event) => setPrompt(event.target.value)}
                        onKeyDown={handlePromptKeyDown}
                    />
                    <div className="search-icons">
                        <img src={assets.gallery_icon} alt="Attach media" />
                        <img src={assets.mic_icon} alt="Use microphone" />
                        <button
                            type="button"
                            className="send-button"
                            onClick={() => handlePromptSubmit()}
                            disabled={isLoading || !prompt.trim()}
                            aria-label="Send prompt"
                        >
                            <img className="send-icon" src={assets.send_icon} alt="" />
                        </button>
                    </div>
                </div>

                {messages.length === 0 && (
                    <div className="quick-actions">
                        {quickActions.map((action) => (
                            <button
                                type="button"
                                className="quick-action"
                                key={action.question}
                                onClick={() => handlePromptSubmit(action.question)}
                                disabled={isLoading}
                            >
                                <span className="quick-action-question">{action.question}</span>
                                <span className="quick-action-detail">{action.detail}</span>
                            </button>
                        ))}
                    </div>
                )}

                {error && <p className="error-message">{error}</p>}

                <p className="bottom-info">
                    Abhiyanta GPT may display inaccurate info, including about people, so double-check its responses.
                </p>
            </div>
        </main>
    )
}

export default Main