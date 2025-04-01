# backend/main.py
from fastapi import FastAPI

# Create an instance of the FastAPI application
app = FastAPI(title="Georgia Dashboard API")

# Define a simple route for the root URL ("/")
@app.get("/")
async def read_root():
    # This function runs when someone visits the base URL
    return {"message": "Hello from the Backend API!"}

# Add another simple endpoint just for testing
@app.get("/api/test")
async def test_endpoint():
    return {"data": "Test successful"}