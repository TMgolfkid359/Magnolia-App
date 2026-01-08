/**
 * Mock MSFS SimVar System
 * Provides simulated flight data for the G3X Touch instrument
 */

class MockSimVar {
  constructor(name, unit, value = 0) {
    this.name = name;
    this.unit = unit;
    this.value = value;
    this.subscribers = [];
  }

  get() {
    return this.value;
  }

  set(value) {
    this.value = value;
    this.notify();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    callback(this.value);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => cb(this.value));
  }
}

// Create mock SimVars for common flight parameters
const mockSimVars = {
  // Attitude
  'PLANE PITCH DEGREES': new MockSimVar('PLANE PITCH DEGREES', 'degrees', 0),
  'PLANE BANK DEGREES': new MockSimVar('PLANE BANK DEGREES', 'degrees', 0),
  
  // Altitude
  'INDICATED ALTITUDE': new MockSimVar('INDICATED ALTITUDE', 'feet', 3500),
  'PLANE ALTITUDE': new MockSimVar('PLANE ALTITUDE', 'feet', 3500),
  
  // Heading
  'PLANE HEADING DEGREES TRUE': new MockSimVar('PLANE HEADING DEGREES TRUE', 'degrees', 180),
  'PLANE HEADING DEGREES MAGNETIC': new MockSimVar('PLANE HEADING DEGREES MAGNETIC', 'degrees', 180),
  
  // Airspeed
  'AIRSPEED INDICATED': new MockSimVar('AIRSPEED INDICATED', 'knots', 120),
  'AIRSPEED TRUE': new MockSimVar('AIRSPEED TRUE', 'knots', 120),
  
  // Vertical Speed
  'VERTICAL SPEED': new MockSimVar('VERTICAL SPEED', 'feet per minute', 0),
  
  // Engine
  'GENERAL ENG RPM:1': new MockSimVar('GENERAL ENG RPM:1', 'rpm', 2400),
  'ENG OIL TEMPERATURE:1': new MockSimVar('ENG OIL TEMPERATURE:1', 'celsius', 90),
  'ENG OIL PRESSURE:1': new MockSimVar('ENG OIL PRESSURE:1', 'psi', 60),
  'FUEL TANK QUANTITY:1': new MockSimVar('FUEL TANK QUANTITY:1', 'gallons', 20),
  
  // Position
  'PLANE LATITUDE': new MockSimVar('PLANE LATITUDE', 'degrees', 33.7490),
  'PLANE LONGITUDE': new MockSimVar('PLANE LONGITUDE', 'degrees', -84.3880),
  
  // Electrical
  'ELECTRICAL BATTERY LOAD': new MockSimVar('ELECTRICAL BATTERY LOAD', 'amps', 12),
  'ELECTRICAL MASTER BATTERY': new MockSimVar('ELECTRICAL MASTER BATTERY', 'bool', 1),
  
  // GPS
  'GPS POSITION LAT': new MockSimVar('GPS POSITION LAT', 'degrees', 33.7490),
  'GPS POSITION LON': new MockSimVar('GPS POSITION LON', 'degrees', -84.3880),
  'GPS GROUND SPEED': new MockSimVar('GPS GROUND SPEED', 'knots', 120),
  'GPS GROUND TRACK': new MockSimVar('GPS GROUND TRACK', 'degrees', 180),
};

// Mock SimVar API
window.mockSimVars = mockSimVars;

// Create mock Coherent API for MSFS SDK
window.Coherent = {
  call: function(command, ...args) {
    if (command === 'simvar' && args.length >= 2) {
      const simVarName = args[0];
      if (mockSimVars[simVarName]) {
        return Promise.resolve(mockSimVars[simVarName].get());
      }
    }
    // Handle other commands
    if (command === 'trigger') {
      return Promise.resolve();
    }
    return Promise.resolve(0);
  },
  on: function(event, callback) {
    // Mock event listener
    if (event === 'simvar') {
      // Set up periodic updates for subscribed SimVars
      const interval = setInterval(() => {
        Object.values(mockSimVars).forEach(simVar => {
          if (simVar.subscribers.length > 0) {
            simVar.notify();
          }
        });
      }, 100); // Update every 100ms
      return () => clearInterval(interval);
    }
    return () => {};
  },
  off: function() {},
  trigger: function() {
    return Promise.resolve();
  }
};

// Create mock SimVar class for MSFS SDK compatibility
if (typeof window.SimVar === 'undefined') {
  window.SimVar = {
    GetSimVarValue: function(name, unit) {
      if (mockSimVars[name]) {
        return mockSimVars[name].get();
      }
      return 0;
    },
    SetSimVarValue: function(name, unit, value) {
      if (mockSimVars[name]) {
        mockSimVars[name].set(value);
      }
    }
  };
}

// Listen for updates from parent window
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'UPDATE_SIMVAR') {
    const { name, value } = event.data;
    if (mockSimVars[name]) {
      mockSimVars[name].set(value);
    }
  }
});

// Export for use in G3X Touch
window.MockSimVars = mockSimVars;

