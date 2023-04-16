const autopilotDirectoryName = '.autopilot';

function getCodeBaseAutopilotDirectory(codeBaseDirectory){
    return path.posix.join(codeBaseDirectory, autopilotDirectoryName);
}

module.exports = { getCodeBaseAutopilotDirectory }