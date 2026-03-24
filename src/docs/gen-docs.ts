import { config } from 'dotenv';
import * as fs from 'node:fs';
import { stringify } from 'yaml';
import { getOpenApiDocumentation } from '../docs/openapi';
config();

function build() {
  try {
    const spec = getOpenApiDocumentation();
    // Write to yaml
    fs.writeFileSync('./openapi.yaml', stringify(spec), 'utf8');
    console.log('✅ Success: openapi.yaml generated.');
  } catch (err) {
    console.error('❌ Error generating docs:', err);
    process.exit(1);
  }
}

build();
