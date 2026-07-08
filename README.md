# AI-chat-coding-assistant
A demo of AI chat coding assistant 

Please check out the app live 

https://subi333-aicodingassistant.hf.space/


# AI Coding Assistant 🤖💻
A full-stack, real-time AI assistant designed to streamline your coding workflow. 
This project is built using a decoupled architecture.

# Frontend - React (Vite)
# Backend - Node.js (Express)
#           Python worker service

# Key Features
Intelligent Code Context: Tailored assistance for code generation & debugging etc. 
Dual-App Architecture: Separated frontend and backend layers managed under a unified workspace structure.

# 📂 Repository Architecture
AI-chat-coding-assistant/

├── .gitignore          
├── README.md            # Documentation guide
├── LICENSE              # License file
├── AiServices
|      |── main.py       # python service entry file
|      └── ....... 
├── Backend/             # Node.js & Express REST API
|   ├── src  
│   |    ├── server.ts   # Entry point with dynamic CORS management
|   |    └── ......   
│   |── package.json
|   └── ......
|  
└── Frontend/            # React (Vite + TypeScript)
    ├── vite.config.ts   # Port-locked & host-exposed settings
    ├── src/
    |   |── App.tsx      
    │   └── ..........
    └── package.json
  
