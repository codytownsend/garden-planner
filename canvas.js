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
        // Trackpad pinch gesture for zoom only
        this.canvas.addEventListener('wheel', (e) => {
            // Only zoom on pinch gesture (ctrlKey is set for trackpad pinch on Mac)
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.95 : 1.05;
                this.zoomAt(e.offsetX, e.offsetY, delta);

                // Trigger render callback if set
                if (this.onZoom) {
                    this.onZoom();
                }
            }
            // Otherwise allow normal scrolling (no preventDefault)
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

    fitBedToScreen(bed) {
        if (!bed) return;

        // Get bed dimensions
        let width, height;
        if (bed.type === 'rectangle') {
            width = bed.width;
            height = bed.height;
        } else if (bed.type === 'circle') {
            width = bed.radius * 2;
            height = bed.radius * 2;
        }

        // Calculate scale to fit bed in viewport with generous padding for detail work
        const padding = 80;
        const scaleX = (this.canvas.width - padding * 2) / width;
        const scaleY = (this.canvas.height - padding * 2) / height;

        // Allow much higher zoom in detail mode - up to 10x
        const detailMaxScale = 10;
        this.scale = Math.min(scaleX, scaleY, detailMaxScale);

        // Center the bed at its actual position in the world
        this.offsetX = this.canvas.width / 2 - bed.x * this.scale;
        this.offsetY = this.canvas.height / 2 - bed.y * this.scale;

        console.log('fitBedToScreen:', {
            bedPos: { x: bed.x, y: bed.y },
            bedSize: { width, height },
            scale: this.scale,
            offset: { x: this.offsetX, y: this.offsetY }
        });
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

        // Apply rotation if present
        if (bed.rotation) {
            ctx.rotate((bed.rotation * Math.PI) / 180);
        }

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

        // Draw plant group regions if selected and has multiple plant groups
        if (isSelected && bed.plantGroups && bed.plantGroups.length > 1) {
            this.drawPlantRegions(bed, width, height);
        }

        // Draw plants
        if (bed.plantGroups && bed.plantGroups.length > 0) {
            this.drawPlants(bed.plantGroups);
        }

        // Draw label
        this.drawBedLabel(bed, width, height);

        // Draw resize handles if selected
        if (isSelected) {
            this.drawResizeHandles(bed, width, height);
            this.drawRotationHandle(bed, width, height);
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

        // Draw plant group regions if selected and has multiple plant groups
        if (isSelected && bed.plantGroups && bed.plantGroups.length > 1) {
            this.drawCircularPlantRegions(bed, radius);
        }

        // Draw plants
        if (bed.plantGroups && bed.plantGroups.length > 0) {
            this.drawPlants(bed.plantGroups);
        }

        // Draw label
        this.drawBedLabel(bed, radius * 2, radius * 2);

        // Draw resize handles if selected
        if (isSelected) {
            this.drawCircleResizeHandle(radius);
            this.drawRotationHandle(bed, radius * 2, radius * 2);
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

    drawRotationHandle(bed, width, height) {
        const ctx = this.ctx;
        const handleSize = 8;

        // Position rotation handle above the bed
        const handleY = bed.type === 'rectangle' ? -height / 2 - 30 : -(height / 2) - 30;

        ctx.fillStyle = '#10b981';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;

        // Draw line from bed to handle
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, bed.type === 'rectangle' ? -height / 2 : 0);
        ctx.lineTo(0, handleY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw circular rotation handle
        ctx.fillStyle = '#10b981';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, handleY, handleSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw rotation icon inside handle
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, handleY, handleSize * 0.5, 0, Math.PI * 1.5);
        ctx.stroke();
        // Draw arrow
        ctx.beginPath();
        ctx.moveTo(-handleSize * 0.3, handleY - handleSize * 0.5);
        ctx.lineTo(0, handleY - handleSize * 0.7);
        ctx.lineTo(handleSize * 0.2, handleY - handleSize * 0.5);
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
        const relX = worldX - bed.x;
        const relY = worldY - bed.y;

        // Transform point to account for rotation
        const transformed = this.transformPoint(relX, relY, bed);
        const relativeX = transformed.x;
        const relativeY = transformed.y;

        if (bed.type === 'rectangle') {
            return Math.abs(relativeX) <= bed.width / 2 &&
                   Math.abs(relativeY) <= bed.height / 2;
        } else if (bed.type === 'circle') {
            const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
            return distance <= bed.radius;
        }

        return false;
    }

    // Transform point accounting for bed rotation
    transformPoint(x, y, bed) {
        if (!bed.rotation) return { x, y };

        const angle = -(bed.rotation * Math.PI) / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        return {
            x: x * cos - y * sin,
            y: x * sin + y * cos
        };
    }

    // Get which resize handle is clicked (returns null if none, or handle type)
    getResizeHandle(worldX, worldY, bed) {
        const relX = worldX - bed.x;
        const relY = worldY - bed.y;

        // Transform point to account for rotation
        const transformed = this.transformPoint(relX, relY, bed);
        const relativeX = transformed.x;
        const relativeY = transformed.y;

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

    // Check if clicking on rotation handle
    getRotationHandle(worldX, worldY, bed) {
        const relX = worldX - bed.x;
        const relY = worldY - bed.y;

        // Transform point to account for rotation
        const transformed = this.transformPoint(relX, relY, bed);
        const relativeX = transformed.x;
        const relativeY = transformed.y;

        const handleTolerance = 15 / this.scale;
        const height = bed.type === 'rectangle' ? bed.height : bed.radius * 2;
        const handleY = -height / 2 - 30 / this.scale; // Convert screen pixels to world units

        const dx = relativeX - 0;
        const dy = relativeY - handleY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance <= handleTolerance;
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

    // Draw plant group regions for rectangular beds
    drawPlantRegions(bed, width, height) {
        if (!bed.plantGroups || bed.plantGroups.length <= 1) return;

        const ctx = this.ctx;
        const isHorizontal = bed.width > bed.height;

        // Initialize boundaries if not set
        const boundaries = bed.regionBoundaries || [];
        const numGroups = bed.plantGroups.length;

        ctx.save();

        // Draw semi-transparent regions
        bed.plantGroups.forEach((group, index) => {
            const start = index === 0 ? 0 : boundaries[index - 1];
            const end = index === numGroups - 1 ? 1 : boundaries[index];

            ctx.fillStyle = group.color + '15'; // Add transparency

            if (isHorizontal) {
                // Horizontal regions (top to bottom)
                const regionTop = -height / 2 + start * height;
                const regionHeight = (end - start) * height;
                ctx.fillRect(-width / 2, regionTop, width, regionHeight);
            } else {
                // Vertical regions (left to right)
                const regionLeft = -width / 2 + start * width;
                const regionWidth = (end - start) * width;
                ctx.fillRect(regionLeft, -height / 2, regionWidth, height);
            }
        });

        // Draw divider lines and handles
        boundaries.forEach((boundary, index) => {
            ctx.strokeStyle = '#4299e1';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);

            if (isHorizontal) {
                // Horizontal divider
                const y = -height / 2 + boundary * height;
                ctx.beginPath();
                ctx.moveTo(-width / 2, y);
                ctx.lineTo(width / 2, y);
                ctx.stroke();

                // Draw handle
                ctx.setLineDash([]);
                ctx.fillStyle = '#4299e1';
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else {
                // Vertical divider
                const x = -width / 2 + boundary * width;
                ctx.beginPath();
                ctx.moveTo(x, -height / 2);
                ctx.lineTo(x, height / 2);
                ctx.stroke();

                // Draw handle
                ctx.setLineDash([]);
                ctx.fillStyle = '#4299e1';
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        });

        ctx.restore();
    }

    // Draw plant group regions for circular beds
    drawCircularPlantRegions(bed, radius) {
        if (!bed.plantGroups || bed.plantGroups.length <= 1) return;

        const ctx = this.ctx;
        const boundaries = bed.regionBoundaries || [];
        const numGroups = bed.plantGroups.length;

        ctx.save();

        // Draw semi-transparent rings
        bed.plantGroups.forEach((group, index) => {
            const start = index === 0 ? 0 : boundaries[index - 1];
            const end = index === numGroups - 1 ? 1 : boundaries[index];

            const innerRadius = start * radius;
            const outerRadius = end * radius;

            ctx.fillStyle = group.color + '15'; // Add transparency
            ctx.beginPath();
            ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
            ctx.arc(0, 0, innerRadius, 0, Math.PI * 2, true);
            ctx.fill();
        });

        // Draw divider circles and handles
        boundaries.forEach((boundary, index) => {
            const dividerRadius = boundary * radius;

            ctx.strokeStyle = '#4299e1';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(0, 0, dividerRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Draw handle on right side of circle
            ctx.setLineDash([]);
            ctx.fillStyle = '#4299e1';
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(dividerRadius, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        ctx.restore();
    }

    // Get which plant divider is clicked (returns null or divider info)
    getPlantDivider(worldX, worldY, bed) {
        if (!bed || !bed.plantGroups || bed.plantGroups.length <= 1) return null;

        const relX = worldX - bed.x;
        const relY = worldY - bed.y;

        // Transform point to account for rotation
        const transformed = this.transformPoint(relX, relY, bed);
        const relativeX = transformed.x;
        const relativeY = transformed.y;

        const handleTolerance = 15 / this.scale;
        const boundaries = bed.regionBoundaries || [];

        if (bed.type === 'circle') {
            // Check circular dividers
            const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);

            for (let i = 0; i < boundaries.length; i++) {
                const dividerRadius = boundaries[i] * bed.radius;
                if (Math.abs(distance - dividerRadius) <= handleTolerance) {
                    return { index: i, cursor: 'ew-resize' };
                }
            }
        } else {
            // Check rectangular dividers
            const isHorizontal = bed.width > bed.height;

            for (let i = 0; i < boundaries.length; i++) {
                if (isHorizontal) {
                    // Horizontal divider
                    const dividerY = -bed.height / 2 + boundaries[i] * bed.height;
                    if (Math.abs(relativeY - dividerY) <= handleTolerance &&
                        Math.abs(relativeX) <= bed.width / 2) {
                        return { index: i, cursor: 'ns-resize' };
                    }
                } else {
                    // Vertical divider
                    const dividerX = -bed.width / 2 + boundaries[i] * bed.width;
                    if (Math.abs(relativeX - dividerX) <= handleTolerance &&
                        Math.abs(relativeY) <= bed.height / 2) {
                        return { index: i, cursor: 'ew-resize' };
                    }
                }
            }
        }

        return null;
    }
}
