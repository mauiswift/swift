#!/bin/bash
set -e

echo "🔨 Building Swift frontend with fixes..."
cd frontend

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🏗️  Building production bundle..."
pnpm build

echo "📁 Copying built assets to backend static folder..."
cp -r dist/* ../backend/static/

echo "✅ Build complete! Assets are ready for deployment."
echo ""
echo "📋 Next steps:"
echo "1. Review changes: git status"
echo "2. Stage changes: git add ."
echo "3. Commit: git commit -m 'fix: resolve dynamic import CORS errors and improve error handling'"
echo "4. Push: git push origin main"
echo ""
echo "🚀 Your application will be rebuilt and redeployed with the fixes!"
