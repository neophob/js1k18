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
var tmpBuffer = new ArrayBuffer(a.width * a.height * 4);
var buf8   = new Uint8Array(tmpBuffer);
var buf32  = new Uint32Array(tmpBuffer);
var heightmap = [];
var colormap = [];
var time=0;

// Mechanized Abbreviation - thanks to https://marijnhaverbeke.nl/js1k/slides/#12
//for($ in a) a[$[0]+($[1]||'')]=a[$];
//console.log('A',a);

var imagedata = c.createImageData(a.width, a.height);

// GENERATE HEIGHTMAP START

// array size is 1025x1025 - however 2 millions can be written much shorter
var map = new Array(2000000);
map.fill(0);

var tmp;

var divide = (size) => {
  if (size < 2) return;
  var half = size / 2;
  //roughness is 2.4

  for (var y = half; y < 1024; y += size) {
    for (var x = half; x < 1024; x += size) {
      //SQUARE
      tmp = (
        map[((x - half) & 1023) + ((y - half) & 1023) * 1025] +
        map[((x + half) & 1023) + ((y - half) & 1023) * 1025] +
        map[((x + half) & 1023) + ((y + half) & 1023) * 1025] +
        map[((x - half) & 1023) + ((y + half) & 1023) * 1025]
      ) / 4 + Math.random() * 4.3 * size - (1.7 * size);
      map[x + 1025 * y] = (tmp<0) ? 0 : (tmp>1024) ? 1024 : tmp;
    }
  }
  for (var y = 0; y <= 1024; y += half) {
    for (var x = (y + half) % size; x <= 1024; x += size) {
      //DIAMOND
      tmp = (
        map[(x & 1023) + ((y - half) & 1023) * 1025] +
        map[((x + half) & 1023) + (y & 1023) * 1025] +
        map[(x & 1023) + ((y + half) & 1023) * 1025] +
        map[((x - half) & 1023) + (y & 1023) * 1025]
      ) / 4 + Math.random() * 4.3 * size - (1.7 * size);
      map[x + 1025 * y] = (tmp<0) ? 0 : (tmp>1024) ? 1024 : tmp;
    }
  }
  divide(half);
};

//set initial points - not needed
//map[0] = 1024;
// generate heigthmap
divide(1024);
tmp=0;

map.forEach((r,i)=>{
  //convert the 1025*1025 map to a 1024*1024 heightmap and color map
  if (i%1025!=1024) {
    //hm[tmp++] =
//    var heightMapEntry = Math.floor(255 * (r/1024));
    var heightMapEntry = (r/4)|0;

    //generate smooth color dynamically, 5 equals the size of the pallete array
    var ofs = (heightMapEntry/(255 / 5))|0;

    //fancy pallette - if no entry exists, its converted to 0
    var col1 = [[], [0x58,5], [0xac,0x67,0x62], [0x58,5],[]][(ofs+1)%5];
    var col2 = [[], [0x58,5], [0xac,0x67,0x62], [0x58,5],[]][(ofs)%5];
    var selectedPalleteEntry = 5*(heightMapEntry%(255 / 5));
    var oppositeColor = 255-selectedPalleteEntry;

    //the alpha channel is used as a dead cheap shadow map
    colormap[tmp] = (((i > 2 && heightMapEntry>100 && map[(i - 1)] < r) ? 0xf7 : 0xff)<<24) |
      ((((col1[0]|0)*selectedPalleteEntry + (col2[0]|0)*oppositeColor) >>8)  ) |
      ((((col1[1]|0)*selectedPalleteEntry + (col2[1]|0)*oppositeColor) >>8) << 8) |
      (( (col1[2]|0)*selectedPalleteEntry + (col2[2]|0)*oppositeColor) >>8) << 16;

    colormap[tmp+2000000] = (((i > 2 && heightMapEntry>100 && map[(i - 1)] < r) ? 0xe5 : 0xff)<<24) |
      ((((col1[0]|0)*selectedPalleteEntry + (col2[0]|0)*oppositeColor) >>8)  ) |
      ((((col1[1]|0)*selectedPalleteEntry + (col2[1]|0)*oppositeColor) >>8) << 8) |
      (( (col1[2]|0)*selectedPalleteEntry + (col2[2]|0)*oppositeColor) >>8) << 16;

    heightmap[tmp++] = heightMapEntry < 70 ? 70 : heightMapEntry;

  }
});
// GENERATE HEIGHTMAP END

setInterval(() => {

// ## UPDATE CAMERA
//input.leftright -1 .. 1
//cameraHorizon -500 .. 500
//input.updown init: -10 .. 10

    time = Date.now()-time;

    var sinang = Math.sin(cameraAngle);
    var cosang = Math.sin(cameraAngle + 1.57);

    cameraX -=  sinang * time * 0.1;
    cameraY -=  cosang * time * 0.1;

    var cameraHeight = heightmap[
      /* get map offset*/ ((Math.floor(cameraY) & 1023) << 10) + (Math.floor(cameraX) & 1023)
    ];

    time = Date.now();
    cameraAngle += Math.sin(0.0008*time)/cameraHeight;

// ## DRAW BACKGROUND

    //show blitz in the background
    buf32.fill(time%16 ? 0xff000000 : 0xf4000538);

// ## VOXEL START

    //if there's a blitz - select other colormap with highlighted colors
    tmp = time%16 ? 0 : 2000000;

    var hiddeny = new Array(a.width);
    hiddeny.fill(a.height);
    // Draw from front to back, 1024 is CAMERA DISTANCE
    for (var z=1; z<3000; z++) {
        //improve rendering speed, increase z as we go away from the front
        if (z > 700) z+=2;

        // 90 degree field of view
        //var prx =   cosang * z - sinang * z;
        var plx =  -cosang * z - sinang * z;
        var ply =   sinang * z - cosang * z;
        //var pry =  -sinang * z - cosang * z;

        var dx = ((cosang * z - sinang * z) - plx) / a.width;
        var dy = ((-sinang * z - cosang * z) - ply) / a.width;
        plx += cameraX;
        ply += cameraY;

        // DEFINE HEIGHT (1/z * 240)
        var invz = 240 / z;
        for (var i=0; i<a.width; i++) {
          // |0 is math floor - way faster here than Math.floor
          var mapoffset = (((ply|0    ) & 1023) << 10) + ((plx|0) & 1023);
          //var heightonscreen = ((192 + cameraHeight - heightmap[mapoffset]) * invz + 127/*cameraHorizon|0*/)|0;
          var heightonscreen = ((255 + cameraHeight - heightmap[mapoffset]) * invz + 150/*cameraHorizon|0*/)|0

          //DrawVerticalLine(i, heightonscreen, hiddeny[i], colormap[mapoffset]);
          if (heightonscreen < hiddeny[i]) {
            if (heightonscreen < 0) heightonscreen = 0;
            // get offset on screen for the vertical line
            var offset = (heightonscreen * a.width) + i;
            for (var k = heightonscreen; k < hiddeny[i]; k++) {
                buf32[offset] = colormap[tmp + mapoffset];
                offset += a.width;
            }
            hiddeny[i] = heightonscreen;
          }
          //DrawVerticalLine end

          plx += dx;
          ply += dy;
        }
    }
// ## FLIP SCREEN

    imagedata.data.set(buf8);
    c.putImageData(imagedata,0,0);
}, 0);

})();
