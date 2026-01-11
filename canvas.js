// Canvas management and rendering

class GardenCanvas {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');

        // Canvas state
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        this.minScale = 0.1;
        this.maxScale = 3;

        // Interaction state
        this.isPanning = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.resize();
        this.setupEventListeners();
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        // Center the view
        this.offsetX = this.canvas.width / 2;
        this.offsetY = this.canvas.height / 2;
    }

    setupEventListeners() {
        // Mouse wheel and trackpad gesture for zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();

            // Check if this is a pinch gesture (ctrlKey is set for trackpad pinch)
            if (e.ctrlKey) {
                // Trackpad pinch-to-zoom
                const delta = e.deltaY > 0 ? 0.95 : 1.05;
                this.zoomAt(e.offsetX, e.offsetY, delta);
            } else {
                // Regular mouse wheel or trackpad scroll zoom
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                this.zoomAt(e.offsetX, e.offsetY, delta);
            }

            // Trigger render callback if set
            if (this.onZoom) {
                this.onZoom();
            }
        }, { passive: false });

        // Window resize
        window.addEventListener('resize', () => {
            this.resize();
            if (this.onResize) {
                this.onResize();
            }
        });
    }

    setOnZoom(callback) {
        this.onZoom = callback;
    }

    setOnResize(callback) {
        this.onResize = callback;
    }

    zoomAt(mouseX, mouseY, delta) {
        const newScale = this.scale * delta;

        if (newScale >= this.minScale && newScale <= this.maxScale) {
            // Zoom towards mouse position
            this.offsetX = mouseX - (mouseX - this.offsetX) * delta;
            this.offsetY = mouseY - (mouseY - this.offsetY) * delta;
            this.scale = newScale;
        }
    }

    zoomIn() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        this.zoomAt(centerX, centerY, 1.2);
    }

    zoomOut() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        this.zoomAt(centerX, centerY, 0.8);
    }

    fitToScreen(beds) {
        if (beds.length === 0) return;

        // Calculate bounds of all beds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        beds.forEach(bed => {
            if (bed.type === 'rectangle') {
                minX = Math.min(minX, bed.x - bed.width / 2);
                maxX = Math.max(maxX, bed.x + bed.width / 2);
                minY = Math.min(minY, bed.y - bed.height / 2);
                maxY = Math.max(maxY, bed.y + bed.height / 2);
            } else if (bed.type === 'circle') {
                minX = Math.min(minX, bed.x - bed.radius);
                maxX = Math.max(maxX, bed.x + bed.radius);
                minY = Math.min(minY, bed.y - bed.radius);
                maxY = Math.max(maxY, bed.y + bed.radius);
            }
        });

        const boundsWidth = maxX - minX;
        const boundsHeight = maxY - minY;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Calculate scale to fit in viewport with padding
        const padding = 50;
        const scaleX = (this.canvas.width - padding * 2) / boundsWidth;
        const scaleY = (this.canvas.height - padding * 2) / boundsHeight;
        this.scale = Math.min(scaleX, scaleY, this.maxScale);

        // Center the view
        this.offsetX = this.canvas.width / 2 - centerX * this.scale;
        this.offsetY = this.canvas.height / 2 - centerY * this.scale;
    }

    // Transform screen coordinates to world coordinates
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.offsetX) / this.scale,
            y: (screenY - this.offsetY) / this.scale
        };
    }

    // Transform world coordinates to screen coordinates
    worldToScreen(worldX, worldY) {
        return {
            x: worldX * this.scale + this.offsetX,
            y: worldY * this.scale + this.offsetY
        };
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid background
        this.drawGrid();
    }

    drawGrid() {
        const gridSize = 50; // Grid every 50 inches
        const ctx = this.ctx;

        ctx.save();
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;

        const startX = Math.floor((-this.offsetX / this.scale) / gridSize) * gridSize;
        const startY = Math.floor((-this.offsetY / this.scale) / gridSize) * gridSize;
        const endX = startX + (this.canvas.width / this.scale) + gridSize;
        const endY = startY + (this.canvas.height / this.scale) + gridSize;

        // Vertical lines
        for (let x = startX; x < endX; x += gridSize) {
            const screenPos = this.worldToScreen(x, 0);
            ctx.beginPath();
            ctx.moveTo(screenPos.x, 0);
            ctx.lineTo(screenPos.x, this.canvas.height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = startY; y < endY; y += gridSize) {
            const screenPos = this.worldToScreen(0, y);
            ctx.beginPath();
            ctx.moveTo(0, screenPos.y);
            ctx.lineTo(this.canvas.width, screenPos.y);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawBed(bed, isSelected = false) {
        const ctx = this.ctx;
        ctx.save();

        const screenPos = this.worldToScreen(bed.x, bed.y);

        ctx.translate(screenPos.x, screenPos.y);

        if (bed.type === 'rectangle') {
            this.drawRectangleBed(bed, isSelected);
        } else if (bed.type === 'circle') {
            this.drawCircleBed(bed, isSelected);
        }

        ctx.restore();
    }

    drawRectangleBed(bed, isSelected) {
        const ctx = this.ctx;
        const width = bed.width * this.scale;
        const height = bed.height * this.scale;

        // Draw bed fill
        ctx.fillStyle = isSelected ? 'rgba(139, 92, 68, 0.15)' : 'rgba(139, 92, 68, 0.1)';
        ctx.fillRect(-width / 2, -height / 2, width, height);

        // Draw bed border
        ctx.strokeStyle = isSelected ? '#3182ce' : '#8b5c44';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeRect(-width / 2, -height / 2, width, height);

        // Draw plants
        if (bed.plantGroups && bed.plantGroups.length > 0) {
            this.drawPlants(bed.plantGroups);
        }

        // Draw label
        this.drawBedLabel(bed, width, height);

        // Draw resize handles if selected
        if (isSelected) {
            this.drawResizeHandles(bed, width, height);
        }
    }

    drawCircleBed(bed, isSelected) {
        const ctx = this.ctx;
        const radius = bed.radius * this.scale;

        // Draw bed fill
        ctx.fillStyle = isSelected ? 'rgba(139, 92, 68, 0.15)' : 'rgba(139, 92, 68, 0.1)';
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw bed border
        ctx.strokeStyle = isSelected ? '#3182ce' : '#8b5c44';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw plants
        if (bed.plantGroups && bed.plantGroups.length > 0) {
            this.drawPlants(bed.plantGroups);
        }

        // Draw label
        this.drawBedLabel(bed, radius * 2, radius * 2);

        // Draw resize handles if selected
        if (isSelected) {
            this.drawCircleResizeHandle(radius);
        }
    }

    drawResizeHandles(bed, width, height) {
        const ctx = this.ctx;
        const handleSize = 8;

        ctx.fillStyle = '#3182ce';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;

        // Define handle positions
        const handles = [
            { x: -width / 2, y: -height / 2, cursor: 'nw-resize' }, // top-left
            { x: width / 2, y: -height / 2, cursor: 'ne-resize' },  // top-right
            { x: width / 2, y: height / 2, cursor: 'se-resize' },   // bottom-right
            { x: -width / 2, y: height / 2, cursor: 'sw-resize' },  // bottom-left
            { x: 0, y: -height / 2, cursor: 'n-resize' },           // top
            { x: width / 2, y: 0, cursor: 'e-resize' },             // right
            { x: 0, y: height / 2, cursor: 's-resize' },            // bottom
            { x: -width / 2, y: 0, cursor: 'w-resize' }             // left
        ];

        handles.forEach(handle => {
            ctx.beginPath();
            ctx.arc(handle.x, handle.y, handleSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }

    drawCircleResizeHandle(radius) {
        const ctx = this.ctx;
        const handleSize = 8;

        ctx.fillStyle = '#3182ce';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;

        // Draw handle on the right edge
        ctx.beginPath();
        ctx.arc(radius, 0, handleSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    drawPlants(plantGroups) {
        const ctx = this.ctx;

        if (Array.isArray(plantGroups) && plantGroups.length > 0) {
            plantGroups.forEach(group => {
                if (group.positions && group.positions.length > 0) {
                    group.positions.forEach(pos => {
                        const x = pos.x * this.scale;
                        const y = pos.y * this.scale;
                        const radius = Math.max(3, 4 * this.scale);

                        ctx.fillStyle = group.color || '#22c55e';
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.fill();

                        // Draw outline
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    });
                }
            });
        }
    }

    drawBedLabel(bed, width, height) {
        const ctx = this.ctx;

        if (bed.name) {
            ctx.fillStyle = '#2d3748';
            ctx.font = `bold ${Math.max(12, 14 * this.scale)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(bed.name, 0, -height / 2 - 20 * this.scale);
        }

        // Draw plant count
        if (bed.plantGroups && bed.plantGroups.length > 0) {
            const totalPlants = bed.plantGroups.reduce((sum, group) =>
                sum + (group.positions ? group.positions.length : 0), 0);

            ctx.fillStyle = '#4a5568';
            ctx.font = `${Math.max(10, 12 * this.scale)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${totalPlants} plants`, 0, 0);
        }
    }

    drawPlantPreview(worldX, worldY, plant) {
        const ctx = this.ctx;
        const screenPos = this.worldToScreen(worldX, worldY);

        ctx.save();
        ctx.fillStyle = plant.color;
        ctx.globalAlpha = 0.7;
        const radius = Math.max(4, 5 * this.scale);

        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#3182ce';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1;
        ctx.stroke();

        ctx.restore();
    }

    // Check if a point (in world coordinates) is inside a bed
    isPointInBed(worldX, worldY, bed) {
        const relativeX = worldX - bed.x;
        const relativeY = worldY - bed.y;

        if (bed.type === 'rectangle') {
            return Math.abs(relativeX) <= bed.width / 2 &&
                   Math.abs(relativeY) <= bed.height / 2;
        } else if (bed.type === 'circle') {
            const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
            return distance <= bed.radius;
        }

        return false;
    }

    // Get which resize handle is clicked (returns null if none, or handle type)
    getResizeHandle(worldX, worldY, bed) {
        const relativeX = worldX - bed.x;
        const relativeY = worldY - bed.y;
        const handleTolerance = 15 / this.scale; // 15 pixels in screen space

        if (bed.type === 'rectangle') {
            const halfW = bed.width / 2;
            const halfH = bed.height / 2;

            // Check corner and edge handles
            const handles = [
                { x: -halfW, y: -halfH, type: 'nw' },
                { x: halfW, y: -halfH, type: 'ne' },
                { x: halfW, y: halfH, type: 'se' },
                { x: -halfW, y: halfH, type: 'sw' },
                { x: 0, y: -halfH, type: 'n' },
                { x: halfW, y: 0, type: 'e' },
                { x: 0, y: halfH, type: 's' },
                { x: -halfW, y: 0, type: 'w' }
            ];

            for (const handle of handles) {
                const dx = relativeX - handle.x;
                const dy = relativeY - handle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= handleTolerance) {
                    return handle.type;
                }
            }
        } else if (bed.type === 'circle') {
            // Check if clicking on the right edge handle
            const dx = relativeX - bed.radius;
            const dy = relativeY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= handleTolerance) {
                return 'radius';
            }
        }

        return null;
    }

    // Draw a preview while creating a new bed
    drawBedPreview(startWorld, endWorld, type) {
        const ctx = this.ctx;
        ctx.save();

        const start = this.worldToScreen(startWorld.x, startWorld.y);
        const end = this.worldToScreen(endWorld.x, endWorld.y);

        ctx.strokeStyle = '#3182ce';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        if (type === 'rectangle') {
            const width = end.x - start.x;
            const height = end.y - start.y;
            ctx.strokeRect(start.x, start.y, width, height);
        } else if (type === 'circle') {
            const radius = Math.sqrt(
                Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
            );
            ctx.beginPath();
            ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}
