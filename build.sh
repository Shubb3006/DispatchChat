#!/bin/bash
set -e

echo "Building Dispatch Frontend..."
cd Dispatch/frontend
npm install
npm run build

echo "Copying dist to root..."
cd ../..
rm -rf dist
cp -r Dispatch/frontend/dist ./dist

echo "Build complete! Output in ./dist"
