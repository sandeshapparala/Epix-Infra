'use client';

import React from 'react'
import {FloatingWhatsApp} from "react-floating-whatsapp";

const WhatsappIcon = () => {
    return (
        <div>
            <FloatingWhatsApp
                phoneNumber="+91 73864 40344"
                accountName="Epix Infra"
                avatar="/epix-wa-icon.png"
                chatMessage="Hi there! How can we help you today?"
                placeholder="Type your message..."
                notification
                notificationDelay={30}
                darkMode={false}
                style={{
                    bottom: '20px', // Adjust the vertical position
                    right: '20px', // Adjust the horizontal position
                    zIndex: 1000, // Ensure the button appears above all other elements
                }}
                buttonStyle={{
                    backgroundColor: '#25D366', // WhatsApp green
                    borderRadius: '50%', // Ensure the icon remains circular
                    width: '60px', // Customize icon size
                    height: '60px',
                }}
                chatboxStyle={{
                    backgroundColor: '#ffffff',
                    color: '#000000', // Chat text color
                }}
            />

        </div>
    )
}
export default WhatsappIcon
