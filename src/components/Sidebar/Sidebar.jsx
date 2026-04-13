import React from 'react'
import './Sidebar.css'
import {assets} from '../../assets/assets'

const Sidebar = ({
    isMobileOpen,
    onCloseMobile,
    isExpanded,
    onToggleExpanded,
    recentChats,
    activeChatId,
    onNewChat,
    onSelectChat,
    onDeleteChat,
}) => {
    const isCompactScreen = () => {
        if (typeof window === 'undefined') return false
        return window.innerWidth <= 1024
    }

    const handleMenuClick = () => {
        if (isCompactScreen()) {
            onCloseMobile?.()
            return
        }

        onToggleExpanded?.()
    }

    const handleSidebarAction = () => {
        if (isCompactScreen()) {
            onCloseMobile?.()
        }
    }

    const handleNewChat = () => {
        onNewChat?.()
        handleSidebarAction()
    }

    const handleSelectRecentChat = (chatId) => {
        onSelectChat?.(chatId)
        handleSidebarAction()
    }

    const handleDeleteRecentChat = (event, chatId) => {
        event.stopPropagation()
        onDeleteChat?.(chatId)
    }

    const bottomItems = [
        { icon: assets.question_icon, label: 'Help' },
        { icon: assets.history_icon, label: 'Activity' },
        { icon: assets.setting_icon, label: 'Settings' },
    ]

    return (
        <div className={`sidebar ${isExpanded ? '' : 'collapsed'} ${isMobileOpen ? 'mobile-open' : ''}`}>
            <div className="top">
                <img
                    className='menu'
                    src={assets.menu_icon}
                    alt='Menu'
                    title='Menu'
                    onClick={handleMenuClick}
                />
                <div className="new-chat" data-label="New Chat" onClick={handleNewChat}>
                    <img src={assets.plus_icon} alt="Create new chat" />
                    <p>New Chat</p>
                </div>

                <div className="recent">
                    <p className="recent-title">Recent</p>
                    {recentChats?.length ? (
                        recentChats.map((chat) => (
                            <div
                                className={`sidebar-entry recent-entry ${chat.id === activeChatId ? 'active' : ''}`}
                                data-label={chat.title}
                                key={chat.id}
                                onClick={() => handleSelectRecentChat(chat.id)}
                            >
                                <div className="recent-entry-content">
                                    <img className="message-icon" src={assets.message_icon} alt="" />
                                    <p>{chat.title}</p>
                                </div>
                                <button
                                    type="button"
                                    className="delete-chat-button"
                                    title="Delete chat"
                                    aria-label={`Delete ${chat.title}`}
                                    onClick={(event) => handleDeleteRecentChat(event, chat.id)}
                                >
                                    x
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="recent-empty">No chats yet</p>
                    )}
                </div>
            </div>
            <div className="bottom">
                {bottomItems.map((item) => (
                    <div className="sidebar-entry" data-label={item.label} key={item.label} onClick={handleSidebarAction}>
                        <img src={item.icon} alt="" />
                        <p>{item.label}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Sidebar