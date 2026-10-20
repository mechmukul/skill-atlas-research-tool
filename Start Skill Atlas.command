#!/bin/zsh
set -e
cd "${0:A:h}"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if [[ ! -x 'output/Skill Atlas.app/Contents/MacOS/SkillAtlas' ]]; then
  node dashboard/scripts/build-mac-app.mjs
fi
open 'output/Skill Atlas.app'
