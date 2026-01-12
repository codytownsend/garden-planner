// Main application logic

class GardenPlanner {
    constructor() {
        // Initialize canvas
        this.canvas = new GardenCanvas(document.getElementById('gardenCanvas'));

        // Set up canvas callbacks for zoom/resize
        this.canvas.setOnZoom(() => this.render());
        this.canvas.setOnResize(() => this.render());

        // Application state
        this.beds = [];
        this.selectedBed = null;
        this.currentTool = null; // null (default/select)
        this.editingPlantIndex = null; // Track which plant is being edited
        this.selectedColor = '#22c55e'; // Current selected color

        // View state
        this.bedDetailMode = false; // When true, show single bed in detail

        // Predefined color palette for plants
        this.colorPalette = [
            '#22c55e', // Green (default)
            '#16a34a', // Dark Green
            '#84cc16', // Lime
            '#eab308', // Yellow
            '#f59e0b', // Orange
            '#ef4444', // Red
            '#ec4899', // Pink
            '#a855f7', // Purple
            '#6366f1', // Indigo
            '#3b82f6', // Blue
            '#0891b2', // Cyan
            '#f97316', // Deep Orange
            '#dc2626', // Dark Red
            '#7c3aed', // Violet
            '#8b5cf6', // Light Purple
            '#059669', // Emerald
        ];

        // Interaction state
        this.isDraggingBed = false;
        this.isResizing = false;
        this.isRotating = false;
        this.resizeHandle = null;
        this.dragStart = null;
        this.bedDragStart = null;
        this.rotationStart = null;

        // Plant group interaction state
        this.selectedPlantGroupIndex = null;
        this.isDraggingDivider = false;
        this.draggedDividerIndex = null;

        // Double-click detection
        this.lastClickTime = 0;
        this.lastClickedBed = null;

        // Load saved data
        this.loadFromStorage();

        // Initialize UI
        this.setupEventListeners();
        this.initializeColorPicker();
        this.renderBedsList();
        this.render();
    }

    setupEventListeners() {
        const canvas = this.canvas.canvas;

        // No tool buttons needed anymore

        // Zoom buttons
        document.getElementById('zoomIn').addEventListener('click', () => {
            this.canvas.zoomIn();
            this.render();
        });

        document.getElementById('zoomOut').addEventListener('click', () => {
            this.canvas.zoomOut();
            this.render();
        });

        document.getElementById('zoomFit').addEventListener('click', () => {
            this.canvas.fitToScreen(this.beds);
            this.render();
        });

        // Canvas mouse events
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Add Bed button
        document.getElementById('addBedBtn').addEventListener('click', () => {
            this.openAddBedModal();
        });

        // Add Bed Modal
        document.getElementById('closeAddBed').addEventListener('click', () => {
            this.closeAddBedModal();
        });

        document.getElementById('cancelAddBed').addEventListener('click', () => {
            this.closeAddBedModal();
        });

        document.getElementById('saveNewBed').addEventListener('click', () => {
            this.saveNewBed();
        });

        document.getElementById('newBedType').addEventListener('change', (e) => {
            this.updateBedTypeUI(e.target.value);
        });

        // Bed property inputs
        document.getElementById('bedName').addEventListener('input', (e) => {
            if (this.selectedBed) {
                this.selectedBed.name = e.target.value;
                this.renderBedsList();
                this.saveToStorage();

                // Update detail view banner if in detail mode
                if (this.bedDetailMode) {
                    const bedName = this.selectedBed.name || 'Unnamed Bed';
                    document.getElementById('detailViewBedName').textContent = `Detail View: ${bedName}`;
                }

                this.render();
            }
        });

        document.getElementById('bedWidth').addEventListener('input', (e) => {
            if (this.selectedBed && this.selectedBed.type === 'rectangle') {
                this.selectedBed.width = Math.max(12, parseInt(e.target.value) || 12);
                this.recalculateAllPlantPositions();
                this.updateBedPlantsList();
                this.renderBedsList();
                this.saveToStorage();
                this.render();
            }
        });

        document.getElementById('bedHeight').addEventListener('input', (e) => {
            if (this.selectedBed && this.selectedBed.type === 'rectangle') {
                this.selectedBed.height = Math.max(12, parseInt(e.target.value) || 12);
                this.recalculateAllPlantPositions();
                this.updateBedPlantsList();
                this.renderBedsList();
                this.saveToStorage();
                this.render();
            }
        });

        document.getElementById('bedRadius').addEventListener('input', (e) => {
            if (this.selectedBed && this.selectedBed.type === 'circle') {
                this.selectedBed.radius = Math.max(6, parseInt(e.target.value) || 6);
                this.recalculateAllPlantPositions();
                this.updateBedPlantsList();
                this.renderBedsList();
                this.saveToStorage();
                this.render();
            }
        });

        document.getElementById('bedRotation').addEventListener('input', (e) => {
            if (this.selectedBed) {
                this.selectedBed.rotation = parseInt(e.target.value) || 0;
                this.saveToStorage();
                this.render();
            }
        });

        document.getElementById('deleteBed').addEventListener('click', () => {
            if (this.selectedBed && confirm('Delete this bed?')) {
                this.beds = this.beds.filter(b => b.id !== this.selectedBed.id);
                this.selectedBed = null;
                this.bedDetailMode = false;
                this.renderBedsList();
                this.updateSidebar();
                this.saveToStorage();
                this.render();
            }
        });

        // Detail view toggle
        document.getElementById('exitDetailView').addEventListener('click', () => {
            this.exitBedDetailView();
        });

        document.getElementById('editPlantsBtn').addEventListener('click', () => {
            if (this.selectedBed) {
                this.enterBedDetailView();
            }
        });

        // Add Plant to Bed button
        document.getElementById('addPlantToBedBtn').addEventListener('click', () => {
            if (this.selectedBed) {
                this.openAddPlantToBedModal();
            }
        });

        // Add Plant to Bed Modal
        document.getElementById('closeAddPlantToBed').addEventListener('click', () => {
            this.closeAddPlantToBedModal();
        });

        document.getElementById('cancelAddPlantToBed').addEventListener('click', () => {
            this.closeAddPlantToBedModal();
        });

        document.getElementById('saveAddPlantToBed').addEventListener('click', () => {
            this.saveAddPlantToBed();
        });

        document.getElementById('plantSpacing').addEventListener('input', () => {
            this.updateFillPreview();
        });

        document.getElementById('plantName').addEventListener('input', () => {
            this.updateFillPreview();
        });

        // Color picker
        document.getElementById('plantColor').addEventListener('input', (e) => {
            this.selectedColor = e.target.value;
            this.updateColorSwatchSelection();
        });

        // Toolbar buttons
        document.getElementById('reportBtn').addEventListener('click', () => {
            this.openReportModal();
        });

        document.getElementById('printBtn').addEventListener('click', () => {
            this.print();
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all beds? This cannot be undone.')) {
                this.beds = [];
                this.selectedBed = null;
                this.renderBedsList();
                this.updateSidebar();
                this.saveToStorage();
                this.render();
            }
        });

        // Report modal
        document.getElementById('closeReport').addEventListener('click', () => {
            this.closeReportModal();
        });

        document.getElementById('closeReportBtn').addEventListener('click', () => {
            this.closeReportModal();
        });

        document.getElementById('printReport').addEventListener('click', () => {
            window.print();
        });

        // Close modals when clicking outside
        document.getElementById('addBedModal').addEventListener('click', (e) => {
            if (e.target.id === 'addBedModal') {
                this.closeAddBedModal();
            }
        });

        document.getElementById('addPlantToBedModal').addEventListener('click', (e) => {
            if (e.target.id === 'addPlantToBedModal') {
                this.closeAddPlantToBedModal();
            }
        });

        document.getElementById('reportModal').addEventListener('click', (e) => {
            if (e.target.id === 'reportModal') {
                this.closeReportModal();
            }
        });
    }

    initializeColorPicker() {
        const container = document.getElementById('colorSwatches');

        this.colorPalette.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.dataset.color = color;

            swatch.addEventListener('click', () => {
                this.selectedColor = color;
                document.getElementById('plantColor').value = color;
                this.updateColorSwatchSelection();
            });

            container.appendChild(swatch);
        });

        // Set initial selection
        this.updateColorSwatchSelection();
    }

    updateColorSwatchSelection() {
        const swatches = document.querySelectorAll('.color-swatch');
        swatches.forEach(swatch => {
            if (swatch.dataset.color === this.selectedColor) {
                swatch.classList.add('selected');
            } else {
                swatch.classList.remove('selected');
            }
        });
    }

    setTool(tool) {
        this.currentTool = tool;
        // Update button states as needed
    }

    handleMouseDown(e) {
        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);

        // Check if clicking on rotation handle of selected bed first (it's outside bed bounds)
        if (this.selectedBed) {
            const isRotationHandle = this.canvas.getRotationHandle(worldPos.x, worldPos.y, this.selectedBed);

            if (isRotationHandle) {
                // Start rotating
                this.isRotating = true;
                this.rotationStart = {
                    angle: Math.atan2(worldPos.y - this.selectedBed.y, worldPos.x - this.selectedBed.x),
                    initialRotation: this.selectedBed.rotation || 0
                };
                this.canvas.canvas.style.cursor = 'grabbing';
                return;
            }

            // Check if clicking on a plant group divider
            const dividerInfo = this.canvas.getPlantDivider(worldPos.x, worldPos.y, this.selectedBed);
            if (dividerInfo) {
                this.isDraggingDivider = true;
                this.draggedDividerIndex = dividerInfo.index;
                this.dragStart = worldPos;
                this.canvas.canvas.style.cursor = dividerInfo.cursor;
                return;
            }
        }

        // In detail mode, we're always working on the selected bed
        if (this.bedDetailMode) {
            // Check if clicking on a resize handle
            const handle = this.canvas.getResizeHandle(worldPos.x, worldPos.y, this.selectedBed);

            if (handle) {
                // Start resizing
                this.isResizing = true;
                this.resizeHandle = handle;
                this.dragStart = worldPos;
                this.bedDragStart = { ...this.selectedBed };
            } else if (this.canvas.isPointInBed(worldPos.x, worldPos.y, this.selectedBed)) {
                // Start dragging bed (though in detail mode, this just pans)
                this.canvas.isPanning = true;
                this.canvas.lastMouseX = e.offsetX;
                this.canvas.lastMouseY = e.offsetY;
                this.canvas.canvas.classList.add('grabbing');
            } else {
                // Pan the view
                this.canvas.isPanning = true;
                this.canvas.lastMouseX = e.offsetX;
                this.canvas.lastMouseY = e.offsetY;
                this.canvas.canvas.classList.add('grabbing');
            }
        } else {
            // Overview mode - check if clicking on a bed
            const clickedBed = this.beds.find(bed =>
                this.canvas.isPointInBed(worldPos.x, worldPos.y, bed)
            );

            if (clickedBed) {
                // Check if clicking on a resize handle
                const handle = this.canvas.getResizeHandle(worldPos.x, worldPos.y, clickedBed);

                if (handle) {
                    // Start resizing
                    this.isResizing = true;
                    this.resizeHandle = handle;
                    this.selectedBed = clickedBed;
                    this.dragStart = worldPos;
                    this.bedDragStart = { ...clickedBed };
                    this.renderBedsList();
                    this.updateSidebar();
                } else {
                    // Detect double-click
                    const currentTime = Date.now();
                    const isDoubleClick =
                        this.lastClickedBed === clickedBed &&
                        (currentTime - this.lastClickTime) < 300; // 300ms threshold

                    this.lastClickTime = currentTime;
                    this.lastClickedBed = clickedBed;

                    if (isDoubleClick) {
                        // Double-click: Enter detail view
                        this.selectedBed = clickedBed;
                        this.renderBedsList();
                        this.enterBedDetailView();
                    } else {
                        // Single click: Select bed (can drag/move)
                        this.isDraggingBed = true;
                        this.selectedBed = clickedBed;
                        this.dragStart = worldPos;
                        this.bedDragStart = { x: clickedBed.x, y: clickedBed.y };
                        this.renderBedsList();
                        this.updateSidebar();
                        this.canvas.canvas.style.cursor = 'grabbing';
                    }
                }
            } else {
                // Deselect bed and start panning
                if (this.selectedBed) {
                    this.selectedBed = null;
                    this.renderBedsList();
                    this.updateSidebar();
                    this.render();
                }

                this.canvas.isPanning = true;
                this.canvas.lastMouseX = e.offsetX;
                this.canvas.lastMouseY = e.offsetY;
                this.canvas.canvas.classList.add('grabbing');
            }
        }
    }

    handleMouseMove(e) {
        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);

        if (this.isDraggingDivider && this.selectedBed && this.dragStart !== null) {
            // Handle plant group divider dragging
            this.handleDividerDrag(worldPos);
            this.render();
        } else if (this.isRotating && this.selectedBed && this.rotationStart) {
            // Rotate the bed
            const currentAngle = Math.atan2(
                worldPos.y - this.selectedBed.y,
                worldPos.x - this.selectedBed.x
            );
            const angleDiff = currentAngle - this.rotationStart.angle;
            let newRotation = this.rotationStart.initialRotation + (angleDiff * 180 / Math.PI);

            // Normalize to 0-359
            newRotation = ((newRotation % 360) + 360) % 360;

            this.selectedBed.rotation = Math.round(newRotation);
            this.updateSidebar();
            this.render();
        } else if (this.isDraggingBed && this.selectedBed && this.dragStart && !this.bedDetailMode) {
            // Move the bed (only in overview mode)
            const dx = worldPos.x - this.dragStart.x;
            const dy = worldPos.y - this.dragStart.y;

            this.selectedBed.x = this.bedDragStart.x + dx;
            this.selectedBed.y = this.bedDragStart.y + dy;

            this.render();
        } else if (this.isResizing && this.selectedBed && this.dragStart) {
            // Resize the bed
            const dx = worldPos.x - this.dragStart.x;
            const dy = worldPos.y - this.dragStart.y;

            if (this.selectedBed.type === 'rectangle') {
                this.resizeRectangle(dx, dy);
            } else if (this.selectedBed.type === 'circle') {
                this.resizeCircle(dx, dy);
            }

            this.updateSidebar();
            this.render();
        } else if (this.canvas.isPanning) {
            // Pan the canvas
            const dx = e.offsetX - this.canvas.lastMouseX;
            const dy = e.offsetY - this.canvas.lastMouseY;

            this.canvas.offsetX += dx;
            this.canvas.offsetY += dy;

            this.canvas.lastMouseX = e.offsetX;
            this.canvas.lastMouseY = e.offsetY;

            this.render();
        } else {
            // Update cursor based on what's under mouse

            // Check rotation handle first (it's outside bed bounds)
            if (this.selectedBed) {
                const isRotationHandle = this.canvas.getRotationHandle(worldPos.x, worldPos.y, this.selectedBed);
                if (isRotationHandle) {
                    this.canvas.canvas.style.cursor = 'grab';
                    return;
                }

                // Check if hovering over a plant group divider
                const dividerInfo = this.canvas.getPlantDivider(worldPos.x, worldPos.y, this.selectedBed);
                if (dividerInfo) {
                    this.canvas.canvas.style.cursor = dividerInfo.cursor;
                    return;
                }
            }

            const bed = this.beds.find(b =>
                this.canvas.isPointInBed(worldPos.x, worldPos.y, b)
            );

            if (bed && bed === this.selectedBed) {
                const handle = this.canvas.getResizeHandle(worldPos.x, worldPos.y, bed);
                if (handle) {
                    this.canvas.canvas.style.cursor = this.getResizeCursor(handle);
                } else {
                    this.canvas.canvas.style.cursor = 'move';
                }
            } else if (bed) {
                this.canvas.canvas.style.cursor = 'pointer';
            } else {
                this.canvas.canvas.style.cursor = 'default';
            }
        }
    }

    handleMouseUp(e) {
        if (this.isDraggingBed || this.isResizing || this.isRotating || this.isDraggingDivider) {
            this.saveToStorage();
        }

        this.isDraggingBed = false;
        this.isResizing = false;
        this.isRotating = false;
        this.isDraggingDivider = false;
        this.resizeHandle = null;
        this.dragStart = null;
        this.bedDragStart = null;
        this.rotationStart = null;
        this.draggedDividerIndex = null;

        if (this.canvas.isPanning) {
            this.canvas.isPanning = false;
            this.canvas.canvas.classList.remove('grabbing');
        }

        this.canvas.canvas.style.cursor = 'default';
    }

    getResizeCursor(handle) {
        const cursors = {
            'nw': 'nw-resize',
            'ne': 'ne-resize',
            'se': 'se-resize',
            'sw': 'sw-resize',
            'n': 'n-resize',
            'e': 'e-resize',
            's': 's-resize',
            'w': 'w-resize',
            'radius': 'e-resize'
        };
        return cursors[handle] || 'default';
    }

    resizeRectangle(dx, dy) {
        const minSize = 12;

        switch (this.resizeHandle) {
            case 'se':
                this.selectedBed.width = Math.max(minSize, this.bedDragStart.width + dx * 2);
                this.selectedBed.height = Math.max(minSize, this.bedDragStart.height + dy * 2);
                break;
            case 'sw':
                this.selectedBed.width = Math.max(minSize, this.bedDragStart.width - dx * 2);
                this.selectedBed.height = Math.max(minSize, this.bedDragStart.height + dy * 2);
                break;
            case 'ne':
                this.selectedBed.width = Math.max(minSize, this.bedDragStart.width + dx * 2);
                this.selectedBed.height = Math.max(minSize, this.bedDragStart.height - dy * 2);
                break;
            case 'nw':
                this.selectedBed.width = Math.max(minSize, this.bedDragStart.width - dx * 2);
                this.selectedBed.height = Math.max(minSize, this.bedDragStart.height - dy * 2);
                break;
            case 'e':
                this.selectedBed.width = Math.max(minSize, this.bedDragStart.width + dx * 2);
                break;
            case 'w':
                this.selectedBed.width = Math.max(minSize, this.bedDragStart.width - dx * 2);
                break;
            case 's':
                this.selectedBed.height = Math.max(minSize, this.bedDragStart.height + dy * 2);
                break;
            case 'n':
                this.selectedBed.height = Math.max(minSize, this.bedDragStart.height - dy * 2);
                break;
        }
    }

    resizeCircle(dx, dy) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        const direction = dx > 0 ? 1 : -1;
        this.selectedBed.radius = Math.max(6, this.bedDragStart.radius + distance * direction);
    }

    renderBedsList() {
        const container = document.getElementById('bedsList');

        if (this.beds.length === 0) {
            container.innerHTML = '<div style="color: #718096; font-size: 13px;">No beds yet. Click "Add Bed" to create one.</div>';
            return;
        }

        container.innerHTML = this.beds.map(bed => {
            const isSelected = this.selectedBed && this.selectedBed.id === bed.id;
            const icon = bed.type === 'rectangle' ?
                '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="6" width="16" height="12"/></svg>' :
                '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg>';

            const plantCount = bed.plantGroups ? bed.plantGroups.reduce((sum, g) => sum + g.positions.length, 0) : 0;
            const details = bed.type === 'rectangle' ?
                `${Math.round(bed.width)}" × ${Math.round(bed.height)}" • ${plantCount} plants` :
                `r=${Math.round(bed.radius)}" • ${plantCount} plants`;

            return `
                <div class="bed-list-item ${isSelected ? 'selected' : ''}" onclick="app.selectBedFromList('${bed.id}')">
                    <div class="bed-list-item-icon">${icon}</div>
                    <div class="bed-list-item-info">
                        <div class="bed-list-item-name">${bed.name || 'Unnamed Bed'}</div>
                        <div class="bed-list-item-details">${details}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    selectBedFromList(bedId) {
        const bed = this.beds.find(b => b.id.toString() === bedId);
        if (bed) {
            this.selectedBed = bed;
            this.renderBedsList();
            this.updateSidebar();
            this.render();
        }
    }

    updateSidebar() {
        const selectedBedPanel = document.getElementById('selectedBedPanel');
        const radiusGroup = document.getElementById('radiusGroup');
        const widthGroup = document.getElementById('widthGroup');
        const heightGroup = document.getElementById('heightGroup');
        const overviewControls = document.getElementById('overviewControls');
        const detailControls = document.getElementById('detailControls');
        const bedSelectedHint = document.getElementById('bedSelectedHint');

        if (this.selectedBed) {
            selectedBedPanel.style.display = 'block';

            document.getElementById('bedName').value = this.selectedBed.name || '';
            document.getElementById('bedType').value = this.selectedBed.type;
            document.getElementById('bedRotation').value = this.selectedBed.rotation || 0;

            if (this.selectedBed.type === 'rectangle') {
                document.getElementById('bedWidth').value = Math.round(this.selectedBed.width);
                document.getElementById('bedHeight').value = Math.round(this.selectedBed.height);
                widthGroup.style.display = 'block';
                heightGroup.style.display = 'block';
                radiusGroup.style.display = 'none';
            } else if (this.selectedBed.type === 'circle') {
                document.getElementById('bedRadius').value = Math.round(this.selectedBed.radius);
                widthGroup.style.display = 'none';
                heightGroup.style.display = 'none';
                radiusGroup.style.display = 'block';
            }

            // Show appropriate controls based on mode
            if (this.bedDetailMode) {
                overviewControls.style.display = 'none';
                detailControls.style.display = 'block';
                bedSelectedHint.style.display = 'none';
                this.updateBedPlantsList();
            } else {
                overviewControls.style.display = 'block';
                detailControls.style.display = 'none';
                bedSelectedHint.style.display = 'block';
            }
        } else {
            selectedBedPanel.style.display = 'none';
            bedSelectedHint.style.display = 'none';
        }
    }

    updateBedPlantsList() {
        if (!this.selectedBed) return;

        const container = document.getElementById('bedPlantsList');

        if (!this.selectedBed.plantGroups || this.selectedBed.plantGroups.length === 0) {
            container.innerHTML = '<div style="color: #718096; font-size: 13px; margin-bottom: 8px;">No plants in this bed yet.</div>';
            return;
        }

        // Add help text for multiple plant groups
        const helpText = this.selectedBed.plantGroups.length > 1 ?
            '<div style="color: #4299e1; font-size: 12px; margin-bottom: 12px; padding: 8px; background: #ebf8ff; border-radius: 4px;">💡 Drag the divider lines on the canvas to resize plant regions</div>' : '';

        container.innerHTML = helpText + this.selectedBed.plantGroups.map((group, index) => {
            const layerLabel = index === 0 ? 'Top/Left' : index === this.selectedBed.plantGroups.length - 1 ? 'Bottom/Right' : `Layer ${index + 1}`;
            const maxQty = group.maxQuantity || 0;
            const currentQty = group.quantity || 0;
            const atMax = currentQty >= maxQty;

            return `
                <div class="bed-plant-item" draggable="true" data-index="${index}">
                    <div class="drag-handle" title="Drag to reorder">
                        <svg width="12" height="16" viewBox="0 0 12 16">
                            <circle cx="3" cy="4" r="1.5" fill="currentColor"/>
                            <circle cx="9" cy="4" r="1.5" fill="currentColor"/>
                            <circle cx="3" cy="8" r="1.5" fill="currentColor"/>
                            <circle cx="9" cy="8" r="1.5" fill="currentColor"/>
                            <circle cx="3" cy="12" r="1.5" fill="currentColor"/>
                            <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
                        </svg>
                    </div>
                    <div class="bed-plant-info-full">
                        <div class="bed-plant-header">
                            <div class="bed-plant-name">
                                <span class="plant-color-dot" style="background-color: ${group.color}"></span>
                                ${group.name}
                                <span class="layer-label">${layerLabel}</span>
                            </div>
                            <div class="plant-item-actions">
                                <button class="icon-btn" onclick="app.editPlantGroup(${index})" title="Edit">
                                    <svg width="16" height="16" viewBox="0 0 16 16">
                                        <path d="M11 2L14 5L5 14H2V11L11 2Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
                                    </svg>
                                </button>
                                <button class="icon-btn danger" onclick="app.removePlantGroup(${index})" title="Remove">
                                    <svg width="16" height="16" viewBox="0 0 16 16">
                                        <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="bed-plant-count">${currentQty} of ${maxQty} plants • ${group.spacing}" spacing</div>
                        <div class="quantity-control">
                            <input type="range"
                                   class="quantity-slider"
                                   min="0"
                                   max="${maxQty}"
                                   value="${currentQty}"
                                   data-index="${index}"
                                   onchange="app.updatePlantQuantity(${index}, this.value)">
                            <div class="quantity-labels">
                                <span>0</span>
                                <span class="${atMax ? 'at-max' : ''}">${maxQty} max</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Setup drag and drop for reordering
        this.setupPlantGroupDragDrop();
    }

    editPlantGroup(index) {
        if (!this.selectedBed || !this.selectedBed.plantGroups[index]) return;

        this.editingPlantIndex = index;
        const group = this.selectedBed.plantGroups[index];

        // Pre-fill form with existing data
        document.getElementById('plantName').value = group.name;
        document.getElementById('plantSpacing').value = group.spacing;

        // Set color
        this.selectedColor = group.color;
        document.getElementById('plantColor').value = group.color;
        this.updateColorSwatchSelection();

        this.updateFillPreview();

        // Change modal title and button text
        document.querySelector('#addPlantToBedModal .modal-header h3').textContent = 'Edit Plant';
        document.getElementById('saveAddPlantToBed').textContent = 'Update Plant';

        document.getElementById('addPlantToBedModal').classList.add('active');
    }

    removePlantGroup(index) {
        if (!this.selectedBed) return;

        this.selectedBed.plantGroups.splice(index, 1);

        // Reset region boundaries when plant count changes
        this.selectedBed.regionBoundaries = null;

        this.recalculateAllPlantPositions();
        this.updateBedPlantsList();
        this.renderBedsList();
        this.saveToStorage();
        this.render();
    }

    setupPlantGroupDragDrop() {
        const container = document.getElementById('bedPlantsList');
        let draggedElement = null;
        let draggedIndex = null;

        const items = document.querySelectorAll('.bed-plant-item[draggable="true"]');

        items.forEach((item) => {
            item.addEventListener('dragstart', (e) => {
                draggedElement = item;
                draggedIndex = parseInt(item.dataset.index);
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', item.innerHTML);
            });

            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');

                // Calculate new index based on DOM position
                const allItems = [...container.querySelectorAll('.bed-plant-item')];
                const newIndex = allItems.indexOf(draggedElement);

                if (draggedIndex !== null && draggedIndex !== newIndex) {
                    this.reorderPlantGroup(draggedIndex, newIndex);
                }

                draggedElement = null;
                draggedIndex = null;
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                const afterElement = this.getDragAfterElement(container, e.clientY);
                const dragging = document.querySelector('.dragging');

                if (dragging) {
                    if (afterElement == null) {
                        container.appendChild(dragging);
                    } else {
                        container.insertBefore(dragging, afterElement);
                    }
                }
            });
        });

        // Also add dragover to container
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.bed-plant-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    reorderPlantGroup(fromIndex, toIndex) {
        if (!this.selectedBed || !this.selectedBed.plantGroups) return;

        const groups = this.selectedBed.plantGroups;
        const [movedGroup] = groups.splice(fromIndex, 1);
        groups.splice(toIndex, 0, movedGroup);

        // Keep existing boundaries when reordering - just swap the regions
        // No need to reset boundaries here

        // Recalculate all plant positions based on new layer order
        this.recalculateAllPlantPositions();

        this.updateBedPlantsList();
        this.renderBedsList();
        this.saveToStorage();
        this.render();
    }

    updatePlantQuantity(index, newQuantity) {
        if (!this.selectedBed || !this.selectedBed.plantGroups[index]) return;

        const group = this.selectedBed.plantGroups[index];
        group.quantity = parseInt(newQuantity);

        // Recalculate positions with current region boundaries
        this.recalculateAllPlantPositions();
        this.updateBedPlantsList();
        this.renderBedsList();
        this.saveToStorage();
        this.render();
    }

    handleDividerDrag(worldPos) {
        if (!this.selectedBed || !this.selectedBed.plantGroups || this.draggedDividerIndex === null) return;

        const isCircle = this.selectedBed.type === 'circle';
        const width = this.selectedBed.width || 0;
        const height = this.selectedBed.height || 0;
        const radius = this.selectedBed.radius || 0;
        const isHorizontal = width > height;

        // Calculate drag delta
        const dx = worldPos.x - this.dragStart.x;
        const dy = worldPos.y - this.dragStart.y;

        // Initialize region boundaries if not set
        if (!this.selectedBed.regionBoundaries) {
            this.initializeRegionBoundaries();
        }

        // Update region boundary based on drag
        const boundaries = this.selectedBed.regionBoundaries;
        const dividerIndex = this.draggedDividerIndex;

        if (isCircle) {
            // For circular beds, adjust radial boundaries
            const totalRadius = radius;
            const delta = Math.sqrt(dx * dx + dy * dy) * (dx + dy > 0 ? 1 : -1);
            const percentageDelta = delta / totalRadius;

            // Adjust the boundary
            boundaries[dividerIndex] = Math.max(0.1, Math.min(0.9, boundaries[dividerIndex] + percentageDelta));
        } else if (isHorizontal) {
            // For horizontal beds, adjust horizontal boundaries (top to bottom)
            const totalHeight = height;
            const delta = dy;
            const percentageDelta = delta / totalHeight;

            boundaries[dividerIndex] = Math.max(0.1, Math.min(0.9, boundaries[dividerIndex] + percentageDelta));
        } else {
            // For vertical beds, adjust vertical boundaries (left to right)
            const totalWidth = width;
            const delta = dx;
            const percentageDelta = delta / totalWidth;

            boundaries[dividerIndex] = Math.max(0.1, Math.min(0.9, boundaries[dividerIndex] + percentageDelta));
        }

        // Normalize boundaries to ensure they're in order
        boundaries.sort((a, b) => a - b);

        // Update drag start for next frame
        this.dragStart = worldPos;

        // Recalculate plant positions with new boundaries
        this.recalculateAllPlantPositions();
        this.updateBedPlantsList();
    }

    initializeRegionBoundaries() {
        if (!this.selectedBed || !this.selectedBed.plantGroups) return;

        const numGroups = this.selectedBed.plantGroups.length;
        if (numGroups <= 1) {
            this.selectedBed.regionBoundaries = [];
            return;
        }

        // Create evenly spaced boundaries
        const boundaries = [];
        for (let i = 1; i < numGroups; i++) {
            boundaries.push(i / numGroups);
        }

        this.selectedBed.regionBoundaries = boundaries;
    }

    recalculateAllPlantPositions() {
        if (!this.selectedBed || !this.selectedBed.plantGroups) return { success: true };

        const isCircle = this.selectedBed.type === 'circle';
        const width = this.selectedBed.width || 0;
        const height = this.selectedBed.height || 0;
        const radius = this.selectedBed.radius || 0;
        const isHorizontal = width > height;

        // Initialize region boundaries if needed (equal division)
        if (!this.selectedBed.regionBoundaries ||
            this.selectedBed.regionBoundaries.length !== this.selectedBed.plantGroups.length - 1) {
            this.initializeRegionBoundaries();
        }

        let hasNewPlants = false;

        // Recalculate positions for each plant group in its own region
        // No inter-layer spacing - each plant owns its region completely
        this.selectedBed.plantGroups.forEach((group, layerIndex) => {
            // Get region bounds for this layer
            const regionBounds = this.getRegionBounds(layerIndex);

            // Calculate maximum possible plants for this layer within its region
            // Pass empty previousLayers so plants don't avoid each other
            const maxPositions = PlantPlacer.placeInRegion(
                width,
                height,
                group.spacing,
                isCircle,
                radius,
                isHorizontal,
                regionBounds
            );

            // Update max quantity
            group.maxQuantity = maxPositions.length;

            // If quantity not set yet (new plant), set to max
            if (group.quantity === undefined || group.quantity === 0) {
                group.quantity = group.maxQuantity;
                hasNewPlants = true;
            }

            // Limit to user's desired quantity
            const desiredQuantity = Math.min(group.quantity, group.maxQuantity);
            group.positions = maxPositions.slice(0, desiredQuantity);
        });

        return { success: true };
    }

    getRegionBounds(layerIndex) {
        if (!this.selectedBed || !this.selectedBed.plantGroups) return { start: 0, end: 1 };

        const boundaries = this.selectedBed.regionBoundaries || [];
        const numGroups = this.selectedBed.plantGroups.length;

        if (numGroups === 1) {
            return { start: 0, end: 1 };
        }

        const start = layerIndex === 0 ? 0 : boundaries[layerIndex - 1];
        const end = layerIndex === numGroups - 1 ? 1 : boundaries[layerIndex];

        return { start, end };
    }

    // Modal management
    openAddBedModal() {
        document.getElementById('newBedName').value = `Bed ${this.beds.length + 1}`;
        document.getElementById('newBedType').value = 'rectangle';
        document.getElementById('newBedWidth').value = 48;
        document.getElementById('newBedHeight').value = 96;
        document.getElementById('newBedRadius').value = 24;
        this.updateBedTypeUI('rectangle');
        document.getElementById('addBedModal').classList.add('active');
    }

    closeAddBedModal() {
        document.getElementById('addBedModal').classList.remove('active');
    }

    updateBedTypeUI(type) {
        const widthGroup = document.getElementById('newBedWidthGroup');
        const heightGroup = document.getElementById('newBedHeightGroup');
        const radiusGroup = document.getElementById('newBedRadiusGroup');

        if (type === 'rectangle') {
            widthGroup.style.display = 'block';
            heightGroup.style.display = 'block';
            radiusGroup.style.display = 'none';
        } else {
            widthGroup.style.display = 'none';
            heightGroup.style.display = 'none';
            radiusGroup.style.display = 'block';
        }
    }

    saveNewBed() {
        const name = document.getElementById('newBedName').value.trim();
        const type = document.getElementById('newBedType').value;

        let bed;

        if (type === 'rectangle') {
            const width = Math.max(12, parseInt(document.getElementById('newBedWidth').value) || 48);
            const height = Math.max(12, parseInt(document.getElementById('newBedHeight').value) || 96);

            bed = {
                id: Date.now(),
                type: 'rectangle',
                x: 0,
                y: 0,
                width: width,
                height: height,
                name: name || `Bed ${this.beds.length + 1}`,
                plantGroups: []
            };
        } else {
            const radius = Math.max(6, parseInt(document.getElementById('newBedRadius').value) || 24);

            bed = {
                id: Date.now(),
                type: 'circle',
                x: 0,
                y: 0,
                radius: radius,
                name: name || `Bed ${this.beds.length + 1}`,
                plantGroups: []
            };
        }

        this.beds.push(bed);
        this.selectedBed = bed;
        this.renderBedsList();
        this.updateSidebar();
        this.saveToStorage();
        this.render();
        this.closeAddBedModal();

        // Fit to screen to show the new bed
        this.canvas.fitToScreen(this.beds);
    }

    openAddPlantToBedModal() {
        if (!this.selectedBed) return;

        // Reset editing state
        this.editingPlantIndex = null;

        document.getElementById('plantName').value = '';
        document.getElementById('plantSpacing').value = '';

        // Set default color
        this.selectedColor = '#22c55e';
        document.getElementById('plantColor').value = this.selectedColor;
        this.updateColorSwatchSelection();

        document.getElementById('fillPreview').innerHTML = '<div style="color: #718096;">Enter plant details to see preview</div>';

        // Reset modal title and button text
        document.querySelector('#addPlantToBedModal .modal-header h3').textContent = 'Add Plant to Bed';
        document.getElementById('saveAddPlantToBed').textContent = 'Add Plant';

        document.getElementById('addPlantToBedModal').classList.add('active');
    }

    closeAddPlantToBedModal() {
        this.editingPlantIndex = null;
        document.getElementById('addPlantToBedModal').classList.remove('active');
    }

    updateFillMethodUI(method) {
        const valueGroup = document.getElementById('fillValueGroup');
        const valueLabel = document.getElementById('fillValueLabel');
        const valueInput = document.getElementById('fillValue');

        if (method === 'auto') {
            valueGroup.style.display = 'none';
        } else {
            valueGroup.style.display = 'block';
            if (method === 'count') {
                valueLabel.textContent = 'Number of Plants';
                valueInput.value = 10;
            } else if (method === 'rows') {
                valueLabel.textContent = 'Number of Rows';
                valueInput.value = 3;
            } else if (method === 'percentage') {
                valueLabel.textContent = 'Percentage (%)';
                valueInput.value = 50;
            }
        }

        this.updateFillPreview();
    }

    updateFillPreview() {
        if (!this.selectedBed) return;

        const name = document.getElementById('plantName').value.trim();
        const spacing = parseInt(document.getElementById('plantSpacing').value);

        if (!name || !spacing || spacing < 1) {
            document.getElementById('fillPreview').innerHTML = '<div style="color: #718096;">Enter plant name and spacing to see preview</div>';
            return;
        }

        const isCircle = this.selectedBed.type === 'circle';
        const width = this.selectedBed.width || 0;
        const height = this.selectedBed.height || 0;
        const radius = this.selectedBed.radius || 0;
        const isHorizontal = width > height;

        // Determine layer info
        const currentLayerCount = this.selectedBed.plantGroups ? this.selectedBed.plantGroups.length : 0;
        const layerIndex = this.editingPlantIndex !== null ? this.editingPlantIndex : currentLayerCount;
        const totalLayers = this.editingPlantIndex !== null ? currentLayerCount : currentLayerCount + 1;

        // Calculate region bounds (equal division for preview)
        const regionBounds = {
            start: layerIndex / totalLayers,
            end: (layerIndex + 1) / totalLayers
        };

        // Calculate preview positions using simple region placement
        const positions = PlantPlacer.placeInRegion(
            width,
            height,
            spacing,
            isCircle,
            radius,
            isHorizontal,
            regionBounds
        );

        const regionPercent = Math.round((regionBounds.end - regionBounds.start) * 100);
        const layerPosition = layerIndex === 0 ? 'first (top/left)' :
                             layerIndex === totalLayers - 1 ? 'last (bottom/right)' :
                             `${layerIndex + 1} of ${totalLayers}`;

        const orientation = isCircle ? 'circular' : isHorizontal ? 'horizontal' : 'vertical';
        const fillDirection = isCircle ? 'concentric rings' : isHorizontal ? 'top-to-bottom rows' : 'left-to-right columns';

        const preview = document.getElementById('fillPreview');
        preview.innerHTML = `
            <strong>Preview:</strong><br>
            This will place <strong>${positions ? positions.length : 0}</strong> ${name} plants<br>
            Region: ${regionPercent}% of bed (${layerPosition})<br>
            Orientation: ${orientation} (fills ${fillDirection})<br>
            Spacing: ${spacing} inches<br>
            <em style="color: #4299e1; font-size: 12px;">💡 Drag dividers on canvas to adjust region sizes</em>
        `;
    }

    saveAddPlantToBed() {
        if (!this.selectedBed) return;

        const name = document.getElementById('plantName').value.trim();
        const spacing = parseInt(document.getElementById('plantSpacing').value);
        const color = this.selectedColor;

        if (!name || !spacing || spacing < 1) {
            alert('Please provide a valid plant name and spacing.');
            return;
        }

        if (!this.selectedBed.plantGroups) {
            this.selectedBed.plantGroups = [];
        }

        if (this.editingPlantIndex !== null) {
            // Update existing plant group properties (keep quantity)
            this.selectedBed.plantGroups[this.editingPlantIndex].name = name;
            this.selectedBed.plantGroups[this.editingPlantIndex].spacing = spacing;
            this.selectedBed.plantGroups[this.editingPlantIndex].color = color;
        } else {
            // Add new plant group with auto-fill
            this.selectedBed.plantGroups.push({
                name: name,
                spacing: spacing,
                color: color,
                maxQuantity: 0,  // Will be calculated
                quantity: 0,     // Will be set to max initially
                positions: []
            });
        }

        // Recalculate all positions - regions are divided equally
        this.recalculateAllPlantPositions();

        this.updateBedPlantsList();
        this.renderBedsList();
        this.saveToStorage();
        this.closeAddPlantToBedModal();

        // Automatically enter detail view after adding/editing a plant
        if (!this.bedDetailMode) {
            this.enterBedDetailView();
        } else {
            this.render();
        }
    }

    enterBedDetailView() {
        if (!this.selectedBed) return;

        this.bedDetailMode = true;

        // Fit the selected bed to screen in detail mode FIRST
        this.canvas.fitBedToScreen(this.selectedBed);

        // Update UI
        const bedName = this.selectedBed.name || 'Unnamed Bed';
        document.getElementById('detailViewBedName').textContent = `Detail View: ${bedName}`;
        document.getElementById('detailViewBanner').style.display = 'flex';
        this.updateSidebar();

        // Render with new zoom
        this.render();
    }

    exitBedDetailView() {
        this.bedDetailMode = false;

        // Fit all beds to screen
        if (this.beds.length > 0) {
            this.canvas.fitToScreen(this.beds);
        }

        // Update UI
        document.getElementById('detailViewBanner').style.display = 'none';
        this.updateSidebar();
        this.render();
    }

    render() {
        this.canvas.clear();

        if (this.bedDetailMode && this.selectedBed) {
            // Detail mode: only draw the selected bed
            this.canvas.drawBed(this.selectedBed, true);
        } else {
            // Overview mode: draw all beds
            this.beds.forEach(bed => {
                const isSelected = this.selectedBed && bed.id === this.selectedBed.id;
                this.canvas.drawBed(bed, isSelected);
            });
        }
    }

    saveToStorage() {
        const data = {
            beds: this.beds,
            version: 3
        };
        localStorage.setItem('gardenPlanner', JSON.stringify(data));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('gardenPlanner');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.beds = data.beds || [];

                // Migrate old format to new format
                if (data.version < 3) {
                    this.beds.forEach(bed => {
                        if (!bed.plantGroups) {
                            bed.plantGroups = [];
                        }
                    });
                    this.saveToStorage();
                }
            } catch (e) {
                console.error('Failed to load saved data', e);
            }
        }
    }

    openReportModal() {
        if (this.beds.length === 0) {
            alert('Add some beds before generating a report!');
            return;
        }

        this.generateReport();
        document.getElementById('reportModal').classList.add('active');
    }

    closeReportModal() {
        document.getElementById('reportModal').classList.remove('active');
    }

    generateReport() {
        const container = document.getElementById('reportContent');

        // Calculate totals
        let totalBeds = this.beds.length;
        let totalPlants = 0;
        let totalPlantTypes = 0;

        this.beds.forEach(bed => {
            if (bed.plantGroups) {
                totalPlantTypes += bed.plantGroups.length;
                bed.plantGroups.forEach(group => {
                    totalPlants += group.positions ? group.positions.length : 0;
                });
            }
        });

        // Generate HTML
        let html = `
            <div class="report-summary">
                <h4>Summary</h4>
                <div class="report-summary-stats">
                    <div class="report-stat">
                        <div class="report-stat-value">${totalBeds}</div>
                        <div class="report-stat-label">Total Beds</div>
                    </div>
                    <div class="report-stat">
                        <div class="report-stat-value">${totalPlants}</div>
                        <div class="report-stat-label">Total Plants</div>
                    </div>
                    <div class="report-stat">
                        <div class="report-stat-value">${totalPlantTypes}</div>
                        <div class="report-stat-label">Plant Types</div>
                    </div>
                </div>
            </div>
        `;

        // Generate bed details
        this.beds.forEach(bed => {
            const totalBedPlants = bed.plantGroups ?
                bed.plantGroups.reduce((sum, g) => sum + (g.positions ? g.positions.length : 0), 0) : 0;

            const dimensions = bed.type === 'rectangle' ?
                `${Math.round(bed.width)}" × ${Math.round(bed.height)}"` :
                `Radius: ${Math.round(bed.radius)}"`;

            html += `
                <div class="report-bed">
                    <div class="report-bed-header">
                        <div>
                            <div class="report-bed-title">${bed.name || 'Unnamed Bed'}</div>
                            <div class="report-bed-dimensions">${dimensions} • ${bed.type === 'rectangle' ? 'Rectangle' : 'Circle'}</div>
                        </div>
                        <div class="report-bed-total">
                            <div class="report-bed-total-value">${totalBedPlants}</div>
                            <div class="report-bed-total-label">Total Plants</div>
                        </div>
                    </div>
            `;

            if (bed.plantGroups && bed.plantGroups.length > 0) {
                html += `
                    <table class="report-plants-table">
                        <thead>
                            <tr>
                                <th>Plant</th>
                                <th>Spacing</th>
                                <th style="text-align: right;">Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                bed.plantGroups.forEach(group => {
                    const quantity = group.positions ? group.positions.length : 0;
                    html += `
                        <tr>
                            <td>
                                <span class="report-plant-color" style="background-color: ${group.color}"></span>
                                ${group.name}
                            </td>
                            <td>${group.spacing}"</td>
                            <td style="text-align: right; font-weight: 600;">${quantity}</td>
                        </tr>
                    `;
                });

                html += `
                        </tbody>
                    </table>
                `;
            } else {
                html += `<p style="color: #718096; font-style: italic;">No plants in this bed</p>`;
            }

            html += `</div>`;
        });

        container.innerHTML = html;
    }

    print() {
        if (this.beds.length === 0) {
            alert('Add some beds before printing!');
            return;
        }

        this.canvas.fitToScreen(this.beds);
        this.render();

        setTimeout(() => {
            window.print();
        }, 100);
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GardenPlanner();
});
