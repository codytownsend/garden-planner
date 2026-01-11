# Garden Planner

A visual garden bed planning tool that helps you design your garden layout, calculate plant spacing, and maximize your growing space.

## Features

### Bed Creation
- **Rectangle Beds**: Click and drag to create rectangular garden beds of any size
- **Circle Beds**: Perfect for container gardens and raised circular beds
- **Unlimited Beds**: Add as many beds as you need with flexible placement
- **Infinite Canvas**: Pan and zoom to design gardens of any size

### Custom Plants
- **Add Your Own Plants**: Create custom plants with specific names and spacing requirements
- **Color Coding**: Assign colors to differentiate plant types visually
- **Plant Library**: Save your commonly used plants for reuse across beds

### Smart Plant Placement

#### Automatic Fill Options:
- **Auto Fill**: Maximize plants in the bed using optimal spacing
- **Specific Count**: Place an exact number of plants
- **Number of Rows**: Fill bed with a specific number of rows
- **Percentage**: Fill a percentage of the available bed space

#### Placement Patterns:
- **Grid Pattern**: Traditional rows and columns layout
- **Hexagonal Pattern**: 15% more space-efficient arrangement

#### Manual Placement:
- **Drag & Drop**: Use the "Place Plant" tool to manually position individual plants
- **Visual Preview**: See plant position before placing

### Multiple Plants Per Bed
- Add different plant types to the same bed
- Each plant type maintains its own color and spacing
- View total count for each plant type in the bed
- Remove individual plant groups as needed

### Canvas Controls
- **Mouse Wheel Zoom**: Scroll to zoom in/out
- **Trackpad Pinch**: Pinch-to-zoom gesture support
- **Zoom Buttons**: Zoom in, zoom out, and fit-to-screen buttons
- **Pan**: Click and drag in select mode to move around the canvas

### Data Persistence
- All data saved automatically to browser localStorage
- No accounts or login required
- Data persists across browser sessions

### Print Support
- Print-optimized layout
- Automatically centers and fits beds to page
- Clean output without UI elements

## How to Use

### Getting Started
1. Open `index.html` in a web browser
2. Click "+ Add Bed" to create your first garden bed
3. Specify bed dimensions in the dialog
4. Select the bed and click "+ Add Plant" to fill it

### Creating Beds
1. Click "+ Add Bed" in the left sidebar
2. Choose bed type (Rectangle or Circle)
3. Specify dimensions (width/height or radius in inches)
4. Bed appears at center of canvas - drag to position it
5. Click the bed to select it and view properties

### Editing Beds
1. Click a bed on canvas to select it
2. **Drag** the bed to move it
3. **Drag resize handles** (blue dots) to change size
4. Or use sidebar inputs for precise dimensions

### Adding Plants to Beds
1. Select a bed from the Beds list or click it on canvas
2. Click "+ Add Plant" button
3. Enter plant details:
   - **Name**: e.g., "Tomato"
   - **Spacing**: Distance between plants in inches
   - **Color**: Visual identifier for this plant type
4. Choose your fill method:
   - **Auto**: Maximize plants using optimal spacing
   - **Count**: Place exact number of plants
   - **Rows**: Fill with specific number of rows
   - **Percentage**: Fill portion of bed
5. Select arrangement pattern (Grid or Hexagonal)
6. Preview shows how many plants will be placed
7. Click "Add Plant"

### Managing Your Garden

**Beds List**:
- View all beds in left sidebar
- Click a bed to select it
- Shows bed dimensions and plant count
- Selected bed highlighted on canvas

**Bed Properties Panel** (appears when bed selected):
- Edit bed name
- Adjust dimensions precisely
- View all plants in bed
- Remove individual plant types
- Delete entire bed

**Canvas Controls**:
- **Click & Drag** bed to move it
- **Drag resize handles** (blue dots on selected bed) to resize
- **Mouse Wheel or Trackpad Scroll**: Zoom in/out
- **Trackpad Pinch**: Pinch-to-zoom gesture
- **Zoom Buttons**: Zoom In, Zoom Out, Fit to Screen
- **Drag empty space**: Pan the canvas

### Tips for Zoom
- **Mouse**: Scroll wheel to zoom
- **Trackpad**: Two-finger scroll or pinch gesture to zoom
- **Buttons**: Use toolbar zoom buttons for precise control

## Tips

- Use hexagonal pattern for 15% more plants in the same space
- Different colored plants make it easy to visualize crop rotation
- The "Fit to Screen" button quickly centers all your beds
- Combine auto-fill with manual placement for partial fills
- Save common spacing values by creating plants for each spacing requirement

## Browser Support

Works in all modern browsers that support:
- HTML5 Canvas
- LocalStorage
- ES6 JavaScript

## No Installation Required

This is a client-side only application - simply open the HTML file in any web browser!
