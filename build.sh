#!/bin/bash

# Check if an argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

VERSION=$1

docker compose build
docker tag test_flask_autonome-flask_app albertozurini/autonome-aivs:$VERSION
docker push albertozurini/autonome-aivs:$VERSION
echo "albertozurini/autonome-aivs:$VERSION"
