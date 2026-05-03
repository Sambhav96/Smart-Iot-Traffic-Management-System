# Smart Traffic Management System Simulation

An IoT-based smart traffic simulation platform with a FastAPI backend and Next.js frontend. It simulates a 4-lane smart intersection with adaptive signal control, emergency vehicle handling, traffic logs, and analytics.

## Architecture Overview

### Backend (FastAPI)
- **Core Engine**: Simulation engine with traffic logic, sensor simulation, and adaptive signal control
- **Services Layer**: Business logic for traffic management, emergency handling, and mode switching
- **API Routes**: RESTful endpoints for simulation control, traffic data, logs, and analytics
- **Models**: Pydantic schemas for data validation and type safety

### Frontend (Next.js)
- **Dashboard**: Real-time visualization of simulation state and controls
- **Components**: Modular UI components for controls, status display, and data visualization
- **Validation**: Client-side input validation with user-friendly error messages
- **State Management**: React hooks for API integration and real-time updates

### Key Features
- Three operation modes: TIMED, ADAPTIVE, MANUAL
- Emergency vehicle priority handling
- Pedestrian crossing requests
- Real-time traffic analytics
- Comprehensive test coverage

## Backend (FastAPI)

The backend provides the API and houses the core traffic simulation engine.

### Setup and Run
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # Windows: venv\Scripts\activate
   # Mac/Linux: source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be accessible at `http://localhost:8000`
   Check the health status at `http://localhost:8000/api/health`

## Frontend (Next.js)

The frontend provides the dashboard for visualizing the simulation.

### Setup and Run
1. Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2. Install dependencies (should be installed during scaffold, but just in case):
    ```bash
    npm install
    ```
3. Run the development server:
    ```bash
    npm run dev
    ```
    The dashboard will be accessible at `http://localhost:3000`

## Testing

### Backend Tests
1. Navigate to the backend directory:
    ```bash
    cd backend
    ```
2. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3. Run tests:
    ```bash
    pytest
    ```
    Or with coverage:
    ```bash
    pytest --cov=app --cov-report=html
    ```

### Frontend Validation
Frontend includes lightweight client-side validation for user inputs:
- Lane IDs are validated against allowed values (north, south, east, west)
- Vehicle counts are validated to be integers between 0 and 50
- Validation errors are displayed inline with input fields

Components gracefully handle empty, error, and loading states.

## Demo Flow

1. **Setup Environment**:
   - Start backend: `cd backend && uvicorn app.main:app --reload`
   - Start frontend: `cd frontend && npm run dev`
   - Access dashboard at `http://localhost:3000`

2. **Basic Simulation**:
   - Click "Start" to begin simulation
   - Observe traffic signals cycling automatically (TIMED mode)
   - View real-time metrics in summary cards

3. **Adaptive Mode**:
   - Switch to "ADAPTIVE" mode
   - Adjust vehicle counts in different lanes to see signal adaptation

4. **Manual Control**:
   - Switch to "MANUAL" mode
   - Use Manual Lane Controls to set active lanes and vehicle counts
   - Force signal states and observe direct control

5. **Emergency Handling**:
   - Activate emergency for a lane (simulates priority vehicle)
   - Observe immediate signal changes and priority handling

6. **Pedestrian Features**:
   - Request pedestrian crossings via API or manual triggers
   - See how signals accommodate pedestrian requests

7. **Analytics & Logs**:
   - View congestion trends and waiting time analytics
   - Check event logs for system activity

## Running Tests

Backend tests: `cd backend && pytest`

Frontend validation is integrated into components with real-time feedback.
