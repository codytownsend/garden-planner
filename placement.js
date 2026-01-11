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

        // Center the grid
        const offsetX = (width - (cols - 1) * spacing) / 2;
        const offsetY = (height - (rows - 1) * spacing) / 2;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                positions.push({
                    x: col * spacing + offsetX - width / 2,
                    y: row * spacing + offsetY - height / 2
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

        for (let row = 0; row < rows; row++) {
            const y = row * verticalSpacing;
            const offset = (row % 2) * (spacing / 2);
            const cols = Math.floor((width - offset) / spacing);

            // Center the row
            const rowWidth = (cols - 1) * spacing + offset;
            const offsetX = (width - rowWidth) / 2;

            for (let col = 0; col < cols; col++) {
                const x = col * spacing + offset + offsetX;

                positions.push({
                    x: x - width / 2,
                    y: y - height / 2
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
            // For rectangles
            const rowSpacing = height / (numRows + 1);
            const cols = Math.floor(width / spacing);
            const offsetX = (width - (cols - 1) * spacing) / 2;

            for (let row = 0; row < numRows; row++) {
                const y = rowSpacing * (row + 1) - height / 2;

                for (let col = 0; col < cols; col++) {
                    positions.push({
                        x: col * spacing + offsetX - width / 2,
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
     * Place plants with awareness of existing plants
     */
    static placeWithAwareness(width, height, spacing, pattern, method, value, isCircle, radius, existingPlantGroups) {
        let candidatePositions;

        // Generate all candidate positions based on method
        if (method === 'auto') {
            if (isCircle) {
                candidatePositions = this.placeInCircle(radius, spacing, pattern);
            } else {
                candidatePositions = this.placeInRectangle(width, height, spacing, pattern);
            }
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
}
