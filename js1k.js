// voxel based on https://github.com/s-macke/VoxelSpace
// heightmap based on http://www.playfuljs.com/realistic-terrain-in-130-lines/

/*
  ideas:
    - blur heightmap
    - increase map from 1024x1024 to 2048x2048
    - add geometric form (house? wall?) to the map
*/

(() => {

var cameraX = 0;
var cameraY = 0;
var cameraAngle = 0;
// avoid beeing stuck at the beginning
var cameraHeight=1024;

//buf32 and buf8 are just ArrayBuffer views to convert data
var tmp = new ArrayBuffer(a.width * a.height << 2);
var buf32 = new Uint32Array(tmp);
var buf8 = new Uint8Array(tmp);
var hiddeny = Array(a.width);
var heightmap = [];
var colormap = [];
var time=0;
var imagedata = c.createImageData(a.width, a.height);

// GENERATE HEIGHTMAP START
// array size is 1025x1025 - however 2 millions can be written much shorter
var mapOrOffset = Array(2e6).fill(0);

var divide = (size) => {
  if (size == 1) return;
  var half = size / 2;

  for (var y = half; y < 1025; y += size) {
    for (var x = half; x < 1025; x += size) {
      //SQUARE
      tmp = (
        mapOrOffset[((x - half) & 1023) + ((y - half) & 1023) * 1025] +
        mapOrOffset[((x + half) & 1023) + ((y - half) & 1023) * 1025] +
        mapOrOffset[((x + half) & 1023) + ((y + half) & 1023) * 1025] +
        mapOrOffset[((x - half) & 1023) + ((y + half) & 1023) * 1025]
      ) / 4 + Math.random() * 4 * size - 1.5 * size;
      // zoom in
      //) / 4 + Math.random() * 2 * size - .75 * size;
      mapOrOffset[x + 1025 * y] = (tmp<255) ? 255 : ((tmp>1024) ? 1024 : tmp);
    }
  }
  for (var y = 0; y < 1025; y += half) {
    for (var x = (y + half) % size; x < 1025; x += size) {
      //DIAMOND
      tmp = (
        mapOrOffset[(x & 1023) + ((y - half) & 1023) * 1025] +
        mapOrOffset[((x + half) & 1023) + (y & 1023) * 1025] +
        mapOrOffset[(x & 1023) + ((y + half) & 1023) * 1025] +
        mapOrOffset[((x - half) & 1023) + (y & 1023) * 1025]
      ) / 4 + Math.random() * 4 * size - 1.5 * size;
      mapOrOffset[x + 1025 * y] = (tmp<255) ? 255 : ((tmp>1024) ? 1024 : tmp);
    }
  }
  divide(half);
};
divide(1024);

// GENERATE BLACK BLOCKS
for (var l=0;l < 1025; l++) {
  var yofs = l%64 ? yofs : Math.random()*16 << 6;
  for (var j=yofs; j < yofs+64; j++) {
    mapOrOffset[j * 1025 + l] = 1024;
  }
}

// GENERATE COLORMAP FROM HEIGHTMAP
for (var i=0, tmp=0; i<2e6; i++) {
  //convert the 1025*1025 height map to a 1024*1024 heightmap and color map
  if (i%1025!=1024 && mapOrOffset[i]) {
    var heightMapEntry = mapOrOffset[i]>>2;

    //generate smooth color dynamically, 5 equals the size of the pallete array: (heightMapEntry/(255 / 5))|0

    //fancy pallette - if no entry exists, its converted to 0
    var col1 = [[], [102], [192,51,16], [102],[]][ ((heightMapEntry/(255 / 5)+1)|0)%5];
    var col2 = [[], [102], [192,51,16], [102],[]][  (heightMapEntry/(255 / 5)   |0)%5];
    var selectedPalleteEntry = (heightMapEntry%(255 / 5))/(255 / 5);

    //the alpha channel is used as a dead cheap shadow map, if current pixel is bigger than last -> it is exposed to light
    //note: instead the "high resolution" shadowmap (i-1), use (i-10) to get a snowy map
    colormap[tmp    ] = (((heightMapEntry>102 && mapOrOffset[(i - 1)] < mapOrOffset[i]) ? 247 : 255)<<24) |
      (((col1[0]|0)*selectedPalleteEntry + (col2[0]|0)*(1-selectedPalleteEntry))) |
      (((col1[1]|0)*selectedPalleteEntry + (col2[1]|0)*(1-selectedPalleteEntry)) << 8) |
      ( (col1[2]|0)*selectedPalleteEntry + (col2[2]|0)*(1-selectedPalleteEntry)) << 16;

    colormap[tmp+2e6] = (((heightMapEntry>102 && mapOrOffset[(i - 1)] < mapOrOffset[i]) ? 240 : 255)<<24) |
      (((col1[0]|0)*selectedPalleteEntry + (col2[0]|0)*(1-selectedPalleteEntry))) |
      (((col1[1]|0)*selectedPalleteEntry + (col2[1]|0)*(1-selectedPalleteEntry)) << 8) |
      ( (col1[2]|0)*selectedPalleteEntry + (col2[2]|0)*(1-selectedPalleteEntry)) << 16;

    heightmap[tmp++] = heightMapEntry;
  }
};

setInterval(() => {

// ## UPDATE CAMERA
    var sinang = Math.sin(cameraAngle);
    var cosang = Math.sin(cameraAngle + 1.6);

    cameraX -= sinang * (Date.now()-time) / 8;
    cameraY -= cosang * (Date.now()-time) / 8;

    //camera angle update
    //TODO cameraHeight/2 looks better
    cameraAngle += Math.sin(
      (
        //update time
        time = Date.now()
      )
      /2e3
    ) / (
      //average camera height calculation
      cameraHeight = (cameraHeight + heightmap[((cameraY & 1023) << 10) + (cameraX & 1023)])/2
    );

// ## DRAW BACKGROUND
    buf32.fill((time%16 ?
     //regular drawing
     (tmp=0, 255) :

     //lightning mode - select other colormap with highlighted colors and shake camera
     (tmp=2e6, cameraHeight += 8, 240)
   // shift the returning color to act as alpha color
   )<<24);

// ## DRAW VOXEL
    hiddeny.fill(a.height);
    // Draw from front to back, implement primitive LOD after a certain distance
    for (var z=16; z<2e3; z += z < 1024 ? 1 : 4) {
      // 90 degree field of view
      var plx = -cosang * z - sinang * z;
      var ply = sinang * z - cosang * z;
      var dx = (cosang * z - sinang * z - plx) / a.width;
      var dy = (-sinang * z - cosang * z - ply) / a.height;
      plx += cameraX;
      ply += cameraY;

      // DEFINE HEIGHT (1/z * 240)
      for (var i=0; i<a.width; i++) {
        var mapoffset = ((ply & 1023) << 10) + (plx & 1023);
        // beware: if heightonscreen < 0 it will stop rendering!
        // TODO use heightmap[mapoffset] to compare if it needs to draw, should speedup rendering
        var heightonscreen = ((cameraHeight + 192 - heightmap[mapoffset]) * a.width / (4*z))|0;
        // DrawVerticalLine start
        for (; heightonscreen < hiddeny[i]; hiddeny[i] = heightonscreen) {
          // get offset on screen for the vertical line
          for (var k = heightonscreen; k < hiddeny[i]; k++) {
            buf32[k * a.width + i] = colormap[tmp + mapoffset];
          }
        }
        // DrawVerticalLine end

        plx += dx;
        ply += dy;
      }
    }

// ## FLIP SCREEN
    imagedata.data.set(buf8);
    c.putImageData(imagedata,0,0);
},0);

})();
