const acorn = require('acorn');
const fg = require('fast-glob');
const fs = require('fs');

async function getFunctionSourceCode(functionNames) {
  const ignorePattern = ['node_modules/**/*', 'aiDev/**/*'];
  const files = await fg("**/*.{js,jsx,ts,tsx}", { ignore: ignorePattern });
  let functionSourceCode = '';

  for (const file of files) {
    try {
      const fileContent = fs.readFileSync(file, 'utf-8');
      const ast = acorn.parse(fileContent, { ecmaVersion: 'latest', sourceType: 'module' });

      const findFunctionNodes = (node) => {
        if (
          (node.type === 'FunctionDeclaration' && functionNames.includes(node.id.name)) ||
          (node.type === 'VariableDeclarator' &&
            node.init &&
            node.init.type === 'FunctionExpression' &&
            functionNames.includes(node.id.name))
        ) {
          return fileContent.slice(node.start, node.end);
        }

        let foundFunction = '';
        if (node.body) {
          const bodyNodes = Array.isArray(node.body) ? node.body : node.body.body;
          if (bodyNodes) {
            for (const childNode of bodyNodes) {
              foundFunction = findFunctionNodes(childNode);
              if (foundFunction) {
                break;
              }
            }
          }
        }
        return foundFunction;
      };

      for (const functionName of functionNames) {
        const functionCode = findFunctionNodes(ast);
        if (functionCode) {
          functionSourceCode += `File: ${file}\n\n${functionCode}\n\n`;
        }
      }
    } catch (error) {
      console.error("Error reading file:", file, error);
    }
  }

  console.log(functionSourceCode);
  return functionSourceCode;
}

getFunctionSourceCode(["getFunctionSourceCode"]);
