from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.stock import router as stock_router

app = FastAPI(title="StockSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stock_router, prefix="/api/stock")

@app.get("/")
def root():
    return {"message": "StockSense API is running!"}