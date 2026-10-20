#!/bin/zsh
cd "${0:A:h}/dashboard"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if [[ -x '../output/Skill Atlas.app/Contents/Resources/runtime/node' ]]; then
  '../output/Skill Atlas.app/Contents/Resources/runtime/node' scripts/start-local.mjs --stop
else
  node scripts/start-local.mjs --stop
fi
