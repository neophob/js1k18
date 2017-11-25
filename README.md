# js1k2017 - NO SIGNAL

Compo entry for http://js1k.com/2017-magic/, demo url: http://js1k.com/TODO

NO SIGNAL shows an EBS TV screen featuring visual glitches.

## Random Notes:
- Build Process: Babili as minifier - Babili processed files compress better with Regpack
- Regpack options: `REGPACK_OPT5="- --useES6 true --hash2DContext --contextVariableName 'c' --crushGainFactor 4 --crushLengthFactor 1 --crushCopiesFactor 0"` - please see `minime.sh`
- JPEG Glitcher looks great in Chrome and Firefox, Safari however looks like it corrects the error better (thus the result looks worse)

## Features:
- HTML5 Audio (Noise, Gain, Oscillator, Merger)
- Adaptive audio gain
- UTF8 Fonts
- JPEG Glitcher using canvas.toDataURL
- Full screen Scanlines
- Full screen Color Glitcher (shift one channel)
- TV Testscreen (EBS) generator
