const fs = require('fs');
const path = require('path');

const tokensPath = path.resolve(
  __dirname,
  '../src/styles/tokens/style-tokens.json'
);

const tokens = require(tokensPath);

const variables = [];

function transformReference(value) {
  return value.replace(/\{([^}]+)\}/g, (_, reference) => {
    return `$${reference.replace(/\./g, '-')}`;
  });
}

function transformBoxShadow(value) {
  const { x, y, blur, spread, color } = value;

  const addPx = (number) => {
    return number === '0' || number === 0 ? '0' : `${number}px`;
  };

  return `${addPx(x)} ${addPx(y)} ${addPx(blur)} ${addPx(spread)} ${color}`;
}

function transformTypography(value) {
  const {
    fontFamily,
    fontWeight,
    lineHeight,
    fontSize
  } = value;

  return `(
  font-family: ${transformReference(fontFamily)},
  font-weight: ${transformReference(fontWeight)},
  line-height: ${transformReference(lineHeight)},
  font-size: ${transformReference(fontSize)}
)`;
}

function transformValue(token) {
  const { value, type } = token;

  if (typeof value === 'string' && value.includes('{')) {
    return transformReference(value);
  }

  if (type === 'boxShadow' && typeof value === 'object') {
    return transformBoxShadow(value);
  }

  if (type === 'typography' && typeof value === 'object') {
    return transformTypography(value);
  }

  if (typeof value === 'object') {
    return value;
  }

  switch (type) {
    case 'fontWeights': {
      const fontWeightMap = {
        Light: 300,
        Regular: 400,
        Bold: 700,
        Black: 900
      };

      return fontWeightMap[value] ?? value;
    }

    case 'borderRadius':
    case 'borderWidth':
    case 'sizing':
    case 'fontSizes':
    case 'lineHeights':
    case 'spacing':
      if (value === 0 || value === '0') {
        return '0';
      }

      if (typeof value === 'string' && /[a-z%]+$/i.test(value)) {
        return value;
      }

      return `${value}px`;

    case 'time':
      return value === 0 || value === '0'
        ? '0ms'
        : `${value}ms`;

    default:
      return value;
  }
}


function generateVariables(obj, path = []) {
  Object.entries(obj).forEach(([key, value]) => {
    const currentPath = [...path, key];

    if (value && typeof value === 'object' && 'value' in value) {
      const transformedValue = transformValue(value);

      variables.push({
        name: `$${currentPath.join('-')}`,
        value: transformedValue
      });
    } else if (value && typeof value === 'object') {
      generateVariables(value, currentPath);
    }
  });
}

function getDependencies(variable) {
  if (typeof variable.value !== 'string') {
    return [];
  }

  return variable.value.match(/\$[\w-]+/g) || [];
}

function sortVariablesByDependency(variables) {
  const variableMap = new Map(
    variables.map((variable) => [variable.name, variable])
  );

  const sorted = [];
  const visited = new Set();

  function visit(variable) {
    if (visited.has(variable.name)) {
      return;
    }

    visited.add(variable.name);

    const dependencies = getDependencies(variable);

    dependencies.forEach((dependencyName) => {
      const dependency = variableMap.get(dependencyName);

      if (dependency) {
        visit(dependency);
      }
    });

    sorted.push(variable);
  }

  variables.forEach((variable) => {
    visit(variable);
  });

  return sorted;
}

generateVariables(tokens.common, ['common']);
generateVariables(tokens.semantic.semantic, ['semantic']);
generateVariables(tokens.component.component, ['component']);

const sortedVariables = sortVariablesByDependency(variables);

const scssContent = sortedVariables
  .map((variable) => `${variable.name}: ${variable.value};`)
  .join('\n');

const outputPath = path.resolve(
  __dirname,
  '../src/styles/tokens/_tokens.scss'
);

fs.writeFileSync(
  outputPath,
  `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.\n\n${scssContent}\n`,
  'utf8'
);

console.log(`Tokens generated: ${outputPath}`);