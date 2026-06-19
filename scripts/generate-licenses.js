const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const nodeModulesPath = path.join(__dirname, '../node_modules');
const outputDir = path.join(__dirname, '../src/assets/data');
const outputPath = path.join(outputDir, 'licenses.json');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const dependencies = { ...packageJson.dependencies };

const INTERNAL_MODULES = [
  {
    id: "genyt-youtube-extractor",
    name: "GenYT YouTube Extractor",
    path: path.join(__dirname, '../modules/genyt-youtube-extractor'),
    version: "1.0.0"
  },
  {
    id: "genyt-video-player",
    name: "GenYT Video Player",
    path: path.join(__dirname, '../modules/genyt-video-player'),
    version: "1.0.0"
  }
];

const licenses = [];

for (const dep of Object.keys(dependencies)) {
  const depPackageJsonPath = path.join(nodeModulesPath, dep, 'package.json');
  if (fs.existsSync(depPackageJsonPath)) {
    const depPackageJson = JSON.parse(fs.readFileSync(depPackageJsonPath, 'utf8'));
    let licenseText = 'License text not found.';
    
    const possibleLicenseFiles = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'license.md'];
    for (const file of possibleLicenseFiles) {
      const licenseFilePath = path.join(nodeModulesPath, dep, file);
      if (fs.existsSync(licenseFilePath)) {
        licenseText = fs.readFileSync(licenseFilePath, 'utf8');
        break;
      }
    }

    let licenseType = depPackageJson.license;
    if (typeof licenseType === 'object' && licenseType.type) {
      licenseType = licenseType.type;
    }

    let publisher = depPackageJson.author;
    if (typeof publisher === 'object' && publisher.name) {
      publisher = publisher.name;
    } else if (typeof publisher === 'string') {
      publisher = publisher.split('<')[0].trim();
    } else if (depPackageJson.contributors && depPackageJson.contributors.length > 0) {
      const firstContributor = depPackageJson.contributors[0];
      publisher = typeof firstContributor === 'object' ? firstContributor.name : firstContributor.split('<')[0].trim();
    }

    let repository = depPackageJson.repository;
    if (typeof repository === 'object' && repository.url) {
      repository = repository.url;
    }
    if (repository && typeof repository === 'string') {
      if (repository.startsWith('git+')) {
        repository = repository.slice(4);
      }
      if (repository.startsWith('git://')) {
        repository = 'https://' + repository.slice(6);
      }
      if (repository.endsWith('.git')) {
        repository = repository.slice(0, -4);
      }
    }

    licenses.push({
      id: dep,
      name: dep,
      version: depPackageJson.version,
      licenseType: licenseType || 'Unknown',
      publisher: publisher || 'Community',
      repository: repository || '',
      licenseText: licenseText,
    });
  }
}

for (const mod of INTERNAL_MODULES) {
  let licenseText = 'License text not found.';
  const licenseFilePath = path.join(mod.path, 'LICENSE');
  if (fs.existsSync(licenseFilePath)) {
    licenseText = fs.readFileSync(licenseFilePath, 'utf8');
  }
  
  const entry = {
    id: mod.id,
    name: mod.name,
    version: mod.version,
    licenseType: 'MIT',
    publisher: 'Sachin Yadav',
    repository: 'https://github.com/SachinYedav/genyt-native',
    licenseText: licenseText
  };

  const existingIndex = licenses.findIndex(l => l.id === mod.id);
  if (existingIndex >= 0) {
    licenses[existingIndex] = entry;
  } else {
    licenses.push(entry);
  }
}

const NATIVE_DEPENDENCIES = [
  {
    id: "newpipe-extractor",
    name: "NewPipe Extractor",
    version: "v0.26.3",
    licenseType: "GPL-3.0",
    publisher: "TeamNewPipe",
    repository: "https://github.com/TeamNewPipe/NewPipeExtractor",
    licenseText: "GNU General Public License v3.0\n\nPermissions of this strong copyleft license are conditioned on making available complete source code of licensed works and modifications, which include larger works using a licensed work, under the same license. Copyright and license notices must be preserved. Contributors provide an express grant of patent rights."
  },
  {
    id: "media3",
    name: "AndroidX Media3",
    version: "1.3.1",
    licenseType: "Apache-2.0",
    publisher: "Google (Android Open Source Project)",
    repository: "https://github.com/androidx/media",
    licenseText: "Apache License, Version 2.0\n\nLicensed under the Apache License, Version 2.0 (the \"License\");\nyou may not use this file except in compliance with the License.\nUnless required by applicable law or agreed to in writing, software\ndistributed under the License is distributed on an \"AS IS\" BASIS,\nWITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied."
  },
  {
    id: "kotlinx-coroutines",
    name: "Kotlinx Coroutines",
    version: "1.10.2",
    licenseType: "Apache-2.0",
    publisher: "JetBrains",
    repository: "https://github.com/Kotlin/kotlinx.coroutines",
    licenseText: "Apache License, Version 2.0\n\nLicensed under the Apache License, Version 2.0 (the \"License\");\nyou may not use this file except in compliance with the License.\nUnless required by applicable law or agreed to in writing, software\ndistributed under the License is distributed on an \"AS IS\" BASIS,\nWITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied."
  }
];

for (const mod of NATIVE_DEPENDENCIES) {
  const existingIndex = licenses.findIndex(l => l.id === mod.id);
  if (existingIndex >= 0) {
    licenses[existingIndex] = mod;
  } else {
    licenses.push(mod);
  }
}

licenses.sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(outputPath, JSON.stringify(licenses, null, 2), 'utf8');
console.log(`Successfully generated licenses.json with ${licenses.length} packages at ${outputPath}`);
