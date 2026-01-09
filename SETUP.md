# Monorepo Setup Instructions

## Current Status

✅ Frontend has been moved to `C:\dev\aletheia\aletheia-frontend`  
⏳ Backend needs to be moved from `C:\dev\aletheia-backend` to `C:\dev\aletheia\aletheia-backend`

## Steps to Complete Setup

### 1. Close All Processes Using the Backend

Before moving the backend, make sure to:
- Close your IDE (VS Code, Cursor, etc.)
- Stop any running Node.js processes
- Close any terminal windows in the backend directory

### 2. Move the Backend Directory

You have two options:

#### Option A: Use PowerShell Script
```powershell
cd C:\dev
.\aletheia\MOVE_BACKEND.ps1
```

#### Option B: Manual Move
```powershell
cd C:\dev
Move-Item -Path aletheia-backend -Destination aletheia\aletheia-backend
```

### 3. Verify Structure

After moving, verify the structure:
```
C:\dev\aletheia\
├── aletheia-backend\
├── aletheia-frontend\
├── package.json
├── README.md
└── .gitignore
```

### 4. Install Dependencies

From the monorepo root:
```bash
cd C:\dev\aletheia
npm install
```

This will install dependencies for both workspaces.

### 5. Update Your IDE

- Open the monorepo root: `C:\dev\aletheia`
- Your IDE should recognize both workspaces

## Workspace Commands

Once set up, you can use these commands from the root:

```bash
# Start backend
npm run start:backend

# Start frontend  
npm run start:frontend

# Build all
npm run build

# Test all
npm run test

# Lint all
npm run lint
```

## Troubleshooting

If you encounter issues:

1. **Backend won't move**: Make sure all processes are closed, including:
   - IDE
   - Node processes
   - File explorers
   - Any other tools accessing the directory

2. **Workspace not found**: After moving, run `npm install` from the root

3. **Path issues**: Update any absolute paths in your configuration files
