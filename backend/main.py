import uvicorn

if __name__ == "__main__":
    import os
    import sys
    
    # Ensure the app module can be found
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
