#!/bin/zsh
set -e
project_dir="${0:A:h}"
exec python3 "${project_dir}/scripts/serve.py"
