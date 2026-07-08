# AI-chat-coding-assistant
A demo of AI chat coding assistant 

Please check out the app live 

https://subi333-aicodingassistant.hf.space/

You may need to wait 1 - 2 mts to get response as it is optimized to run on CPU


# AI Coding Assistant 🤖💻
A full-stack, real-time AI assistant designed to streamline your coding workflow. 
This project is built using a decoupled architecture.

 Frontend - React (Vite)
Backend - Node.js (Express)
          Python worker service

# Key Features
Intelligent Code Context: Tailored assistance for code generation & debugging etc. 
Dual-App Architecture: Separated frontend and backend layers managed under a unified workspace structure.

# 📂 Repository Architecture

```text
AI-chat-coding-assistant/
├── .gitignore          
├── README.md            # Documentation guide
├── LICENSE              # License file
├── AiServices/
│   ├── main.py          # Python service entry file
│   └── ...
├── Backend/             # Node.js & Express REST API
│   ├── src/  
│   │   ├── server.ts    # Entry point with dynamic CORS management
│   │   └── ...   
│   ├── package.json
│   └── ...
└── Frontend/            # React (Vite + TypeScript)
    ├── vite.config.ts   # Port-locked & host-exposed settings
    ├── src/
    │   ├── App.tsx      
    │   └── ...
    └── package.json
```

# 🛠️ Local Development Setup
Prerequisites:
Make sure you have Node.js installed on your computer.

1. Installation- 
   Clone the repository using 'git clone' and install dependencies across all workspaces.

2. Run the app- 
   You can start seperate services for Node API, Python service and React frontend
   or use a container locally. Make sure you have Redis running before start running all prcesses

If you are new to containerisation or process management with PM2, please refer to their documentation first.

  
