#!/bin/bash

BABILI=./node_modules/.bin/babel-minify
REGPACK=./node_modules/.bin/regpack
UGLIFY=./node_modules/.bin/uglifyjs
CLOSURE=./node_modules/.bin/google-closure-compiler-js
OUT=./dist

BABELMINIFY_OPT="--builtIns false --typeConstructors false"
REGPACK_OPT0="- --useES6 true --reassignVars true --hash2DContext true --contextVariableName c --crushGainFactor 2 --crushLengthFactor 1 --crushCopiesFactor 0 --crushTiebreakerFactor 0"
REGPACK_OPT1="- --useES6 true --reassignVars true --hash2DContext true --contextVariableName c --crushGainFactor 5 --crushLengthFactor 1 --crushCopiesFactor 0 --crushTiebreakerFactor 0"
REGPACK_OPT2="- --useES6 true --reassignVars true --hash2DContext true --contextVariableName c --crushGainFactor 3 --crushLengthFactor 2 --crushCopiesFactor 1"
REGPACK_OPT3="- --useES6 true --reassignVars true --hash2DContext true --contextVariableName 'c' --crushGainFactor 4 --crushLengthFactor 4 --crushCopiesFactor 1"
REGPACK_OPT4="- --useES6 true --reassignVars true --hash2DContext true --contextVariableName 'c' --crushGainFactor 4 --crushLengthFactor 0 --crushCopiesFactor 0 --crushTiebreakerFactor 0"
REGPACK_OPT5="- --useES6 true --reassignVars true --hash2DContext true --contextVariableName c --crushGainFactor 4 --crushLengthFactor 1 --crushCopiesFactor 0"
REGPACK_OPT6="- --useES6 true --reassignVars true --hash2DContext true --contextVariableName 'c' --crushGainFactor 5 --crushLengthFactor 1 --crushCopiesFactor 0"
REGPACK_OPT7="- --useES6 true --reassignVars true --hash2DContext true --contextVariableName 'c' --crushGainFactor 5 --crushLengthFactor 4 --crushCopiesFactor 3"
REGPACK_OPT8="- --useES6 true --reassignVars true --hash2DContext true --contextVariableName 'c' --crushGainFactor 5 --crushLengthFactor 0 --crushCopiesFactor 0 --crushTiebreakerFactor 0"
REGPACK_OPT9="- --useES6 true --reassignVars true --hash2DContext true --contextVariableName 'c' --crushGainFactor 4 --crushLengthFactor 1 --crushCopiesFactor 0 --crushTiebreakerFactor 0"
REGPACK_OPTA="- --useES6 true --reassignVars true --hash2DContext true --contextVariableName 'c' --crushGainFactor 5 --crushLengthFactor 1 --crushCopiesFactor 0 --crushTiebreakerFactor 0"
REGPACK_OPTB="- --useES6 true --reassignVars true --hash2DContext true --contextVariableName 'c' --crushGainFactor 16 --crushLengthFactor 8 --crushCopiesFactor 0 --crushTiebreakerFactor 0"
REGPACK_OPTC="- --useES6 true --reassignVars true --hash2DContext true --contextVariableName 'c' --crushGainFactor 3 --crushLengthFactor 2 --crushCopiesFactor 1 --crushTiebreakerFactor 0"
REGPACK_OPTD="- --useES6 true --reassignVars true --hash2DContext true --contextVariableName 'c' --crushGainFactor 64 --crushLengthFactor 8 --crushCopiesFactor 0"
REGPACK_OPTE="- --useES6 true --reassignVars true --hash2DContext true --contextVariableName 'c' --crushGainFactor 1 --crushLengthFactor 0 --crushCopiesFactor 0"
REGPACK_OPTF="- --useES6 true --reassignVars true --hash2DContext true --contextVariableName 'c' --crushGainFactor 2 --crushLengthFactor 1 --crushCopiesFactor 3  --crushTiebreakerFactor 0"

mkdir -p $OUT

BAB_PACK() {
  OPT=$1
  $REGPACK $OUT/in $OPT > $OUT/js1k-babili-regpacked-$2.js
  printf %s "$(cat $OUT/js1k-babili-regpacked-$2.js)" > $OUT/js1k-babili-regpacked-$2-no-newlines.js
  rm $OUT/js1k-babili-regpacked-$2.js
}

UGLIFY_PACK() {
  $UGLIFY -c -m --timings --warn -o ./dist/uglify.js -- js1k.js
  $REGPACK $OUT/uglify.js $REGPACK_OPT1 > $OUT/js1k-uglify-regpacked-1.js
}

CLOSURE_PACK() {
  $CLOSURE --languageOut ES6 js1k.js > ./dist/closure.js
  $REGPACK $OUT/closure.js $REGPACK_OPT1 > $OUT/js1k-closure-regpacked-1.js
}

REGPACK_PACK() {
  OPT=$1
  $REGPACK js1k.js $OPT > $OUT/js1k-regpacked-1.js
}

echo "[MINIME] START"
rm -f $OUT/*

$BABILI js1k.js $BABELMINIFY_OPT > $OUT/in.tmp
# remove trailing ;
sed 's/.$//' $OUT/in.tmp | tee $OUT/in
#CLOSURE_PACK&
BAB_PACK "$REGPACK_OPT1" 1
BAB_PACK "$REGPACK_OPT2" 2
BAB_PACK "$REGPACK_OPT3" 3
#BAB_PACK "$REGPACK_OPT4" 4
BAB_PACK "$REGPACK_OPT5" 5
BAB_PACK "$REGPACK_OPT6" 6
#BAB_PACK "$REGPACK_OPT7" 7
#BAB_PACK "$REGPACK_OPT8" 8
BAB_PACK "$REGPACK_OPT9" 9
#BAB_PACK "$REGPACK_OPTA" A
BAB_PACK "$REGPACK_OPTB" B
BAB_PACK "$REGPACK_OPTC" C
#BAB_PACK "$REGPACK_OPTD" D
#BAB_PACK "$REGPACK_OPTE" E
BAB_PACK "$REGPACK_OPTF" F
#UGLIFY_PACK
echo "[MINIME] WAIT"

ls -alS $OUT/* | sort -k 5 -n
