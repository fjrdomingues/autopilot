const autopilotConfig = require('./autopilotConfig');
const path = require('path');

describe('getCodeBaseAutopilotDirectory', () => {
  test('should return the path of the autopilot directory', () => {
    const codeBaseDirectory = path.posix.join(__dirname, 'testDirectory');
    const expectedAutopilotDirectory = path.posix.join(__dirname, 'testDirectory', '.autopilot');
    const autopilotDirectory = autopilotConfig.getCodeBaseAutopilotDirectory(codeBaseDirectory);
    expect(autopilotDirectory).toBe(expectedAutopilotDirectory);
  });
});
