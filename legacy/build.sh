#!/bin/bash

# Check if an argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

VERSION=$1

docker compose build
docker tag test_flask_autonome-flask_app albertozurini/eliza-test-autonome2025:$VERSION
docker push albertozurini/eliza-test-autonome2025:$VERSION
echo "albertozurini/eliza-test-autonome2025:$VERSION"