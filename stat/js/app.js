const mapContainer = document.getElementById("mapContainer");
const mapWrapper = document.getElementById("mapWrapper");
const mapImage = document.getElementById("mapImage");
let scale = 1;
const minScale = 1;
const maxScale = 21;
let isDraggingMap = false;
let didDragMap = false;
let isDraggingMarker = false;
let didDragMarker = false;
let currentMarkerId = null;
let currentRating = 5;
let startX, startY, scrollLeft, scrollTop;
let lastClientX, lastClientY;
let currentMarkerData = {};
const searchInput = document.getElementById("searchInput");

// mapContainer.style.width = '800px';
// mapContainer.style.height = '100%';

mapContainer.addEventListener("wheel", (e) => {
if (e.ctrlKey) {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    scale += delta;
    scale = Math.max(minScale, Math.min(maxScale, scale));
    mapWrapper.style.transform = `scale(${scale})`;
}
}, { passive: false });

mapContainer.addEventListener('mousedown', (e) => {
isDraggingMap = true;
didDragMap = false;
startX = e.clientX;
startY = e.clientY;
scrollLeft = mapContainer.scrollLeft;
scrollTop = mapContainer.scrollTop;
mapContainer.style.cursor = 'grabbing';
});
mapContainer.addEventListener('mouseleave', () => {
isDraggingMap = false;
mapContainer.style.cursor = 'grab';
});
mapContainer.addEventListener('mouseup', () => {
isDraggingMap = false;
mapContainer.style.cursor = 'grab';
if (Math.abs(startX - lastClientX) > 3 || Math.abs(startY - lastClientY) > 3) {
    didDragMap = true;
}
});
mapContainer.addEventListener('mousemove', (e) => {
lastClientX = e.clientX;
lastClientY = e.clientY;
if (!isDraggingMap) return;
e.preventDefault();
const x = e.clientX - startX;
const y = e.clientY - startY;
mapContainer.scrollLeft = scrollLeft - x;
mapContainer.scrollTop = scrollTop - y;
});
function showForm() {
    closeAllModals();
    document.getElementById("markerFormModal").style.display = "block";
  }
function hideForm() {
document.getElementById("markerFormModal").style.display = "none";
}
function zoomMap(delta) {
const newScale = Math.max(minScale, Math.min(maxScale, scale + delta));
if (newScale !== scale) {
    scale = newScale;
    mapWrapper.style.transform = `scale(${scale})`;
}
}
function resetMap() {
scale = 1;
mapWrapper.style.transform = `scale(${scale})`;
mapContainer.scrollLeft = 0;
mapContainer.scrollTop = 0;
}
async function showInfo(title, description, image, markerId, address, type) {
  closeAllModals();
  const leftSide = document.querySelector('.left-side');
  if (leftSide) {
      if (leftSide.style.display === 'none') {
          leftSide.style.display = 'flex'; 
      }
  }
currentMarkerId = markerId;
document.getElementById("infoTitle").textContent = title;
document.getElementById("infoDescription").textContent = description;
document.getElementById("infoAddress").textContent = address || "Адрес не указан";
const typeMap = {
    cafe: "Кафе",
    museum: "Музей",
    park: "Парк",
    shop: "Магазин",
    other: "Другое"
};
document.getElementById("infoType").textContent = typeMap[type] || "Неизвестный тип";

const imgEl = document.getElementById("infoImage");
if (image) {
    imgEl.src = image;
    imgEl.style.display = "block";
} else {
    imgEl.style.display = "none";
}

await loadReviews(markerId);
document.getElementById("markerInfoModal").style.display = "block";
}
async function loadReviews(markerId) {
const res = await fetch(`/reviews/${markerId}`);
const data = await res.json();

const reviews = data.reviews || [];
const reviewsList = document.getElementById("reviewsList");
const averageRatingEl = document.getElementById("averageRating");

reviewsList.innerHTML = "";

if (reviews.length === 0) {
    averageRatingEl.textContent = "—";
    reviewsList.innerHTML = "<p>Нет отзывов.</p>";
    return;
}

let totalRating = 0;

reviews.forEach((review) => {
    totalRating += review.rating;

    const date = new Date(review.date).toLocaleDateString("ru-RU");

    const div = document.createElement("div");
    div.style.borderTop = "1px solid #ccc";
    div.style.paddingTop = "8px";
    div.style.marginTop = "8px";
    div.innerHTML = `
    <strong>⭐ ${review.rating}/5</strong><br>
    <em>${date}</em><br>
    <strong>:${review.author}</strong><br>
    <span>${review.text}</span>
    `;
    reviewsList.appendChild(div);
});

const avg = (totalRating / reviews.length).toFixed(1);
averageRatingEl.textContent = avg;
}
document.querySelectorAll(".rating-star").forEach(star => {
star.addEventListener("click", () => {
    const rating = parseInt(star.getAttribute("data-rating"));
    currentRating = rating;
    document.querySelectorAll(".rating-star").forEach((s, i) => {
    s.classList.toggle("selected", i < rating);
    });
});
});
function closeAllModals() {
    document.getElementById("markerInfoModal").style.display = "none";
    document.getElementById("markerFormModal").style.display = "none";
}
async function submitReview() {
const text = document.getElementById("reviewText").value.trim();
const author = document.getElementById("reviewAuthor").value.trim();
if (!text) {
    alert("Введите текст отзыва.");
    return;
}

const review = {
    marker_id: parseInt(currentMarkerId),
    text,
    author: author || "Аноним",
    rating: currentRating
};

const res = await fetch("/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(review)
});

if (res.ok) {
    document.getElementById("reviewText").value = "";
    document.getElementById("reviewAuthor").value = "";
    currentRating = 5;
    document.querySelectorAll(".rating-star").forEach((s, i) => {
    s.classList.toggle("selected", i < 5);
    });
    await loadReviews(currentMarkerId);
} else {
    alert("Ошибка при добавлении отзыва");
}
}
function updateRatingDisplay() {
document.querySelectorAll(".rating-star").forEach((s, i) => {
    s.classList.toggle("selected", i < currentRating);
});
}
async function deleteCurrentMarker() {
if (!currentMarkerId) return;
if (!confirm("Вы уверены, что хотите удалить эту метку?")) return;
const res = await fetch(`/markers/${currentMarkerId}`, {
    method: "DELETE"
});
if (res.ok) {
    hideInfo();
    location.reload();
} else {
    alert("Ошибка при удалении метки");
}
}
function hideInfo() {
document.getElementById("markerInfoModal").style.display = "none";
}
async function submitMarker() {
const title = document.getElementById("formTitle").value.trim();
const address = document.getElementById("formAddress").value.trim(); 
const type = document.getElementById("formType").value; 
const desc = document.getElementById("formDescription").value.trim();
const fileInput = document.getElementById("formImage");
const file = fileInput.files[0];
let imageUrl = "";
if (!type) {
    alert("Выберите категорию!");
    return;
}
if (file) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    await new Promise((resolve) => (reader.onload = resolve));
    imageUrl = reader.result;
}

const marker = {
    ...currentMarkerData,
    title,
    address, 
    type,   
    description: desc,
    image: imageUrl,
    tooltip: title || "Место"
};

const res = await fetch("/markers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(marker)
});

if (res.ok) {
    addMarkerToDOM(marker);
    hideForm();
} else {
    alert("Ошибка сохранения");
}
}
function addMarkerToDOM(marker) {
  const div = document.createElement("div");
  div.className = "marker " + marker.type;
  div.style.top = `${marker.top}%`;
  div.style.left = `${marker.left}%`;

  div.dataset.title = marker.title || "";
  div.dataset.address = marker.address || "";
  div.dataset.image = marker.image || "";
  div.dataset.description = marker.description || "";
  div.dataset.id = marker.id;
  const icon = document.createElement("i");

  switch (marker.type) {
    case 'cafe':
      icon.className = 'marker-icon fas fa-coffee';
      break;
    case 'museum':
      icon.className = 'marker-icon fas fa-landmark';
      break;
    case 'park':
      icon.className = 'marker-icon fas fa-tree';
      break;
    case 'shop':
      icon.className = 'marker-icon fas fa-shopping-bag';
      break;
    default:
      icon.className = 'marker-icon fas fa-question-circle';
  }

  const label = document.createElement("div");
  label.className = "marker-label";
  label.textContent = marker.title || marker.tooltip;

  div.appendChild(icon);
  div.appendChild(label);

  div.addEventListener("click", (e) => {
    if (didDragMarker) {
      didDragMarker = false;
      return;
    }
    e.stopPropagation();
    showInfo(
      marker.title,
      marker.description,
      marker.image,
      marker.id,
      marker.address,
      marker.type
    );
  });

  mapWrapper.appendChild(div);
}
async function loadMarkers() {
const res = await fetch("/markers");
const data = await res.json();
data.markers.forEach(addMarkerToDOM);
}
mapContainer.addEventListener("click", (e) => {
if (didDragMarker || didDragMap) {
didDragMarker = false;
didDragMap = false;
return;
}

const rect = mapContainer.getBoundingClientRect();
const x = e.clientX - rect.left + mapContainer.scrollLeft;
const y = e.clientY - rect.top + mapContainer.scrollTop;
const scaledX = x / scale;
const scaledY = y / scale;
const percentX = (scaledX / rect.width) * 100;
const percentY = (scaledY / rect.height) * 100;

currentMarkerData = {
id: Date.now(),
top: percentY.toFixed(2),
left: percentX.toFixed(2)
};

const leftSide = document.querySelector('.left-side');
if (leftSide) {
    if (leftSide.style.display === 'none') {
        leftSide.style.display = 'flex'; 
    }
}

showForm();

});
function updateMarkersVisibility() {
    const checkboxes = document.querySelectorAll('#filterPanel input[type="checkbox"]');
    const filters = {};
    checkboxes.forEach(cb => {
        filters[cb.dataset.filter] = cb.checked;
    });

    const query = searchInput.value.trim();
    const normalizedQuery = normalizeText(query);

    document.querySelectorAll('.marker').forEach(marker => {
        const classes = marker.className.split(' ');
        let matchesFilter = false;

        for (let cls of classes) {
            if (filters[cls]) {
                matchesFilter = true;
                break;
            }
        }

        const title = marker.dataset.title || "";
        const normalizedTitle = normalizeText(title);
        const matchesSearch = !normalizedQuery || normalizedTitle.includes(normalizedQuery);

        if (matchesFilter && matchesSearch) {
            marker.style.display = 'block';
        } else {
            marker.style.display = 'none';
        }
    });

    updateMarkerList();  
}
document.querySelectorAll('#filterPanel input[type="checkbox"]').forEach(input => {
input.addEventListener('change', updateMarkersVisibility);
});
function toggleAllFilters(state) {
document.querySelectorAll('#filterPanel input[type="checkbox"]').forEach(cb => {
cb.checked = state;
});
  updateMarkersVisibility(); 
  updateMarkerList();  

}
function toggleFilters() {
  const btn = document.getElementById('toggleFilterBtn');
  const icon = btn.querySelector('i');

  const isVisible = icon.classList.contains('fa-eye');

  if (isVisible) {
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }

  toggleAllFilters(!isVisible); 
}
function toggleMenu() {
    const leftSide = document.querySelector('.left-side');
    if (leftSide) {
        if (leftSide.style.display === 'none') {
            leftSide.style.display = 'flex'; 
        } else {
            leftSide.style.display = 'none';
        }
    }
}
function updateMarkersVisibility() {
  const checkboxes = document.querySelectorAll('#filterPanel input[type="checkbox"]');
  const filters = {};
  checkboxes.forEach(cb => {
    filters[cb.dataset.filter] = cb.checked;
  });

  document.querySelectorAll('.marker').forEach(marker => {
    const classes = marker.className.split(' ');
    for (let cls of classes) {
      if (filters[cls]) {
        marker.style.display = 'block';
        return;
      }
    }
    marker.style.display = 'none';
  });
}
function performScroll(markerEl) {
    const mapRect = mapContainer.getBoundingClientRect();

    const markerRect = markerEl.getBoundingClientRect();

    const centerX = mapRect.width / 2;
    const centerY = mapRect.height / 2;

    const scrollLeft = markerRect.left + mapContainer.scrollLeft - centerX;
    const scrollTop = markerRect.top + mapContainer.scrollTop - centerY;

    mapContainer.scrollTo({
        left: scrollLeft,
        top: scrollTop,
        behavior: 'smooth'
    });
}
function flashMarkerBorder(markerEl) {
    markerEl.classList.add("flash-border");

    setTimeout(() => {
        markerEl.classList.remove("flash-border");
    }, 500);
}
function zoomAndScrollToMarker(markerEl) {
    performScroll(markerEl); 
    flashMarkerBorder(markerEl);
}
function updateMarkerList() {
    const markerListContainer = document.getElementById("markerList");
    if (!markerListContainer) return;
    markerListContainer.innerHTML = "";

    const visibleMarkers = document.querySelectorAll(".marker[style*='display: block']");
    visibleMarkers.forEach(markerEl => {
        const title = markerEl.dataset.title || "Без названия";
        const address = markerEl.dataset.address || "Адрес не указан";
        const image = markerEl.dataset.image;

        const card = document.createElement("div");
        card.className = "marker-card";
        card.addEventListener("click", () => {
            zoomAndScrollToMarker(markerEl);
        });

        const imagePart = document.createElement("div");
        if (image) {
            imagePart.className = "marker-image-part";
            imagePart.style.backgroundImage = `url(${image})`;
        } else {
            imagePart.className = "marker-image-part marker-default";
        }

        const infoPart = document.createElement("div");
        infoPart.className = "marker-info-part";
        infoPart.innerHTML = `
            <h5>${title}</h5>
            <p>${address}</p>
        `;

        card.appendChild(imagePart);
        card.appendChild(infoPart);
        markerListContainer.appendChild(card);
    });
}
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/["'.,!?;:()]/g, '') 
        .trim();
}
function setupSearch() {
    let markersOnMap = [];

    document.addEventListener("DOMContentLoaded", async () => {
        const res = await fetch("/markers");
        const data = await res.json();
        markersOnMap = [...data.markers];
    });

    function performSearch(query) {
        const normalizedQuery = normalizeText(query);

        document.querySelectorAll(".marker").forEach(markerEl => {
            const title = markerEl.dataset.title || "";
            const normalizedTitle = normalizeText(title);

            if (!normalizedQuery || normalizedTitle.includes(normalizedQuery)) {
                markerEl.style.display = "block";
            } else {
                markerEl.style.display = "none";
            }
        });

        updateMarkerList(); 
    }

    searchInput.addEventListener("input", (e) => {
        performSearch(e.target.value);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  loadMarkers().then(() => {
    updateMarkersVisibility(); 
    updateMarkerList();        
  });
});

document.querySelectorAll('#filterPanel input[type="checkbox"]').forEach(input => {
  input.addEventListener('change', () => {
    updateMarkersVisibility();
    updateMarkerList();
  });
});
// loadMarkers();
// updateMarkersVisibility();
setupSearch();

