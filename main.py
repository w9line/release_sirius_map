from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
import os
from pydantic import Field
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()
MARKERS_FILE = "markers.json"
REVIEWS_FILE = "reviews.json"

if not os.path.exists(MARKERS_FILE):
    with open(MARKERS_FILE, "w", encoding="utf-8") as f:
        json.dump([], f)

if not os.path.exists(REVIEWS_FILE):
    with open(REVIEWS_FILE, "w", encoding="utf-8") as f:
        json.dump([], f)

class Marker(BaseModel):
    id: int
    top: str
    left: str
    tooltip: str
    title: str = ""
    address: str = ""  
    description: str = ""
    image: str = ""  
    type: str = ""  

def load_markers():
    with open(MARKERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_markers(markers):
    with open(MARKERS_FILE, "w", encoding="utf-8") as f:
        json.dump(markers, f, ensure_ascii=False, indent=4)

@app.get("/markers")
async def get_markers(marker_type: str = Query(None)):
    markers = load_markers()
    if marker_type:
        markers = [m for m in markers if m.get("type") == marker_type]
    return {"markers": markers}

@app.post("/markers")
async def add_marker(marker: Marker):
    markers = load_markers()
    if any(m['id'] == marker.id for m in markers):
        raise HTTPException(status_code=400, detail="Маркер с таким ID уже существует")
    markers.append(marker.dict())
    save_markers(markers)
    return {"status": "success"}

@app.delete("/markers/{marker_id}")
async def delete_marker(marker_id: int):
    markers = load_markers()
    filtered = [m for m in markers if m["id"] != marker_id]
    if len(filtered) == len(markers):
        raise HTTPException(status_code=404, detail="Маркер не найден")
    save_markers(filtered)
    return {"status": "deleted"}



class Review(BaseModel):
    marker_id: int
    text: str
    author: str = "N"
    rating: int = Field(5, ge=1, le=5) 
    date: str = datetime.now().isoformat()  

def load_reviews():
    with open(REVIEWS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_reviews(reviews):
    with open(REVIEWS_FILE, "w", encoding="utf-8") as f:
        json.dump(reviews, f, ensure_ascii=False, indent=4)

@app.post("/reviews")
async def add_review(review: Review):
    reviews = load_reviews()
    reviews.append(review.dict())
    save_reviews(reviews)
    return {"status": "review added"}

@app.get("/reviews/{marker_id}")
async def get_reviews(marker_id: int):
    reviews = load_reviews()
    marker_reviews = [r for r in reviews if r["marker_id"] == marker_id]
    return {"reviews": marker_reviews}

app.mount("/", StaticFiles(directory="stat", html=True), name="static")