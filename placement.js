// Plant placement algorithms

class PlantPlacer {
    /**
     * Calculate plant positions for a rectangular bed
     */
    static placeInRectangle(width, height, spacing, pattern = 'grid') {
        if (pattern === 'hexagonal') {
            return this.hexagonalPattern(width, height, spacing);
        }
        return this.gridPattern(width, height, spacing);
    }

    /**
     * Calculate plant positions for a circular bed
     */
    static placeInCircle(radius, spacing, pattern = 'grid') {
        const diameter = radius * 2;
        let positions;

        if (pattern === 'hexagonal') {
            positions = this.hexagonalPattern(diameter, diameter, spacing);
        } else {
            positions = this.gridPattern(diameter, diameter, spacing);
        }

        // Filter positions to only include those within the circle
        // Positions are relative to center (0, 0)
        return positions.filter(pos => {
            const distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
            return distance <= radius - spacing / 2;
        });
    }

    /**
     * Grid pattern placement (rows and columns)
     */
    static gridPattern(width, height, spacing) {
        const positions = [];
        const cols = Math.floor(width / spacing);
        const rows = Math.floor(height / spacing);

        // Start from top-left (sequential filling)
        const startX = -width / 2 + spacing / 2;
        const startY = -height / 2 + spacing / 2;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                positions.push({
                    x: startX + col * spacing,
                    y: startY + row * spacing
                });
            }
        }

        return positions;
    }

    /**
     * Hexagonal pattern placement (more space-efficient)
     */
    static hexagonalPattern(width, height, spacing) {
        const positions = [];

        // In hexagonal packing, vertical spacing is smaller
        const verticalSpacing = spacing * Math.sqrt(3) / 2;
        const rows = Math.floor(height / verticalSpacing);

        // Start from top-left (sequential filling)
        const startY = -height / 2 + spacing / 2;
        const startX = -width / 2 + spacing / 2;

        for (let row = 0; row < rows; row++) {
            const y = startY + row * verticalSpacing;
            const offset = (row % 2) * (spacing / 2);
            const cols = Math.floor((width - spacing / 2 - offset) / spacing);

            for (let col = 0; col < cols; col++) {
                const x = startX + col * spacing + offset;

                positions.push({
                    x: x,
                    y: y
                });
            }
        }

        return positions;
    }

    /**
     * Place a specific number of plants
     */
    static placeSpecificCount(width, height, spacing, count, pattern, isCircle = false, radius = 0) {
        // Get all possible positions
        let allPositions;
        if (isCircle) {
            allPositions = this.placeInCircle(radius, spacing, pattern);
        } else {
            if (pattern === 'hexagonal') {
                allPositions = this.hexagonalPattern(width, height, spacing);
            } else {
                allPositions = this.gridPattern(width, height, spacing);
            }
        }

        // Return up to count positions
        return allPositions.slice(0, Math.min(count, allPositions.length));
    }

    /**
     * Place plants in a specific number of rows
     */
    static placeInRows(width, height, spacing, numRows, pattern, isCircle = false, radius = 0) {
        const positions = [];

        if (isCircle) {
            // For circles, create concentric rings
            const ringSpacing = radius / numRows;
            for (let ring = 0; ring < numRows; ring++) {
                const ringRadius = ringSpacing * (ring + 0.5);
                const circumference = 2 * Math.PI * ringRadius;
                const plantsInRing = Math.floor(circumference / spacing);

                for (let i = 0; i < plantsInRing; i++) {
                    const angle = (2 * Math.PI * i) / plantsInRing;
                    positions.push({
                        x: Math.cos(angle) * ringRadius,
                        y: Math.sin(angle) * ringRadius
                    });
                }
            }
        } else {
            // For rectangles - sequential filling from top-left
            const rowSpacing = height / numRows;
            const cols = Math.floor(width / spacing);

            // Start from top-left
            const startX = -width / 2 + spacing / 2;
            const startY = -height / 2 + rowSpacing / 2;

            for (let row = 0; row < numRows; row++) {
                const y = startY + row * rowSpacing;

                for (let col = 0; col < cols; col++) {
                    positions.push({
                        x: startX + col * spacing,
                        y: y
                    });
                }
            }
        }

        return positions;
    }

    /**
     * Place plants to fill a percentage of the bed
     */
    static placeByPercentage(width, height, spacing, percentage, pattern, isCircle = false, radius = 0) {
        // Get all possible positions
        let allPositions;
        if (isCircle) {
            allPositions = this.placeInCircle(radius, spacing, pattern);
        } else {
            if (pattern === 'hexagonal') {
                allPositions = this.hexagonalPattern(width, height, spacing);
            } else {
                allPositions = this.gridPattern(width, height, spacing);
            }
        }

        // Calculate how many plants to place
        const count = Math.floor(allPositions.length * (percentage / 100));
        return allPositions.slice(0, count);
    }

    /**
     * Filter positions to avoid conflicts with existing plants
     */
    static filterAvailablePositions(candidatePositions, existingPlantGroups, newPlantSpacing) {
        if (!existingPlantGroups || existingPlantGroups.length === 0) {
            return candidatePositions;
        }

        // Collect all existing plant positions
        const existingPositions = [];
        existingPlantGroups.forEach(group => {
            if (group.positions) {
                group.positions.forEach(pos => {
                    existingPositions.push({
                        x: pos.x,
                        y: pos.y,
                        spacing: group.spacing
                    });
                });
            }
        });

        // Filter candidate positions
        return candidatePositions.filter(candidate => {
            // Check if this position conflicts with any existing plant
            for (const existing of existingPositions) {
                const distance = Math.sqrt(
                    Math.pow(candidate.x - existing.x, 2) +
                    Math.pow(candidate.y - existing.y, 2)
                );

                // Minimum distance should be the average of the two spacings
                const minDistance = (newPlantSpacing + existing.spacing) / 2;

                if (distance < minDistance) {
                    return false; // Position conflicts
                }
            }
            return true; // Position is available
        });
    }

    /**
     * Calculate bed capacity for a given spacing and pattern
     */
    static calculateBedCapacity(width, height, spacing, pattern, isCircle, radius) {
        let positions;
        if (isCircle) {
            positions = this.placeInCircle(radius, spacing, pattern);
        } else {
            if (pattern === 'hexagonal') {
                positions = this.hexagonalPattern(width, height, spacing);
            } else {
                positions = this.gridPattern(width, height, spacing);
            }
        }
        return positions.length;
    }

    /**
     * Calculate how many plants are already placed
     */
    static calculateUsedSpace(existingPlantGroups) {
        if (!existingPlantGroups || existingPlantGroups.length === 0) {
            return 0;
        }
        return existingPlantGroups.reduce((sum, group) => {
            return sum + (group.positions ? group.positions.length : 0);
        }, 0);
    }

    /**
     * Place plants with awareness of existing plants
     */
    static placeWithAwareness(width, height, spacing, pattern, method, value, isCircle, radius, existingPlantGroups) {
        let candidatePositions;

        // Generate all candidate positions based on method
        if (method === 'auto') {
            // Smart autofill: calculate remaining capacity
            const totalCapacity = this.calculateBedCapacity(width, height, spacing, pattern, isCircle, radius);
            const usedSpace = this.calculateUsedSpace(existingPlantGroups);
            const remainingCapacity = totalCapacity - usedSpace;

            if (isCircle) {
                candidatePositions = this.placeInCircle(radius, spacing, pattern);
            } else {
                candidatePositions = this.placeInRectangle(width, height, spacing, pattern);
            }

            // Filter available positions
            const availablePositions = this.filterAvailablePositions(
                candidatePositions,
                existingPlantGroups,
                spacing
            );

            // Return up to remaining capacity
            return availablePositions.slice(0, Math.min(remainingCapacity, availablePositions.length));

        } else if (method === 'count') {
            if (isCircle) {
                candidatePositions = this.placeInCircle(radius, spacing, pattern);
            } else {
                if (pattern === 'hexagonal') {
                    candidatePositions = this.hexagonalPattern(width, height, spacing);
                } else {
                    candidatePositions = this.gridPattern(width, height, spacing);
                }
            }
        } else if (method === 'rows') {
            candidatePositions = this.placeInRows(width, height, spacing, value, pattern, isCircle, radius);
        } else if (method === 'percentage') {
            if (isCircle) {
                candidatePositions = this.placeInCircle(radius, spacing, pattern);
            } else {
                if (pattern === 'hexagonal') {
                    candidatePositions = this.hexagonalPattern(width, height, spacing);
                } else {
                    candidatePositions = this.gridPattern(width, height, spacing);
                }
            }
        }

        // Filter out positions that conflict with existing plants
        const availablePositions = this.filterAvailablePositions(
            candidatePositions,
            existingPlantGroups,
            spacing
        );

        // Apply count/percentage limits after filtering
        if (method === 'count') {
            return availablePositions.slice(0, Math.min(value, availablePositions.length));
        } else if (method === 'percentage') {
            const count = Math.floor(candidatePositions.length * (value / 100));
            return availablePositions.slice(0, Math.min(count, availablePositions.length));
        }

        return availablePositions;
    }

    /**
     * Check if a point is inside a rectangle
     */
    static isInRectangle(point, width, height) {
        return Math.abs(point.x) <= width / 2 &&
               Math.abs(point.y) <= height / 2;
    }

    /**
     * Check if a point is inside a circle
     */
    static isInCircle(point, radius) {
        return Math.sqrt(point.x * point.x + point.y * point.y) <= radius;
    }

    /**
     * Place plants in a specific region without inter-layer spacing
     * This is used for the new region-based system where each plant owns its region
     */
    static placeInRegion(width, height, spacing, isCircle, radius, isHorizontal, regionBounds) {
        if (isCircle) {
            return this.placeInCircularRegion(radius, spacing, regionBounds);
        } else if (isHorizontal) {
            return this.placeInHorizontalRegion(width, height, spacing, regionBounds);
        } else {
            return this.placeInVerticalRegion(width, height, spacing, regionBounds);
        }
    }

    /**
     * Place plants in a horizontal region (top to bottom)
     */
    static placeInHorizontalRegion(width, height, spacing, regionBounds) {
        const stripHeight = height * (regionBounds.end - regionBounds.start);
        const stripTop = -height / 2 + regionBounds.start * height;
        const stripBottom = stripTop + stripHeight;

        // Try both patterns and pick the one that fits more plants
        const gridPositions = this.generateGridInHorizontalStrip(width, stripHeight, spacing, stripTop, stripBottom, 'auto', 0);
        const hexPositions = this.generateHexInHorizontalStrip(width, stripHeight, spacing, stripTop, stripBottom, 'auto', 0);

        return hexPositions.length > gridPositions.length ? hexPositions : gridPositions;
    }

    /**
     * Place plants in a vertical region (left to right)
     */
    static placeInVerticalRegion(width, height, spacing, regionBounds) {
        const stripWidth = width * (regionBounds.end - regionBounds.start);
        const stripLeft = -width / 2 + regionBounds.start * width;
        const stripRight = stripLeft + stripWidth;

        // Try both patterns and pick the one that fits more plants
        const gridPositions = this.generateGridInVerticalStrip(stripWidth, height, spacing, stripLeft, stripRight, 'auto', 0);
        const hexPositions = this.generateHexInVerticalStrip(stripWidth, height, spacing, stripLeft, stripRight, 'auto', 0);

        return hexPositions.length > gridPositions.length ? hexPositions : gridPositions;
    }

    /**
     * Place plants in a circular region (ring)
     */
    static placeInCircularRegion(radius, spacing, regionBounds) {
        const innerRadius = radius * regionBounds.start;
        const outerRadius = radius * regionBounds.end;
        const ringWidth = outerRadius - innerRadius;

        const positions = [];
        const numSubRings = Math.max(1, Math.floor(ringWidth / spacing));

        for (let subRing = 0; subRing < numSubRings; subRing++) {
            const ringRadius = innerRadius + (ringWidth / (numSubRings + 1)) * (subRing + 1);
            const circumference = 2 * Math.PI * ringRadius;
            const plantsInRing = Math.max(1, Math.floor(circumference / spacing));

            for (let i = 0; i < plantsInRing; i++) {
                const angle = (2 * Math.PI * i) / plantsInRing;
                const x = Math.cos(angle) * ringRadius;
                const y = Math.sin(angle) * ringRadius;
                positions.push({ x, y });
            }
        }

        return positions;
    }

    /**
     * Place plants in a specific layer based on bed orientation
     */
    static placeInLayer(width, height, spacing, pattern, method, value, layerIndex, totalLayers, isCircle, radius, isHorizontal, previousLayers) {
        // Default bounds: evenly divide the space
        const bounds = {
            start: layerIndex / totalLayers,
            end: (layerIndex + 1) / totalLayers
        };

        return this.placeInLayerWithBounds(width, height, spacing, pattern, method, value, layerIndex, totalLayers, isCircle, radius, isHorizontal, previousLayers, bounds);
    }

    /**
     * Place plants in a specific layer with custom region bounds
     */
    static placeInLayerWithBounds(width, height, spacing, pattern, method, value, layerIndex, totalLayers, isCircle, radius, isHorizontal, previousLayers, bounds) {
        if (isCircle) {
            // For circular beds, use concentric rings
            return this.placeInCircularLayerWithBounds(radius, spacing, pattern, method, value, layerIndex, totalLayers, previousLayers, bounds);
        }

        // For rectangular beds, divide based on orientation
        // Horizontal bed (wider): fill in horizontal rows (top to bottom)
        // Vertical bed (taller): fill in vertical columns (left to right)
        if (isHorizontal) {
            // Horizontal bed: divide into horizontal strips (top to bottom)
            return this.placeInHorizontalLayerWithBounds(width, height, spacing, pattern, method, value, layerIndex, totalLayers, previousLayers, bounds);
        } else {
            // Vertical bed: divide into vertical strips (left to right)
            return this.placeInVerticalLayerWithBounds(width, height, spacing, pattern, method, value, layerIndex, totalLayers, previousLayers, bounds);
        }
    }

    /**
     * Place plants in horizontal layer (horizontal bed fills top to bottom in rows)
     */
    static placeInHorizontalLayer(width, height, spacing, pattern, method, value, layerIndex, totalLayers, previousLayers) {
        const bounds = {
            start: layerIndex / totalLayers,
            end: (layerIndex + 1) / totalLayers
        };
        return this.placeInHorizontalLayerWithBounds(width, height, spacing, pattern, method, value, layerIndex, totalLayers, previousLayers, bounds);
    }

    /**
     * Place plants in horizontal layer with custom bounds
     */
    static placeInHorizontalLayerWithBounds(width, height, spacing, pattern, method, value, layerIndex, totalLayers, previousLayers, bounds) {
        // Use bounds to calculate strip dimensions
        const stripHeight = height * (bounds.end - bounds.start);
        const stripTop = -height / 2 + bounds.start * height;
        const stripBottom = stripTop + stripHeight;

        // Try both patterns and pick the one that fits more plants
        const gridPositions = this.generateGridInHorizontalStrip(width, stripHeight, spacing, stripTop, stripBottom, method, value);
        const hexPositions = this.generateHexInHorizontalStrip(width, stripHeight, spacing, stripTop, stripBottom, method, value);

        // Choose pattern that yields more plants
        const positions = hexPositions.length > gridPositions.length ? hexPositions : gridPositions;

        // Filter positions to maintain spacing from previous layers
        const filteredPositions = this.filterByInterLayerSpacing(positions, spacing, previousLayers);

        // Apply fill method (but not for rows, already handled)
        if (method === 'rows') {
            return filteredPositions;
        }
        return this.applyFillMethod(filteredPositions, method, value);
    }

    /**
     * Generate grid pattern in horizontal strip (centered)
     */
    static generateGridInHorizontalStrip(width, stripHeight, spacing, stripTop, stripBottom, method, value) {
        const positions = [];
        const cols = Math.floor(width / spacing);

        // For rows method, limit the number of rows
        let maxRows = Math.floor(stripHeight / spacing);
        if (method === 'rows' && value > 0) {
            maxRows = Math.min(value, maxRows);
        }

        // Center the grid within the strip
        const totalRowHeight = (maxRows - 1) * spacing;
        const totalColWidth = (cols - 1) * spacing;
        const startX = -width / 2 + (width - totalColWidth) / 2;
        const startY = stripTop + (stripHeight - totalRowHeight) / 2;

        // Grid pattern - fill left to right, row by row
        for (let row = 0; row < maxRows; row++) {
            const y = startY + row * spacing;

            // Only include if within strip bounds
            if (y >= stripTop && y <= stripBottom) {
                for (let col = 0; col < cols; col++) {
                    positions.push({
                        x: startX + col * spacing,
                        y: y
                    });
                }
            }
        }

        return positions;
    }

    /**
     * Generate hexagonal pattern in horizontal strip (centered)
     */
    static generateHexInHorizontalStrip(width, stripHeight, spacing, stripTop, stripBottom, method, value) {
        const positions = [];
        const verticalSpacing = spacing * Math.sqrt(3) / 2;

        let maxRows = Math.floor(stripHeight / verticalSpacing);
        if (method === 'rows' && value > 0) {
            maxRows = Math.min(value, maxRows);
        }

        // Center the hexagonal grid within the strip
        const totalRowHeight = (maxRows - 1) * verticalSpacing;
        const baseY = stripTop + (stripHeight - totalRowHeight) / 2;

        for (let row = 0; row < maxRows; row++) {
            const y = baseY + row * verticalSpacing;

            if (y >= stripTop && y <= stripBottom) {
                const offset = (row % 2) * (spacing / 2);
                const availableWidth = width - offset;
                const cols = Math.floor(availableWidth / spacing);

                // Center this row
                const totalColWidth = (cols - 1) * spacing + offset;
                const startX = -width / 2 + (width - totalColWidth) / 2;

                for (let col = 0; col < cols; col++) {
                    const x = startX + col * spacing + offset;
                    positions.push({ x, y });
                }
            }
        }

        return positions;
    }

    /**
     * Place plants in vertical layer (vertical bed fills left to right in columns)
     */
    static placeInVerticalLayer(width, height, spacing, pattern, method, value, layerIndex, totalLayers, previousLayers) {
        const bounds = {
            start: layerIndex / totalLayers,
            end: (layerIndex + 1) / totalLayers
        };
        return this.placeInVerticalLayerWithBounds(width, height, spacing, pattern, method, value, layerIndex, totalLayers, previousLayers, bounds);
    }

    /**
     * Place plants in vertical layer with custom bounds
     */
    static placeInVerticalLayerWithBounds(width, height, spacing, pattern, method, value, layerIndex, totalLayers, previousLayers, bounds) {
        // Use bounds to calculate strip dimensions
        const stripWidth = width * (bounds.end - bounds.start);
        const stripLeft = -width / 2 + bounds.start * width;
        const stripRight = stripLeft + stripWidth;

        // Try both patterns and pick the one that fits more plants
        const gridPositions = this.generateGridInVerticalStrip(stripWidth, height, spacing, stripLeft, stripRight, method, value);
        const hexPositions = this.generateHexInVerticalStrip(stripWidth, height, spacing, stripLeft, stripRight, method, value);

        // Choose pattern that yields more plants
        const positions = hexPositions.length > gridPositions.length ? hexPositions : gridPositions;

        // Filter positions to maintain spacing from previous layers
        const filteredPositions = this.filterByInterLayerSpacing(positions, spacing, previousLayers);

        // Apply fill method (but not for rows, already handled)
        if (method === 'rows') {
            return filteredPositions;
        }
        return this.applyFillMethod(filteredPositions, method, value);
    }

    /**
     * Generate grid pattern in vertical strip (centered)
     */
    static generateGridInVerticalStrip(stripWidth, height, spacing, stripLeft, stripRight, method, value) {
        const positions = [];

        // For rows method on vertical beds, limit the number of columns
        let maxCols = Math.floor(stripWidth / spacing);
        if (method === 'rows' && value > 0) {
            maxCols = Math.min(value, maxCols);
        }

        const rows = Math.floor(height / spacing);

        // Center the grid within the strip
        const totalColWidth = (maxCols - 1) * spacing;
        const totalRowHeight = (rows - 1) * spacing;
        const startX = stripLeft + (stripWidth - totalColWidth) / 2;
        const startY = -height / 2 + (height - totalRowHeight) / 2;

        // Grid pattern - fill top to bottom, column by column
        for (let col = 0; col < maxCols; col++) {
            const x = startX + col * spacing;

            // Only include if within strip bounds
            if (x >= stripLeft && x <= stripRight) {
                for (let row = 0; row < rows; row++) {
                    positions.push({
                        x: x,
                        y: startY + row * spacing
                    });
                }
            }
        }

        return positions;
    }

    /**
     * Generate hexagonal pattern in vertical strip (centered)
     */
    static generateHexInVerticalStrip(stripWidth, height, spacing, stripLeft, stripRight, method, value) {
        const positions = [];
        const verticalSpacing = spacing * Math.sqrt(3) / 2;
        const rows = Math.floor(height / verticalSpacing);

        // Center vertically
        const totalRowHeight = (rows - 1) * verticalSpacing;
        const baseY = -height / 2 + (height - totalRowHeight) / 2;

        for (let row = 0; row < rows; row++) {
            const y = baseY + row * verticalSpacing;
            const offset = (row % 2) * (spacing / 2);
            const availableWidth = stripWidth - offset;

            let maxCols = Math.floor(availableWidth / spacing);
            if (method === 'rows' && value > 0 && row === 0) {
                maxCols = Math.min(value, maxCols);
            }

            // Center this row within the strip
            const totalColWidth = (maxCols - 1) * spacing + offset;
            const startX = stripLeft + (stripWidth - totalColWidth) / 2;

            for (let col = 0; col < maxCols; col++) {
                const x = startX + col * spacing + offset;

                if (x >= stripLeft && x <= stripRight) {
                    positions.push({ x, y });
                }
            }
        }

        return positions;
    }

    /**
     * Place plants in circular layer (concentric rings)
     */
    static placeInCircularLayer(radius, spacing, pattern, method, value, layerIndex, totalLayers, previousLayers) {
        const bounds = {
            start: layerIndex / totalLayers,
            end: (layerIndex + 1) / totalLayers
        };
        return this.placeInCircularLayerWithBounds(radius, spacing, pattern, method, value, layerIndex, totalLayers, previousLayers, bounds);
    }

    /**
     * Place plants in circular layer with custom bounds
     */
    static placeInCircularLayerWithBounds(radius, spacing, pattern, method, value, layerIndex, totalLayers, previousLayers, bounds) {
        const innerRadius = radius * bounds.start;
        const outerRadius = radius * bounds.end;
        const ringWidth = outerRadius - innerRadius;

        // For optimal space usage, try multiple radii within the ring
        const positions = [];
        const numSubRings = Math.max(1, Math.floor(ringWidth / spacing));

        for (let subRing = 0; subRing < numSubRings; subRing++) {
            const ringRadius = innerRadius + (ringWidth / (numSubRings + 1)) * (subRing + 1);
            const circumference = 2 * Math.PI * ringRadius;
            let plantsInRing = Math.max(1, Math.floor(circumference / spacing));

            // For rows method, limit plants per ring
            if (method === 'rows' && value > 0) {
                plantsInRing = Math.min(value, plantsInRing);
            }

            // Evenly space plants around the ring
            for (let i = 0; i < plantsInRing; i++) {
                const angle = (2 * Math.PI * i) / plantsInRing;
                const x = Math.cos(angle) * ringRadius;
                const y = Math.sin(angle) * ringRadius;

                positions.push({ x, y });
            }
        }

        // Filter positions to maintain spacing from previous layers
        const filteredPositions = this.filterByInterLayerSpacing(positions, spacing, previousLayers);

        // Apply fill method (but not for rows, already handled)
        if (method === 'rows') {
            return filteredPositions;
        }
        return this.applyFillMethod(filteredPositions, method, value);
    }

    /**
     * Apply fill method to limit positions
     */
    static applyFillMethod(positions, method, value) {
        if (method === 'auto') {
            return positions; // Use all positions
        } else if (method === 'count') {
            return positions.slice(0, Math.min(value, positions.length));
        } else if (method === 'percentage') {
            const count = Math.floor(positions.length * (value / 100));
            return positions.slice(0, count);
        } else if (method === 'rows') {
            // For rows, we need to filter by row count
            // This is handled differently based on orientation, so just return all for now
            // The calling function should handle row-based logic
            return positions;
        }
        return positions;
    }

    /**
     * Filter positions to maintain proper spacing from plants in previous layers
     * Uses the maximum of the two spacing values as the minimum distance
     */
    static filterByInterLayerSpacing(candidatePositions, newPlantSpacing, previousLayers) {
        if (!previousLayers || previousLayers.length === 0) {
            return candidatePositions;
        }

        // Collect all existing plant positions from previous layers
        const existingPositions = [];
        previousLayers.forEach(layer => {
            if (layer.positions && layer.positions.length > 0) {
                layer.positions.forEach(pos => {
                    existingPositions.push({
                        x: pos.x,
                        y: pos.y,
                        spacing: layer.spacing
                    });
                });
            }
        });

        if (existingPositions.length === 0) {
            return candidatePositions;
        }

        // Filter candidate positions
        return candidatePositions.filter(candidate => {
            // Check if this position conflicts with any existing plant from previous layers
            for (const existing of existingPositions) {
                const distance = Math.sqrt(
                    Math.pow(candidate.x - existing.x, 2) +
                    Math.pow(candidate.y - existing.y, 2)
                );

                // Minimum distance should be the MAXIMUM of the two spacings
                // This ensures both plants have adequate space
                const minDistance = Math.max(newPlantSpacing, existing.spacing);

                if (distance < minDistance) {
                    return false; // Position conflicts - too close
                }
            }
            return true; // Position is available
        });
    }
}
