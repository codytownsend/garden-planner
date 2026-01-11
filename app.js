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
        this.currentTool = null; // null (default/select), 'place-plant'
        this.editingPlantIndex = null; // Track which plant is being edited
        this.selectedColor = '#22c55e'; // Current selected color

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
        this.resizeHandle = null;
        this.dragStart = null;
        this.bedDragStart = null;

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

        // Tool buttons
        const placePlantBtn = document.getElementById('placePlantTool');
        if (placePlantBtn) {
            placePlantBtn.addEventListener('click', () => {
                if (this.currentTool === 'place-plant') {
                    this.setTool(null);
                } else {
                    this.setTool('place-plant');
                }
            });
        }

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
                this.render();
            }
        });

        document.getElementById('bedWidth').addEventListener('input', (e) => {
            if (this.selectedBed && this.selectedBed.type === 'rectangle') {
                this.selectedBed.width = Math.max(12, parseInt(e.target.value) || 12);
                this.saveToStorage();
                this.render();
            }
        });

        document.getElementById('bedHeight').addEventListener('input', (e) => {
            if (this.selectedBed && this.selectedBed.type === 'rectangle') {
                this.selectedBed.height = Math.max(12, parseInt(e.target.value) || 12);
                this.saveToStorage();
                this.render();
            }
        });

        document.getElementById('bedRadius').addEventListener('input', (e) => {
            if (this.selectedBed && this.selectedBed.type === 'circle') {
                this.selectedBed.radius = Math.max(6, parseInt(e.target.value) || 6);
                this.saveToStorage();
                this.render();
            }
        });

        document.getElementById('deleteBed').addEventListener('click', () => {
            if (this.selectedBed && confirm('Delete this bed?')) {
                this.beds = this.beds.filter(b => b.id !== this.selectedBed.id);
                this.selectedBed = null;
                this.renderBedsList();
                this.updateSidebar();
                this.saveToStorage();
                this.render();
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

        document.getElementById('fillMethod').addEventListener('change', (e) => {
            this.updateFillMethodUI(e.target.value);
        });

        document.getElementById('fillValue').addEventListener('input', () => {
            this.updateFillPreview();
        });

        document.getElementById('fillPattern').addEventListener('change', () => {
            this.updateFillPreview();
        });

        document.getElementById('plantSpacing').addEventListener('input', () => {
            this.updateFillPreview();
        });

        // Color picker
        document.getElementById('plantColor').addEventListener('input', (e) => {
            this.selectedColor = e.target.value;
            this.updateColorSwatchSelection();
        });

        // Toolbar buttons
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

        // Update button states
        const placePlantBtn = document.getElementById('placePlantTool');
        if (placePlantBtn) {
            if (tool === 'place-plant') {
                placePlantBtn.classList.add('active');
                this.canvas.canvas.style.cursor = 'crosshair';
            } else {
                placePlantBtn.classList.remove('active');
                this.canvas.canvas.style.cursor = 'default';
            }
        }
    }

    handleMouseDown(e) {
        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);

        if (this.currentTool === 'place-plant') {
            // Place a plant manually - but we need to know which plant to place
            // For now, we'll skip this - user needs to use the Add Plant dialog
            return;
        }

        // Check if clicking on a bed
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
                // Start dragging bed
                this.isDraggingBed = true;
                this.selectedBed = clickedBed;
                this.dragStart = worldPos;
                this.bedDragStart = { x: clickedBed.x, y: clickedBed.y };
                this.renderBedsList();
                this.updateSidebar();
                this.canvas.canvas.style.cursor = 'grabbing';
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

    handleMouseMove(e) {
        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);

        if (this.isDraggingBed && this.selectedBed && this.dragStart) {
            // Move the bed
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
                this.canvas.canvas.style.cursor = this.currentTool === 'place-plant' ? 'crosshair' : 'default';
            }
        }
    }

    handleMouseUp(e) {
        if (this.isDraggingBed || this.isResizing) {
            this.saveToStorage();
        }

        this.isDraggingBed = false;
        this.isResizing = false;
        this.resizeHandle = null;
        this.dragStart = null;
        this.bedDragStart = null;

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

        if (this.selectedBed) {
            selectedBedPanel.style.display = 'block';

            document.getElementById('bedName').value = this.selectedBed.name || '';
            document.getElementById('bedType').value = this.selectedBed.type;

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

            this.updateBedPlantsList();
        } else {
            selectedBedPanel.style.display = 'none';
        }
    }

    updateBedPlantsList() {
        if (!this.selectedBed) return;

        const container = document.getElementById('bedPlantsList');

        if (!this.selectedBed.plantGroups || this.selectedBed.plantGroups.length === 0) {
            container.innerHTML = '<div style="color: #718096; font-size: 13px; margin-bottom: 8px;">No plants in this bed yet.</div>';
            return;
        }

        container.innerHTML = this.selectedBed.plantGroups.map((group, index) => {
            return `
                <div class="bed-plant-item">
                    <div class="bed-plant-info">
                        <div class="bed-plant-name">
                            <span class="plant-color-dot" style="background-color: ${group.color}"></span>
                            ${group.name}
                        </div>
                        <div class="bed-plant-count">${group.positions.length} plants • ${group.spacing}" spacing</div>
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
            `;
        }).join('');
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

        document.getElementById('fillMethod').value = 'auto';
        document.getElementById('fillPattern').value = 'grid';
        this.updateFillMethodUI('auto');
        this.updateFillPreview();

        // Change modal title and button text
        document.querySelector('#addPlantToBedModal .modal-header h3').textContent = 'Edit Plant';
        document.getElementById('saveAddPlantToBed').textContent = 'Update Plant';

        document.getElementById('addPlantToBedModal').classList.add('active');
    }

    removePlantGroup(index) {
        if (!this.selectedBed) return;

        this.selectedBed.plantGroups.splice(index, 1);
        this.updateBedPlantsList();
        this.renderBedsList();
        this.saveToStorage();
        this.render();
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

        document.getElementById('fillMethod').value = 'auto';
        document.getElementById('fillPattern').value = 'grid';
        this.updateFillMethodUI('auto');
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

        const method = document.getElementById('fillMethod').value;
        const pattern = document.getElementById('fillPattern').value;
        const value = parseInt(document.getElementById('fillValue').value) || 0;

        const isCircle = this.selectedBed.type === 'circle';
        const width = this.selectedBed.width || 0;
        const height = this.selectedBed.height || 0;
        const radius = this.selectedBed.radius || 0;

        // Get existing plant groups (excluding the one being edited)
        let existingPlantGroups = [];
        if (this.selectedBed.plantGroups) {
            existingPlantGroups = this.selectedBed.plantGroups.filter((group, index) => {
                return this.editingPlantIndex === null || index !== this.editingPlantIndex;
            });
        }

        // Use smart placement that avoids existing plants
        const positions = PlantPlacer.placeWithAwareness(
            width,
            height,
            spacing,
            pattern,
            method,
            value,
            isCircle,
            radius,
            existingPlantGroups
        );

        const preview = document.getElementById('fillPreview');
        preview.innerHTML = `
            <strong>Preview:</strong><br>
            This will place <strong>${positions ? positions.length : 0}</strong> ${name} plants<br>
            Pattern: ${pattern === 'grid' ? 'Grid' : 'Hexagonal'}<br>
            Spacing: ${spacing} inches
            ${existingPlantGroups.length > 0 ? '<br><em>(avoiding existing plants)</em>' : ''}
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

        const method = document.getElementById('fillMethod').value;
        const pattern = document.getElementById('fillPattern').value;
        const value = parseInt(document.getElementById('fillValue').value) || 0;

        const isCircle = this.selectedBed.type === 'circle';
        const width = this.selectedBed.width || 0;
        const height = this.selectedBed.height || 0;
        const radius = this.selectedBed.radius || 0;

        if (!this.selectedBed.plantGroups) {
            this.selectedBed.plantGroups = [];
        }

        // Get existing plant groups (excluding the one being edited)
        let existingPlantGroups = this.selectedBed.plantGroups.filter((group, index) => {
            return this.editingPlantIndex === null || index !== this.editingPlantIndex;
        });

        // Use smart placement that avoids existing plants
        const positions = PlantPlacer.placeWithAwareness(
            width,
            height,
            spacing,
            pattern,
            method,
            value,
            isCircle,
            radius,
            existingPlantGroups
        );

        if (this.editingPlantIndex !== null) {
            // Update existing plant group
            this.selectedBed.plantGroups[this.editingPlantIndex] = {
                name: name,
                spacing: spacing,
                color: color,
                positions: positions
            };
        } else {
            // Add new plant group
            this.selectedBed.plantGroups.push({
                name: name,
                spacing: spacing,
                color: color,
                positions: positions
            });
        }

        this.updateBedPlantsList();
        this.renderBedsList();
        this.saveToStorage();
        this.render();
        this.closeAddPlantToBedModal();
    }

    render() {
        this.canvas.clear();

        // Draw all beds
        this.beds.forEach(bed => {
            const isSelected = this.selectedBed && bed.id === this.selectedBed.id;
            this.canvas.drawBed(bed, isSelected);
        });
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
